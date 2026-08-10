import { describe, it, expect } from 'vitest';
import { asLbp, toUsd, shippingFor, computeTotals, type MoneySettings } from './money';

const settings: MoneySettings = { exchangeRate: 89500, deliveryFeeLbp: 50000, freeDeliveryThresholdLbp: 500000 };

describe('asLbp', () => {
  it('rounds values to integers', () => {
    expect(asLbp(1234.5)).toBe(1235);
    expect(asLbp('999.4')).toBe(999);
  });
  it('returns 0 for non-finite values', () => {
    expect(asLbp(NaN)).toBe(0);
    expect(asLbp(Infinity)).toBe(0);
    expect(asLbp(null)).toBe(0);
    expect(asLbp(undefined)).toBe(0);
  });
});

describe('toUsd', () => {
  it('rounds to 2 decimals', () => {
    expect(toUsd(89500, 89500)).toBe(1);
    expect(toUsd(100000, 89500)).toBe(1.12);
  });
  it('returns 0 for missing/invalid rate', () => {
    expect(toUsd(5000, 0)).toBe(0);
    expect(toUsd(5000, -1)).toBe(0);
  });
});

describe('shippingFor', () => {
  it('charges the flat fee below the free-delivery threshold', () => {
    expect(shippingFor(200000, settings)).toBe(50000);
  });
  it('is free at or above the threshold', () => {
    expect(shippingFor(500000, settings)).toBe(0);
    expect(shippingFor(600000, settings)).toBe(0);
  });
  it('charges nothing on empty carts', () => {
    expect(shippingFor(0, settings)).toBe(0);
  });
});

describe('computeTotals', () => {
  it('computes totals with a valid discount', () => {
    const t = computeTotals(400000, settings, 80000);
    expect(t.subtotalLbp).toBe(400000);
    expect(t.shippingLbp).toBe(50000);
    expect(t.discountLbp).toBe(80000);
    expect(t.totalLbp).toBe(370000);
    expect(t.totalUsd).toBeCloseTo(4.13, 2);
  });
  it('clamps discount to subtotal (never negative totals)', () => {
    const t = computeTotals(100000, settings, 999999);
    expect(t.discountLbp).toBe(100000);
    expect(t.totalLbp).toBe(50000);
  });
  it('ignores negative discounts', () => {
    const t = computeTotals(100000, settings, -50);
    expect(t.discountLbp).toBe(0);
    expect(t.totalLbp).toBe(150000);
  });
  it('keeps all math in integers (no float drift)', () => {
    const t = computeTotals(333333, settings, 33333);
    expect(Number.isInteger(t.subtotalLbp)).toBe(true);
    expect(Number.isInteger(t.shippingLbp)).toBe(true);
    expect(Number.isInteger(t.discountLbp)).toBe(true);
    expect(Number.isInteger(t.totalLbp)).toBe(true);
  });
});
