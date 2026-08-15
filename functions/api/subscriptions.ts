/**
 * POST /api/subscriptions — server-authoritative subscription creation.
 *
 * The client sends a plan id (or custom build items: product ids + quantities)
 * plus delivery logistics. The server recomputes the price from the plan
 * document (or from current product prices for custom builds) and snapshots
 * the items. No client-provided prices are ever trusted.
 *
 * Modes:
 *   { mode: 'quote', planId?, customItems? }  — compute price, no writes
 *   { mode: 'create', requestId, ... }        — atomically create the subscription
 *
 * Auth: Authorization: Bearer <Firebase ID token>
 */

import { verifyIdToken, extractBearer } from '../lib/auth';
import { getDoc, batchGet, commitWrites, AbortedError } from '../lib/firestore';
import { computeQuote, type OrderRequestItem, type ProductDoc, type OrderQuote } from '../lib/orderEngine';
import { toUsd, type Lbp } from '../lib/money';
import { rateLimiter, getClientIP } from '../lib/rateLimit';

const limiter = rateLimiter(120, 60_000);

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

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface PlanDoc {
  id: string;
  name?: string;
  price?: number;
  priceLbp?: number;
  priceUsd?: number;
  description?: string;
  features?: string[];
  frequency?: string;
  items?: Array<{ productId?: string; quantity?: number; name?: string; price?: number }>;
}

export async function onRequest({ request, env }: { request: Request; env: Record<string, string | undefined> }) {
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

  const userDoc = await getDoc('users', claims.uid);
  if (!userDoc.exists) return json({ error: 'Account not found. Please complete onboarding first.' }, 403);
  if (claims.emailVerified !== true) {
    return json({ error: 'Please verify your email before subscribing.' }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!body || typeof body !== 'object') return json({ error: 'Invalid JSON body' }, 400);

  const mode = body.mode === 'create' ? 'create' : 'quote';
  const planId = typeof body.planId === 'string' ? body.planId : undefined;
  const customRaw = Array.isArray(body.customItems) ? (body.customItems as Array<Record<string, unknown>>) : null;

  if (!planId && (!customRaw || customRaw.length === 0)) {
    return json({ error: 'planId or customItems is required' }, 400);
  }

  const deliveryDay = typeof body.deliveryDay === 'string' ? body.deliveryDay.slice(0, 20) : undefined;
  const deliveryTimeSlot = typeof body.deliveryTimeSlot === 'string' ? body.deliveryTimeSlot.slice(0, 100) : undefined;
  const address = typeof body.address === 'object' && body.address !== null ? (body.address as Record<string, unknown>) : {};
  const notes = typeof body.notes === 'string' ? body.notes.slice(0, 2000) : undefined;
  const gateCode = typeof body.gateCode === 'string' ? body.gateCode.slice(0, 100) : undefined;
  const frequency = typeof body.frequency === 'string' ? body.frequency.slice(0, 20) : undefined;
  const requestId = mode === 'create' ? (typeof body.requestId === 'string' && body.requestId ? body.requestId : null) : null;
  if (mode === 'create' && !requestId) return json({ error: 'requestId is required for create' }, 400);

  try {
    let plan: PlanDoc | null = null;
    let customItems: OrderRequestItem[] = [];
    let products: ProductDoc[] = [];
    let planQuote: OrderQuote | null = null;
    let priceLbp: Lbp = 0;
    let snapshotItems: Array<Record<string, unknown>> = [];

    if (planId) {
      const doc = await getDoc('plans', planId);
      if (!doc.exists) return json({ error: 'Plan not found' }, 404);
      plan = { id: planId, ...doc.data };
      priceLbp = Math.round(Number(plan.priceLbp ?? plan.price ?? 0));
      if (priceLbp <= 0) return json({ error: 'Plan has no price' }, 409);
      snapshotItems = (plan.items ?? []).map((it) => ({
        productId: it.productId ?? '',
        name: it.name ?? '',
        price: Math.round(Number(it.price ?? 0)),
        quantity: Number(it.quantity ?? 1),
      }));
    } else {
      customItems = customRaw!.slice(0, 50).map((it) => {
        const productId = typeof it.productId === 'string' ? it.productId : '';
        const quantity = Number(it.quantity);
        if (!productId || !Number.isInteger(quantity) || quantity < 1) {
          throw new HttpError(400, 'customItems: productId and quantity>0 required');
        }
        const variantId = typeof it.variantId === 'string' && it.variantId ? it.variantId : undefined;
        return { productId, variantId, quantity };
      });
      const ids = [...new Set(customItems.map((i) => i.productId))];
      const docs = await batchGet(ids.map((id) => ({ collection: 'products', docId: id })));
      products = docs.map((d, idx) => ({ id: ids[idx], ...d.data }));
      planQuote = computeQuote({ items: customItems, products, settings: defaultSettings(), coupon: null });
      if (!planQuote.ok) return json({ ok: false, error: 'Custom plan cannot be created', blockers: planQuote.blockers }, 409);
      priceLbp = planQuote.totalLbp;
      snapshotItems = planQuote.items.map((it) => ({
        productId: it.productId,
        name: it.name,
        price: it.unitPriceLbp,
        quantity: it.quantity,
      }));
    }

    if (mode === 'quote') {
      return json({
        ok: true,
        mode: 'quote',
        planId: plan?.id ?? null,
        priceLbp,
        priceUsd: toUsd(priceLbp, 89500),
        items: snapshotItems,
        blockers: planQuote?.blockers ?? [],
      });
    }

    // ---- create ----
    const reqId = requestId as string;
    const existing = await getDoc('sub_requests', reqId);
    if (existing.exists) {
      return json({ ok: true, mode: 'create', subscriptionId: existing.data.subscriptionId, idempotent: true }, 200);
    }

    if (!deliveryDay || !deliveryTimeSlot) return json({ error: 'deliveryDay and deliveryTimeSlot are required' }, 400);

    const now = new Date().toISOString();
    const subscriptionId = crypto.randomUUID();
    const subscriptionDoc: Record<string, unknown> = {
      userId: claims.uid,
      planId: plan?.id ?? null,
      status: 'active',
      plan: plan
        ? {
            planId: plan.id,
            items: snapshotItems,
            frequency: plan.frequency ?? 'monthly',
            nextDeliveryDate: nextDeliveryDate(deliveryDay),
          }
        : {
            planId: 'custom',
            items: snapshotItems,
            frequency: frequency ?? 'weekly',
            nextDeliveryDate: nextDeliveryDate(deliveryDay),
          },
      items: snapshotItems,
      frequency: plan?.frequency ?? frequency ?? 'weekly',
      address,
      preferredDay: deliveryDay,
      preferredTime: deliveryTimeSlot,
      preferredTimeSlot: deliveryTimeSlot,
      customNotes: notes,
      gateCode,
      paymentStatus: 'pending',
      currentPaymentStatus: 'pending',
      paymentMethod: 'cash_on_delivery',
      priceLbp,
      priceUsd: toUsd(priceLbp, 89500),
      currency: 'LBP',
      startDate: now,
      nextDelivery: nextDeliveryDate(deliveryDay),
      deliveryAddress: {
        fullName: claims.name ?? '',
        email: claims.email ?? '',
        ...address,
      },
      totalDeliveries: 0,
      completedDeliveries: 0,
      deliveryHistory: [],
      paymentSchedule: [],
      source: 'api',
      createdAt: now,
      updatedAt: now,
    };

    try {
      await commitWrites(
        [
          { collection: 'subscriptions', docId: subscriptionId, data: subscriptionDoc },
          {
            collection: 'sub_requests',
            docId: reqId,
            data: { subscriptionId, userId: claims.uid, createdAt: now },
            precondition: { exists: false },
          },
        ],
        []
      );
    } catch (err) {
      if (err instanceof AbortedError) {
        const again = await getDoc('sub_requests', reqId);
        if (again.exists) {
          return json({ ok: true, mode: 'create', subscriptionId: again.data.subscriptionId, idempotent: true }, 200);
        }
        return json({ ok: false, mode: 'create', error: 'Could not create subscription, please try again.' }, 409);
      }
      throw err;
    }

    return json({ ok: true, mode: 'create', subscriptionId }, 201);
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error('[api/subscriptions] error:', err);
    return json({ error: 'Internal error creating subscription' }, 500);
  }
}

function defaultSettings() {
  return { exchangeRate: 89500, deliveryFeeLbp: 25000, freeDeliveryThresholdLbp: 1500000 };
}

function nextDeliveryDate(preferredDay: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const target = days.indexOf(preferredDay);
  if (target === -1) return new Date(Date.now() + 7 * 86400_000).toISOString().split('T')[0];
  const now = new Date();
  let delta = (target - now.getDay() + 7) % 7;
  if (delta === 0) delta = 7;
  return new Date(now.getTime() + delta * 86400_000).toISOString().split('T')[0];
}
