import { describe, it, expect } from 'vitest';
import { validateCoupon, type CouponRecord } from './coupons';

const now = new Date('2026-08-08T00:00:00Z').getTime();
const base: CouponRecord = { code: 'SAVE10', discountPercent: 10 };

describe('validateCoupon', () => {
  it('rejects missing coupons', () => {
    const r = validateCoupon(null, 100000, now);
    expect(r.valid).toBe(false);
    expect(r.reason).toBe('Invalid coupon code');
  });

  it('rejects inactive coupons (either flag)', () => {
    expect(validateCoupon({ ...base, isActive: false }, 100000, now).valid).toBe(false);
    expect(validateCoupon({ ...base, active: false }, 100000, now).valid).toBe(false);
  });

  it('rejects expired coupons by ISO string, Date, and Firestore Timestamp shape', () => {
    const past = new Date(now - 1000).toISOString();
    expect(validateCoupon({ ...base, expiresAt: past }, 100000, now).valid).toBe(false);
    expect(validateCoupon({ ...base, expiresAt: new Date(past) }, 100000, now).valid).toBe(false);
    expect(validateCoupon({ ...base, expiresAt: { seconds: (now - 1000) / 1000 } }, 100000, now).valid).toBe(false);
  });

  it('accepts future expiry', () => {
    const r = validateCoupon({ ...base, expiresAt: new Date(now + 86_400_000).toISOString() }, 100000, now);
    expect(r.valid).toBe(true);
  });

  it('rejects coupons past their usage limit', () => {
    const r = validateCoupon({ ...base, usageLimit: 5, usedCount: 5 }, 100000, now);
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/usage limit/);
  });

  it('rejects malformed discount percentages', () => {
    expect(validateCoupon({ ...base, discountPercent: 0 }, 100000, now).valid).toBe(false);
    expect(validateCoupon({ ...base, discountPercent: 150 }, 100000, now).valid).toBe(false);
    expect(validateCoupon({ ...base, discountPercent: NaN }, 100000, now).valid).toBe(false);
  });

  it('rejects below minimum order', () => {
    const r = validateCoupon({ ...base, minOrderLbp: 500000 }, 200000, now);
    expect(r.valid).toBe(false);
    expect(r.reason).toMatch(/Minimum order/);
  });

  it('computes floor-rounded integer discount', () => {
    const r = validateCoupon({ ...base, discountPercent: 15 }, 333333, now);
    expect(r.valid).toBe(true);
    expect(r.discountLbp).toBe(Math.floor(333333 * 0.15));
  });
});
