/**
 * Client for the server-authoritative commerce API (Cloudflare Pages Functions).
 * The client NEVER sends prices to the server; it sends ids + quantities and
 * receives server-computed quotes/orders.
 */

export interface ServerQuoteItem {
  productId: string;
  name: string;
  image?: string;
  variantId: string | null;
  variantName: string | null;
  unitPriceLbp: number;
  quantity: number;
  lineTotalLbp: number;
  status: 'ok' | 'unavailable' | 'inactive' | 'insufficient_stock';
  availableStock: number;
  priceChanged: boolean;
}

export interface ServerQuote {
  ok: boolean;
  items: ServerQuoteItem[];
  subtotalLbp: number;
  shippingLbp: number;
  discountLbp: number;
  totalLbp: number;
  totalUsd: number;
  exchangeRate: number;
  coupon: { code: string; valid: boolean; reason?: string; discountPercent: number; discountLbp: number };
  blockers: string[];
}

export interface OrderRequestItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface QuoteOrderParams {
  items: OrderRequestItem[];
  couponCode?: string | null;
}

export interface CreateOrderParams extends QuoteOrderParams {
  requestId: string;
  shipping: {
    fullName: string;
    street: string;
    building?: string;
    floor?: string;
    city: string;
    phone: string;
    gateCode?: string;
    instructions?: string;
    gpsCoordinates?: { lat: number; lng: number } | null;
  };
  deliveryDate: string;
  deliveryTime?: string;
  customNotes?: string;
}

export interface ApiResult<T> {
  status: number;
  ok: boolean;
  data: T | null;
  error?: string;
}

export class OrdersApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function post<T>(path: string, body: unknown, token: string | null): Promise<T> {
  const resp = await fetch(path, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => null);
  if (!resp.ok) {
    const message = (data as { error?: string })?.error ?? `Request failed (${resp.status})`;
    throw new OrdersApiError(message, resp.status, data);
  }
  return data as T;
}

export const OrdersApi = {
  async quote(items: OrderRequestItem[], couponCode: string | null, token: string | null): Promise<{ ok: true; mode: 'quote'; quote: ServerQuote }> {
    return post('/api/orders', { mode: 'quote', items, couponCode: couponCode ?? undefined }, token);
  },

  async create(params: CreateOrderParams, token: string | null): Promise<{ ok: boolean; mode: 'create'; orderId?: string; idempotent?: boolean; error?: string; quote?: ServerQuote }> {
    return post('/api/orders', {
      mode: 'create',
      items: params.items,
      couponCode: params.couponCode ?? undefined,
      requestId: params.requestId,
      shipping: params.shipping,
      deliveryDate: params.deliveryDate,
      deliveryTime: params.deliveryTime,
      customNotes: params.customNotes,
    }, token);
  },

  async cancelOrder(orderId: string, reason: string, token: string | null): Promise<{ ok: boolean; orderId: string; status?: string }> {
    return post('/api/orders', { mode: 'cancel', orderId, reason }, token);
  },

  async quoteSubscription(params: { planId?: string; customItems?: OrderRequestItem[]; deliveryDay?: string; deliveryTimeSlot?: string }, token: string | null): Promise<{ ok: boolean; mode: 'quote'; planId?: string | null; priceLbp?: number; priceUsd?: number; items?: Array<Record<string, unknown>>; blockers?: string[] }> {
    return post('/api/subscriptions', { mode: 'quote', ...params }, token);
  },

  async createSubscription(params: {
    requestId: string;
    planId?: string;
    customItems?: OrderRequestItem[];
    deliveryDay: string;
    deliveryTimeSlot: string;
    frequency?: string;
    address?: Record<string, unknown>;
    notes?: string;
    gateCode?: string;
  }, token: string | null): Promise<{ ok: boolean; mode: 'create'; subscriptionId?: string; idempotent?: boolean; error?: string }> {
    return post('/api/subscriptions', { mode: 'create', ...params }, token);
  },
};
