import { describe, it, expect } from 'vitest';
import {
  resolveProductPrice,
  resolveProductStock,
  resolveItem,
  computeQuote,
  buildOrderDocument,
  planOrderWrites,
  type ProductDoc,
} from './orderEngine';
import type { MoneySettings } from './money';
import type { CouponRecord } from './coupons';

const settings: MoneySettings = { exchangeRate: 89500, deliveryFeeLbp: 50000, freeDeliveryThresholdLbp: 500000 };

const beans: ProductDoc = {
  id: 'p1',
  name: 'Yirgacheffe Beans',
  priceLbp: 150000,
  stock: 10,
  isActive: true,
  image: 'img.jpg',
};

const withVariant: ProductDoc = {
  id: 'p2',
  name: 'Drip Kit',
  priceLbp: 200000,
  stock: 5,
  active: true,
  variants: [
    { id: 'v1', name: '250g', priceLbp: 200000, stock: 3 },
    { id: 'v2', name: '500g', priceLbp: 350000, stock: 0 },
  ],
};

describe('resolveProductPrice', () => {
  it('prefers priceLbp over USD price and rounds', () => {
    expect(resolveProductPrice({ ...beans, price: 10 }, undefined)).toBe(150000);
    expect(resolveProductPrice({ id: 'x', priceLbp: 100.6 }, undefined)).toBe(101);
    expect(resolveProductPrice({ id: 'x', price: 2.4 }, undefined)).toBe(2);
  });
  it('uses variant price when a known variant id is given', () => {
    expect(resolveProductPrice(withVariant, 'v2')).toBe(350000);
  });
  it('returns 0 for unknown variants', () => {
    expect(resolveProductPrice(withVariant, 'nope')).toBe(0);
  });
});

describe('resolveProductStock', () => {
  it('falls back to Infinity when stock is missing', () => {
    expect(resolveProductStock({ id: 'x', price: 1 }, undefined)).toBe(Infinity);
  });
  it('uses variant stock when a known variant id is given', () => {
    expect(resolveProductStock(withVariant, 'v2')).toBe(0);
    expect(resolveProductStock(withVariant, 'v1')).toBe(3);
  });
  it('returns 0 for unknown variants', () => {
    expect(resolveProductStock(withVariant, 'nope')).toBe(0);
  });
});

describe('resolveItem', () => {
  it('resolves a valid item with correct line total', () => {
    const it = resolveItem({ productId: 'p1', quantity: 2 }, beans);
    expect(it.status).toBe('ok');
    expect(it.unitPriceLbp).toBe(150000);
    expect(it.lineTotalLbp).toBe(300000);
    expect(it.priceChanged).toBe(false);
  });

  it('flags price change when the client saw a different price', () => {
    const it = resolveItem({ productId: 'p1', quantity: 1, clientPrice: 100000 }, beans);
    expect(it.priceChanged).toBe(true);
  });

  it('marks unknown variants unavailable', () => {
    expect(resolveItem({ productId: 'p2', variantId: 'ghost', quantity: 1 }, withVariant).status).toBe('unavailable');
  });

  it('marks inactive products inactive (either flag)', () => {
    expect(resolveItem({ productId: 'p1', quantity: 1 }, { ...beans, isActive: false }).status).toBe('inactive');
    expect(resolveItem({ productId: 'p1', quantity: 1 }, { ...beans, active: false }).status).toBe('inactive');
  });

  it('marks over-quantity items insufficient_stock', () => {
    const it = resolveItem({ productId: 'p1', quantity: 50 }, beans);
    expect(it.status).toBe('insufficient_stock');
    expect(it.availableStock).toBe(10);
  });

  it('handles zero-stock variant', () => {
    expect(resolveItem({ productId: 'p2', variantId: 'v2', quantity: 1 }, withVariant).status).toBe('insufficient_stock');
  });
});

describe('computeQuote', () => {
  it('computes a full quote from server data only', () => {
    const q = computeQuote({
      items: [
        { productId: 'p1', quantity: 2 },
        { productId: 'p2', variantId: 'v1', quantity: 1 },
      ],
      products: [beans, withVariant],
      settings,
      coupon: { code: 'SAVE10', discountPercent: 10 },
      couponCode: 'SAVE10',
    });
    expect(q.ok).toBe(true);
    expect(q.subtotalLbp).toBe(500000); // 2*150000 + 200000
    expect(q.shippingLbp).toBe(0); // free above threshold
    expect(q.discountLbp).toBe(50000);
    expect(q.totalLbp).toBe(450000);
    expect(q.totalUsd).toBeCloseTo(5.03, 2);
    expect(q.blockers).toHaveLength(0);
  });

  it('collects blockers and marks quote not ok', () => {
    const q = computeQuote({
      items: [{ productId: 'p1', quantity: 99 }],
      products: [beans],
      settings,
      coupon: { code: 'NOPE', discountPercent: 10, isActive: false },
      couponCode: 'NOPE',
    });
    expect(q.ok).toBe(false);
    expect(q.blockers.join(' ')).toMatch(/Only 10 left/);
    expect(q.blockers.join(' ')).toMatch(/no longer active/);
  });

  it('reports unavailable product and quantity cap', () => {
    const q = computeQuote({
      items: [{ productId: 'ghost', quantity: 100 }],
      products: [],
      settings,
      coupon: null,
    });
    expect(q.ok).toBe(false);
    expect(q.blockers.join(' ')).toMatch(/no longer available/);
    expect(q.blockers.join(' ')).toMatch(/maximum 99/);
  });

  it('does not apply discount when coupon invalid', () => {
    const q = computeQuote({
      items: [{ productId: 'p1', quantity: 1 }],
      products: [beans],
      settings,
      coupon: null,
      couponCode: 'MADEUP',
    });
    expect(q.coupon.valid).toBe(false);
    expect(q.discountLbp).toBe(0);
    expect(q.totalLbp).toBe(150000 + 50000);
  });
});

describe('buildOrderDocument', () => {
  const quote = computeQuote({
    items: [{ productId: 'p1', quantity: 1 }],
    products: [beans],
    settings,
    coupon: { code: 'SAVE10', discountPercent: 10 },
    couponCode: 'SAVE10',
  });

  it('snapshots prices into items and persists server-computed totals only', () => {
    const doc = buildOrderDocument({
      requestId: 'req-1',
      userId: 'u1',
      userEmail: 'c@x.com',
      quote,
      shipping: { fullName: 'Alice', street: 'Hamra', city: 'Beirut', phone: '+961 3 000 000' },
      deliveryDate: '2026-08-10',
      now: new Date('2026-08-08T10:00:00Z'),
    });
    expect(doc.status).toBe('pending');
    expect(doc.paymentMethod).toBe('cash_on_delivery');
    expect(doc.paymentStatus).toBe('pending');
    expect(doc.paymentTiming).toBe('deferred');
    expect(doc.currency).toBe('LBP');
    expect(doc.totalLbp).toBe(quote.totalLbp);
    expect(doc.couponDiscountLbp).toBe(15000);
    expect(doc.items[0]).toMatchObject({ productId: 'p1', name: 'Yirgacheffe Beans', unitPriceLbp: 150000, lineTotalLbp: 150000, quantity: 1 });
    expect(doc.shippingAddress).toMatchObject({ fullName: 'Alice', name: 'Alice', city: 'Beirut', phone: '+961 3 000 000', phoneNumber: '+961 3 000 000', country: 'Lebanon', email: 'c@x.com' });
    expect(doc.createdAt).toBe('2026-08-08T10:00:00.000Z');
    expect(doc.source).toBe('api');
  });

  it('omits coupon fields when no valid discount applied', () => {
    const plain = computeQuote({ items: [{ productId: 'p1', quantity: 1 }], products: [beans], settings, coupon: null });
    const doc = buildOrderDocument({ requestId: 'req-2', userId: 'u1', quote: plain, shipping: { fullName: 'A', city: 'Beirut', phone: 'x' } });
    expect(doc.couponCode).toBeUndefined();
    expect(doc.couponDiscountLbp).toBeUndefined();
  });
});

describe('planOrderWrites', () => {
  const quote = computeQuote({
    items: [
      { productId: 'p1', quantity: 2 },
      { productId: 'p2', variantId: 'v1', quantity: 1 },
    ],
    products: [beans, withVariant],
    settings,
    coupon: { code: 'SAVE10', discountPercent: 10 },
    couponCode: 'SAVE10',
  });

  it('decrements product stock (variant-aware) and increments coupon usage in the same atomic plan', () => {
    const coupon: CouponRecord = { code: 'SAVE10', discountPercent: 10, usedCount: 3 };
    const doc = buildOrderDocument({ requestId: 'req-1', userId: 'u1', quote, shipping: { fullName: 'A', city: 'Beirut', phone: 'x' } });
    const writes = planOrderWrites({ orderDoc: doc, orderId: 'order-1', requestId: 'req-1', products: [beans, withVariant], quote, coupon });

    const byCol = Object.fromEntries(writes.map((w) => [w.collection + '/' + w.docId, w]));
    expect(byCol['products/p1'].data.stock).toBe(8);
    expect(byCol['products/p2'].data.stock).toBe(2); // variant-level: 3 - 1
    expect(byCol['products/p2'].data.variants.find((v: { id: string }) => v.id === 'v1').stock).toBe(2);
    expect(byCol['coupons/SAVE10'].data.usedCount).toBe(4);
    expect(byCol['orders/order-1'].data).toBe(doc);
    expect(byCol['order_requests/req-1'].precondition).toEqual({ exists: false });
    expect(writes).toHaveLength(5);
  });

  it('skips stock writes for blocked items and never decrements below 0', () => {
    const badQuote = computeQuote({ items: [{ productId: 'p1', quantity: 999 }], products: [beans], settings, coupon: null });
    const doc = buildOrderDocument({ requestId: 'req-2', userId: 'u1', quote: badQuote, shipping: { fullName: 'A', city: 'Beirut', phone: 'x' } });
    const writes = planOrderWrites({ orderDoc: doc, orderId: 'order-2', requestId: 'req-2', products: [beans], quote: badQuote, coupon: null });
    const productWrites = writes.filter((w) => w.collection === 'products');
    expect(productWrites).toHaveLength(0);
    expect(writes.some((w) => w.collection === 'order_requests')).toBe(true);
  });

  it('does not bump coupon usage for invalid coupons', () => {
    const coupon: CouponRecord = { code: 'DEAD', discountPercent: 10, isActive: false };
    const q = computeQuote({ items: [{ productId: 'p1', quantity: 1 }], products: [beans], settings, coupon, couponCode: 'DEAD' });
    const doc = buildOrderDocument({ requestId: 'req-3', userId: 'u1', quote: q, shipping: { fullName: 'A', city: 'Beirut', phone: 'x' } });
    const writes = planOrderWrites({ orderDoc: doc, orderId: 'order-3', requestId: 'req-3', products: [beans], quote: q, coupon });
    expect(writes.some((w) => w.collection === 'coupons')).toBe(false);
  });
});
