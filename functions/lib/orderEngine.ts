/**
 * Order engine — pure, unit-testable domain logic for server-authoritative
 * orders. No I/O here: the API endpoint feeds it products/settings/coupon
 * documents and commits the returned writes atomically.
 */

import { computeTotals, shippingFor, toUsd, type Lbp, type MoneySettings } from './money';
import { validateCoupon, type CouponRecord } from './coupons';

export interface OrderRequestItem {
  productId: string;
  variantId?: string;
  quantity: number;
  /** Optional — the price the client showed; used only to warn "price changed". */
  clientPrice?: number;
}

export interface ProductDoc {
  id: string;
  name?: string;
  price?: number;
  priceLbp?: number;
  stock?: number;
  isActive?: boolean;
  active?: boolean;
  image?: string;
  images?: string[];
  variants?: Array<{ id: string; name?: string; price?: number; priceLbp?: number; stock?: number }>;
}

export type ItemStatus = 'ok' | 'unavailable' | 'inactive' | 'insufficient_stock';

export interface ResolvedItem {
  productId: string;
  name: string;
  image?: string;
  variantId: string | null;
  variantName: string | null;
  unitPriceLbp: Lbp;
  quantity: number;
  lineTotalLbp: Lbp;
  status: ItemStatus;
  availableStock: number;
  priceChanged: boolean;
}

export interface OrderQuote {
  ok: boolean;
  items: ResolvedItem[];
  subtotalLbp: Lbp;
  shippingLbp: Lbp;
  discountLbp: Lbp;
  totalLbp: Lbp;
  totalUsd: number;
  exchangeRate: number;
  coupon: { code: string; valid: boolean; reason?: string; discountPercent: number; discountLbp: Lbp };
  blockers: string[];
}

const MAX_QUANTITY = 99;

export function resolveProductPrice(product: ProductDoc, variantId?: string): Lbp {
  if (variantId) {
    const v = product.variants?.find((x) => x.id === variantId);
    if (v) return Math.round(Number(v.priceLbp ?? v.price ?? 0));
    return 0; // unknown variant
  }
  return Math.round(Number(product.priceLbp ?? product.price ?? 0));
}

export function resolveProductStock(product: ProductDoc, variantId?: string): number {
  if (variantId) {
    const v = product.variants?.find((x) => x.id === variantId);
    if (v) return Number.isFinite(Number(v.stock)) ? Number(v.stock) : Infinity;
    return 0;
  }
  return Number.isFinite(Number(product.stock)) ? Number(product.stock) : Infinity;
}

export function resolveItem(item: OrderRequestItem, product: ProductDoc): ResolvedItem {
  const priceChanged = typeof item.clientPrice === 'number' && item.clientPrice !== resolveProductPrice(product, item.variantId);
  const stock = resolveProductStock(product, item.variantId);
  const base: ResolvedItem = {
    productId: product.id,
    name: product.name ?? item.productId,
    image: product.image ?? product.images?.[0],
    variantId: item.variantId ?? null,
    variantName: item.variantId ? product.variants?.find((v) => v.id === item.variantId)?.name ?? null : null,
    unitPriceLbp: 0,
    quantity: item.quantity,
    lineTotalLbp: 0,
    status: 'ok',
    availableStock: stock,
    priceChanged,
  };

  const unitPrice = resolveProductPrice(product, item.variantId);
  if (item.variantId && !product.variants?.some((v) => v.id === item.variantId)) {
    return { ...base, status: 'unavailable', unitPriceLbp: unitPrice };
  }
  if (product.isActive === false || product.active === false) {
    return { ...base, status: 'inactive', unitPriceLbp: unitPrice };
  }
  if (stock < item.quantity) {
    return { ...base, status: 'insufficient_stock', unitPriceLbp: unitPrice };
  }
  return {
    ...base,
    status: 'ok',
    unitPriceLbp: unitPrice,
    lineTotalLbp: unitPrice * item.quantity,
  };
}

export interface QuoteInput {
  items: OrderRequestItem[];
  products: ProductDoc[];
  settings: MoneySettings;
  coupon: CouponRecord | null;
  couponCode?: string;
}

export function computeQuote(input: QuoteInput): OrderQuote {
  const byId = new Map(input.products.map((p) => [p.id, p]));
  const resolved = input.items.map((it) => {
    const product = byId.get(it.productId);
    return product ? resolveItem(it, product) : {
      productId: it.productId,
      name: 'Unavailable product',
      image: undefined,
      variantId: it.variantId ?? null,
      variantName: null,
      unitPriceLbp: 0,
      quantity: it.quantity,
      lineTotalLbp: 0,
      status: 'unavailable' as const,
      availableStock: 0,
      priceChanged: false,
    };
  });

  const subtotalLbp = resolved.reduce((sum, it) => sum + it.lineTotalLbp, 0);
  const shippingLbp = shippingFor(subtotalLbp, input.settings);
  const couponResult = validateCoupon(input.coupon ?? null, subtotalLbp);
  const totals = computeTotals(subtotalLbp, input.settings, couponResult.valid ? couponResult.discountLbp : 0);

  const blockers: string[] = [];
  for (const it of resolved) {
    if (it.status === 'unavailable') blockers.push(`${it.name} is no longer available.`);
    if (it.status === 'inactive') blockers.push(`${it.name} is currently unavailable.`);
    if (it.status === 'insufficient_stock') blockers.push(`Only ${it.availableStock} left of ${it.name}.`);
    if (it.quantity > MAX_QUANTITY) blockers.push(`${it.name}: maximum ${MAX_QUANTITY} per order.`);
  }
  if (couponResult.valid === false && input.coupon) blockers.push(couponResult.reason ?? 'Coupon is invalid.');

  return {
    ok: blockers.length === 0,
    items: resolved,
    subtotalLbp,
    shippingLbp,
    discountLbp: totals.discountLbp,
    totalLbp: totals.totalLbp,
    totalUsd: totals.totalUsd,
    exchangeRate: input.settings.exchangeRate,
    coupon: {
      code: input.couponCode ?? input.coupon?.code ?? '',
      valid: couponResult.valid,
      reason: couponResult.valid ? undefined : couponResult.reason,
      discountPercent: couponResult.discountPercent,
      discountLbp: couponResult.valid ? couponResult.discountLbp : 0,
    },
    blockers,
  };
}

export interface ShippingAddressInput {
  fullName?: string;
  street?: string;
  building?: string;
  floor?: string;
  city?: string;
  phone?: string;
  email?: string;
  gateCode?: string;
  instructions?: string;
  gpsCoordinates?: { lat: number; lng: number } | null;
}

/** Builds the order document exactly as it must be persisted. */
export function buildOrderDocument(params: {
  requestId: string;
  userId: string;
  userEmail?: string;
  quote: OrderQuote;
  shipping: ShippingAddressInput;
  deliveryDate?: string;
  deliveryTime?: string;
  customNotes?: string;
  couponCode?: string;
  now?: Date;
}): Record<string, unknown> {
  const now = (params.now ?? new Date()).toISOString();
  const items = params.quote.items.map((it) => ({
    productId: it.productId,
    name: it.name,
    price: it.unitPriceLbp,
    quantity: it.quantity,
    image: it.image ?? '',
    ...(it.variantId ? { variant: { id: it.variantId, name: it.variantName ?? '' } } : {}),
    unitPriceLbp: it.unitPriceLbp,
    lineTotalLbp: it.lineTotalLbp,
  }));
  const shipping = {
    fullName: params.shipping.fullName ?? '',
    name: params.shipping.fullName ?? '',
    street: params.shipping.street ?? '',
    building: params.shipping.building ?? '',
    floor: params.shipping.floor ?? '',
    city: params.shipping.city ?? '',
    country: 'Lebanon',
    phone: params.shipping.phone ?? '',
    phoneNumber: params.shipping.phone ?? '',
    email: params.userEmail ?? '',
    ...(params.shipping.gateCode ? { gateCode: params.shipping.gateCode } : {}),
    ...(params.shipping.instructions ? { instructions: params.shipping.instructions } : {}),
    ...(params.shipping.gpsCoordinates ? { gpsCoordinates: params.shipping.gpsCoordinates } : {}),
  };
  return {
    userId: params.userId,
    requestId: params.requestId,
    items,
    subtotal: params.quote.subtotalLbp,
    subtotalLbp: params.quote.subtotalLbp,
    shipping: params.quote.shippingLbp,
    shippingLbp: params.quote.shippingLbp,
    discountLbp: params.quote.discountLbp,
    total: params.quote.totalLbp,
    totalLbp: params.quote.totalLbp,
    totalUsd: params.quote.totalUsd,
    currency: 'LBP',
    exchangeRate: params.quote.exchangeRate,
    ...(params.couponCode ? { couponCode: params.couponCode } : {}),
    ...(params.quote.coupon.discountLbp > 0 ? { couponDiscountLbp: params.quote.coupon.discountLbp } : {}),
    paymentMethod: 'cash_on_delivery',
    paymentStatus: 'pending',
    paymentTiming: 'deferred',
    status: 'pending',
    shippingAddress: shipping,
    ...(params.deliveryDate ? { deliveryDate: params.deliveryDate } : {}),
    ...(params.deliveryTime ? { deliveryTime: params.deliveryTime } : {}),
    ...(params.customNotes ? { customNotes: params.customNotes } : {}),
    source: 'api',
    createdAt: now,
    updatedAt: now,
  };
}

/** Writes needed to persist an order atomically: stock decrements, coupon usage, order + idempotency docs. */
export function planOrderWrites(params: {
  orderDoc: Record<string, unknown>;
  orderId: string;
  requestId: string;
  products: ProductDoc[];
  quote: OrderQuote;
  coupon: CouponRecord | null;
  now?: Date;
}): Array<{ collection: string; docId: string; data: Record<string, unknown>; precondition?: { exists?: boolean } }> {
  const now = (params.now ?? new Date()).toISOString();
  const writes: Array<{ collection: string; docId: string; data: Record<string, unknown>; precondition?: { exists?: boolean } }> = [];

  for (const item of params.quote.items) {
    const product = params.products.find((p) => p.id === item.productId);
    if (!product || item.status !== 'ok') continue;
    const newStock = Math.max(0, resolveProductStock(product, item.variantId ?? undefined) - item.quantity);
    if (item.variantId) {
      const variants = (product.variants ?? []).map((v) =>
        v.id === item.variantId ? { ...v, stock: Math.max(0, Number.isFinite(Number(v.stock)) ? Number(v.stock) - item.quantity : 0) } : v
      );
      writes.push({ collection: 'products', docId: product.id, data: { stock: newStock, variants, updatedAt: now } });
    } else {
      writes.push({ collection: 'products', docId: product.id, data: { stock: newStock, updatedAt: now } });
    }
  }

  if (params.coupon && params.quote.coupon.valid) {
    const usedCount = Number(params.coupon.usedCount ?? 0) + 1;
    writes.push({ collection: 'coupons', docId: params.coupon.code, data: { usedCount, updatedAt: now } });
  }

  writes.push({ collection: 'orders', docId: params.orderId, data: params.orderDoc });
  writes.push({
    collection: 'order_requests',
    docId: params.requestId,
    data: { orderId: params.orderId, userId: params.orderDoc.userId as string, createdAt: now },
    precondition: { exists: false },
  });

  return writes;
}

/** Legacy USD display for order-success pages that only read `totalUsd`. */
export { toUsd };
