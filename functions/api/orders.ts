/**
 * POST /api/orders — server-authoritative order creation.
 *
 * The client NEVER sends prices. It sends product ids + quantities; the server
 * recomputes every line, validates stock and coupons, and commits order + stock
 * + coupon usage + idempotency atomically.
 *
 * Modes:
 *   { mode: 'quote' }                        — compute totals, no writes
 *   { mode: 'create', requestId, ... }       — atomically create the order
 *   { mode: 'cancel', orderId, reason }      — staff-only cancel with stock restore
 *
 * Auth: Authorization: Bearer <Firebase ID token>
 */

import { verifyIdToken, extractBearer } from '../lib/auth';
import { getDoc, batchGet, commitWrites, AbortedError, type FirestoreDoc } from '../lib/firestore';
import { computeQuote, buildOrderDocument, planOrderWrites, resolveProductStock, type OrderRequestItem, type ProductDoc } from '../lib/orderEngine';
import { validateCoupon, type CouponRecord } from '../lib/coupons';
import { rateLimiter, getClientIP } from '../lib/rateLimit';
import { ORDER_TRANSITIONS, isTerminal } from '../lib/stateMachine';

const limiter = rateLimiter(120, 60_000);
const SETTINGS_ID = 'app';

const STAFF_ROLES = [
  'owner', 'super_admin', 'admin', 'manager', 'accounting', 'customer_service',
  'inventory', 'warehouse', 'barista', 'marketing', 'supplier_manager', 'support',
  'analyst', 'product_manager', 'wholesale_manager',
];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function corsHeaders(): Record<string, string> {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'Content-Type, Authorization',
    'access-control-max-age': '86400',
  };
}

interface EnvLike {
  [key: string]: string | undefined;
}

async function loadSettings(settingsDoc?: FirestoreDoc): Promise<{ exchangeRate: number; deliveryFeeLbp: number; freeDeliveryThresholdLbp: number }> {
  const data = settingsDoc?.exists ? settingsDoc.data : (await getDoc('site_settings', SETTINGS_ID)).data;
  return {
    exchangeRate: Number(data.exchangeRate ?? 89500) || 89500,
    deliveryFeeLbp: Math.round(Number(data.deliveryFeeLbp ?? 25000) || 0),
    freeDeliveryThresholdLbp: Math.round(Number(data.freeDeliveryThresholdLbp ?? 1500000) || 0),
  };
}

function toCouponRecord(data: Record<string, unknown>, code: string): CouponRecord | null {
  if (!data || Object.keys(data).length === 0) return null;
  return {
    code,
    discountPercent: Number(data.discountPercent ?? 0),
    isActive: data.isActive as boolean | undefined,
    active: data.active as boolean | undefined,
    expiresAt: data.expiresAt as CouponRecord['expiresAt'],
    usageLimit: Number(data.usageLimit ?? 0),
    usedCount: Number(data.usedCount ?? 0),
    minOrderLbp: Number(data.minOrderLbp ?? 0),
  };
}

function sanitizeBody(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function parseItems(raw: unknown): OrderRequestItem[] {
  if (!Array.isArray(raw) || raw.length === 0) throw new HttpError(400, 'items: non-empty array required');
  return raw.slice(0, 50).map((it) => {
    const item = it as Record<string, unknown>;
    const productId = typeof item.productId === 'string' ? item.productId : '';
    const quantity = Number(item.quantity);
    if (!productId) throw new HttpError(400, 'items: productId required');
    if (!Number.isInteger(quantity) || quantity < 1) throw new HttpError(400, `items: invalid quantity for ${productId}`);
    const variantId = typeof item.variantId === 'string' && item.variantId ? item.variantId : undefined;
    const clientPrice = typeof item.clientPrice === 'number' ? item.clientPrice : undefined;
    return { productId, variantId, quantity, clientPrice };
  });
}

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function onRequest({ request, env }: { request: Request; env: EnvLike }) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const ip = getClientIP(request);
  const { allowed, retryAfterMs } = limiter.check(ip);
  if (!allowed) return json({ error: `Rate limit exceeded. Retry after ${Math.ceil(retryAfterMs / 1000)}s.` }, 429);

  const contentLength = Number(request.headers.get('content-length') || '0');
  if (contentLength && contentLength > 100_000) return json({ error: 'Request too large' }, 413);

  const token = extractBearer(request);
  if (!token) return json({ error: 'Authentication required' }, 401);
  let claims;
  try {
    claims = await verifyIdToken(token);
  } catch (err) {
    return json({ error: `Invalid session: ${(err as Error).message}` }, 401);
  }

  const body = sanitizeBody(await request.text());
  if (!body) return json({ error: 'Invalid JSON body' }, 400);

  const mode = body.mode === 'create' ? 'create' : body.mode === 'cancel' ? 'cancel' : 'quote';

  try {
    if (mode === 'cancel') {
      return await handleCancel(claims.uid, body, env);
    }

    const items = parseItems(body.items);
    const couponCode = typeof body.couponCode === 'string' && body.couponCode.trim() ? body.couponCode.trim().toUpperCase() : undefined;
    const requestId = mode === 'create' ? (typeof body.requestId === 'string' && body.requestId ? body.requestId : null) : null;
    if (mode === 'create' && !requestId) return json({ error: 'requestId is required for create' }, 400);

    const shipping = typeof body.shipping === 'object' && body.shipping !== null ? (body.shipping as Record<string, unknown>) : {};
    const deliveryDate = typeof body.deliveryDate === 'string' ? body.deliveryDate : undefined;
    const deliveryTime = typeof body.deliveryTime === 'string' ? body.deliveryTime : undefined;
    const customNotes = typeof body.customNotes === 'string' ? body.customNotes.slice(0, 2000) : undefined;
    const gateCode = typeof body.gateCode === 'string' ? body.gateCode.slice(0, 100) : undefined;

    // Load catalog + settings + coupon (all reads happen before any write).
    const productIds = [...new Set(items.map((i) => i.productId))];
    const productDocs = await batchGet(productIds.map((id) => ({ collection: 'products', docId: id })));
    const products: ProductDoc[] = productDocs.map((d, idx) => ({ id: productIds[idx], ...d.data }));
    const settings = await loadSettings();

    const couponDoc = couponCode ? await getDoc('coupons', couponCode) : null;
    const coupon = couponDoc?.exists ? toCouponRecord(couponDoc.data, couponCode as string) : null;
    if (couponCode && !couponDoc?.exists) {
      return json({ quote: null, error: 'Invalid coupon code' }, 200);
    }

    const quote = computeQuote({ items, products, settings, coupon, couponCode });

    if (mode === 'quote') {
      return json({ ok: true, mode: 'quote', quote }, 200);
    }

    // ---- create (idempotent) ----
    const reqId = requestId as string;
    const existing = await getDoc('order_requests', reqId);
    if (existing.exists) {
      const orderId = existing.data.orderId as string;
      return json({ ok: true, mode: 'create', orderId, idempotent: true }, 200);
    }

    if (!quote.ok) {
      return json({ ok: false, mode: 'create', error: 'Order cannot be completed', quote }, 409);
    }
    if (!shipping.street || !shipping.city || !shipping.phone || !shipping.fullName) {
      return json({ error: 'Shipping address is incomplete', quote }, 400);
    }
    if (!deliveryDate) return json({ error: 'deliveryDate is required' }, 400);

    const orderId = crypto.randomUUID();
    const orderDoc = buildOrderDocument({
      requestId: reqId,
      userId: claims.uid,
      userEmail: claims.email ?? undefined,
      quote,
      shipping: {
        fullName: String(shipping.fullName ?? ''),
        street: String(shipping.street ?? ''),
        building: String(shipping.building ?? ''),
        floor: String(shipping.floor ?? ''),
        city: String(shipping.city ?? ''),
        phone: String(shipping.phone ?? ''),
        gateCode: gateCode ?? String(shipping.gateCode ?? ''),
        instructions: String(shipping.instructions ?? ''),
        gpsCoordinates: (shipping.gpsCoordinates as { lat: number; lng: number } | null | undefined) ?? null,
      },
      deliveryDate,
      deliveryTime,
      customNotes,
      couponCode,
    });

    const writes = planOrderWrites({ orderDoc, orderId, requestId: reqId, products, quote, coupon });

    // Optimistic-concurrency read versions: products AND the coupon. Without the
    // coupon's updateTime precondition, two concurrent redemptions could both
    // read usedCount=N and both commit usedCount=N+1, overshooting usageLimit.
    const readVersions: Array<{ collection: string; docId: string; updateTime?: string }> =
      productDocs.map((d, idx) => ({ collection: 'products', docId: productIds[idx], updateTime: d.updateTime }));
    if (coupon && quote.coupon.valid && couponDoc?.exists) {
      readVersions.push({ collection: 'coupons', docId: couponCode as string, updateTime: couponDoc.updateTime });
    }

    try {
      await commitWrites(writes, readVersions);
    } catch (err) {
      if (err instanceof AbortedError) {
        // Someone else wrote a document we read (stock/coupon changed, or the
        // same requestId was created concurrently). Check idempotency, then fail.
        const again = await getDoc('order_requests', reqId);
        if (again.exists) {
          const orderId2 = again.data.orderId as string;
          return json({ ok: true, mode: 'create', orderId: orderId2, idempotent: true }, 200);
        }
        return json({ ok: false, mode: 'create', error: 'Stock changed while placing the order. Please review your cart and try again.', quote }, 409);
      }
      throw err;
    }

    return json({ ok: true, mode: 'create', orderId }, 201);
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error('[api/orders] error:', err);
    return json({ error: 'Internal error placing order' }, 500);
  }
}

/** Staff-only cancel: validates transition, restores stock atomically, records audit. */
async function handleCancel(uid: string, body: Record<string, unknown>, env: EnvLike) {
  const orderId = typeof body.orderId === 'string' && body.orderId ? body.orderId : null;
  const reason = typeof body.reason === 'string' && body.reason.trim() ? body.reason.slice(0, 500) : 'No reason provided';
  if (!orderId) throw new HttpError(400, 'orderId is required');

  const userDoc = await getDoc('users', uid);
  if (!userDoc.exists) throw new HttpError(403, 'Account not found');
  const role = userDoc.data.role as string;
  if (!STAFF_ROLES.includes(role)) throw new HttpError(403, 'Staff role required');

  const order = await getDoc('orders', orderId);
  if (!order.exists) throw new HttpError(404, 'Order not found');
  const orderData = order.data;
  const fromStatus = orderData.status as string;
  if (isTerminal(fromStatus)) throw new HttpError(409, 'Order is already finished');
  const to = 'cancelled';
  if (!ORDER_TRANSITIONS.some(([f, t]) => f === fromStatus && t === to)) {
    throw new HttpError(409, `Cannot cancel an order in status "${fromStatus}"`);
  }

  const items = Array.isArray(orderData.items) ? (orderData.items as Array<Record<string, unknown>>) : [];
  const productIds = [...new Set(items.map((i) => String(i.productId)).filter(Boolean))];
  const productDocs = await batchGet(productIds.map((id) => ({ collection: 'products', docId: id })));

  const writes: Array<{ collection: string; docId: string; data: Record<string, unknown>; precondition?: { exists?: boolean } }> = [];
  const now = new Date().toISOString();

  for (const item of items) {
    const productId = String(item.productId);
    const qty = Number(item.quantity) || 0;
    const variant = (item.variant as { id?: string } | undefined)?.id;
    const idx = productIds.indexOf(productId);
    const product = idx >= 0 ? productDocs[idx] : null;
    if (!product || !product.exists || qty <= 0) continue;
    const data = product.data as ProductDoc;
    if (variant) {
      const variants = (data.variants ?? []).map((v) =>
        v.id === variant ? { ...v, stock: Math.max(0, Number.isFinite(Number(v.stock)) ? Number(v.stock) + qty : qty) } : v
      );
      writes.push({ collection: 'products', docId: productId, data: { stock: resolveProductStock(data, variant) + qty, variants, updatedAt: now } });
    } else {
      writes.push({ collection: 'products', docId: productId, data: { stock: resolveProductStock(data) + qty, updatedAt: now } });
    }
  }

  writes.push({
    collection: 'orders',
    docId: orderId,
    data: { status: 'cancelled', cancelledAt: now, cancellationReason: reason, updatedAt: now },
  });
  writes.push({
    collection: 'audit_logs',
    docId: crypto.randomUUID(),
    data: {
      adminId: uid,
      actorId: uid,
      action: 'cancel_order',
      collection: 'orders',
      documentId: orderId,
      changes: { from: fromStatus, to: 'cancelled', reason },
      createdAt: now,
    },
  });

  await commitWrites(writes, [
    ...productDocs.map((d, i) => ({ collection: 'products', docId: productIds[i], updateTime: d.exists ? d.updateTime : undefined })),
    { collection: 'orders', docId: orderId, updateTime: order.updateTime },
  ]);
  return json({ ok: true, orderId, status: 'cancelled' }, 200);
}
