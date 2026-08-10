import { describe, it, expect, vi, afterEach } from 'vitest';
import { OrdersApi, OrdersApiError } from '../../services/ordersApi';

function mockFetchOnce(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('OrdersApi.quote', () => {
  it('sends only ids + quantities to the server (never client-computed prices)', async () => {
    const fetchMock = mockFetchOnce(200, {
      ok: true,
      mode: 'quote',
      quote: { ok: true, items: [], subtotalLbp: 0, shippingLbp: 0, discountLbp: 0, totalLbp: 0, totalUsd: 0, exchangeRate: 89500, coupon: {}, blockers: [] },
    });
    vi.stubGlobal('fetch', fetchMock);

    await OrdersApi.quote(
      [
        { productId: 'p1', variantId: 'v1', quantity: 2 },
        { productId: 'p2', quantity: 1 },
      ],
      'SAVE10',
      'token-123'
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/orders');
    const sent = JSON.parse(init.body);
    expect(sent.mode).toBe('quote');
    expect(sent.items).toEqual([
      { productId: 'p1', variantId: 'v1', quantity: 2 },
      { productId: 'p2', quantity: 1 },
    ]);
    expect(sent.couponCode).toBe('SAVE10');
    expect(sent.items[0]).not.toHaveProperty('price');
    expect(sent.items[0]).not.toHaveProperty('unitPriceLbp');
    expect(sent).not.toHaveProperty('total');
    expect(init.headers.authorization).toBe('Bearer token-123');
  });

  it('throws OrdersApiError with server error code on failure', async () => {
    vi.stubGlobal('fetch', mockFetchOnce(400, { error: 'INSUFFICIENT_STOCK' }));
    await expect(OrdersApi.quote([{ productId: 'p1', quantity: 99 }], null, null))
      .rejects.toThrow('INSUFFICIENT_STOCK');
  });
});

describe('OrdersApi.create', () => {
  it('sends mode create with requestId idempotency key and shipping logistics only', async () => {
    const fetchMock = mockFetchOnce(200, { ok: true, mode: 'create', orderId: 'order-1' });
    vi.stubGlobal('fetch', fetchMock);

    await OrdersApi.create(
      {
        requestId: 'req-1',
        items: [{ productId: 'p1', quantity: 1 }],
        couponCode: null,
        shipping: { fullName: 'A', street: 'S', city: 'Beirut', phone: '+961' },
        deliveryDate: '2026-08-10',
        customNotes: 'Leave at door',
      },
      'token-123'
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/orders');
    const sent = JSON.parse(init.body);
    expect(sent.mode).toBe('create');
    expect(sent.requestId).toBe('req-1');
    expect(sent.shipping).toMatchObject({ fullName: 'A', street: 'S', city: 'Beirut', phone: '+961' });
    expect(sent.deliveryDate).toBe('2026-08-10');
    expect(sent.customNotes).toBe('Leave at door');
    expect(sent).not.toHaveProperty('total');
    expect(sent).not.toHaveProperty('paymentMethod');
  });

  it('propagates idempotent retry results', async () => {
    const fetchMock = mockFetchOnce(200, { ok: true, mode: 'create', orderId: 'order-1', idempotent: true });
    vi.stubGlobal('fetch', fetchMock);
    const res = await OrdersApi.create({
      requestId: 'req-1',
      items: [{ productId: 'p1', quantity: 1 }],
      couponCode: null,
      shipping: { fullName: 'A', street: 'S', city: 'Beirut', phone: '+961' },
      deliveryDate: '2026-08-10',
    }, null);
    expect(res.idempotent).toBe(true);
  });
});

describe('OrdersApi.cancelOrder', () => {
  it('requests cancellation with a reason', async () => {
    const fetchMock = mockFetchOnce(200, { ok: true, orderId: 'order-1' });
    vi.stubGlobal('fetch', fetchMock);

    await OrdersApi.cancelOrder('order-1', 'Customer requested', 'token-123');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/orders');
    const sent = JSON.parse(init.body);
    expect(sent.mode).toBe('cancel');
    expect(sent.orderId).toBe('order-1');
    expect(sent.reason).toBe('Customer requested');
  });

  it('rejects non-2xx responses with OrdersApiError', async () => {
    vi.stubGlobal('fetch', mockFetchOnce(404, { error: 'NOT_FOUND' }));
    const err = await OrdersApi.cancelOrder('nope', 'x', null).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(OrdersApiError);
    expect((err as OrdersApiError).status).toBe(404);
  });
});
