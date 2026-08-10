/**
 * Coupon validation — server-side only. The client may read coupons for
 * display, but every discount applied to an order must pass these checks.
 */

export interface CouponRecord {
  code: string;
  discountPercent: number;
  isActive?: boolean;
  active?: boolean;
  expiresAt?: string | { seconds?: number } | Date | null;
  usageLimit?: number;
  usedCount?: number;
  minOrderLbp?: number;
}

export interface CouponCheckResult {
  valid: boolean;
  reason?: string;
  discountPercent: number;
  discountLbp: number;
}

function toMillis(expiresAt: CouponRecord['expiresAt']): number | null {
  if (!expiresAt) return null;
  if (typeof expiresAt === 'string') {
    const t = Date.parse(expiresAt);
    return Number.isNaN(t) ? null : t;
  }
  if (expiresAt instanceof Date) return expiresAt.getTime();
  if (typeof expiresAt === 'object' && typeof expiresAt.seconds === 'number') return expiresAt.seconds * 1000;
  return null;
}

export function validateCoupon(
  coupon: CouponRecord | null,
  subtotalLbp: number,
  now = Date.now()
): CouponCheckResult {
  if (!coupon) return { valid: false, reason: 'Invalid coupon code', discountPercent: 0, discountLbp: 0 };

  const isActive = coupon.isActive !== false && coupon.active !== false;
  if (!isActive) return { valid: false, reason: 'This coupon is no longer active', discountPercent: 0, discountLbp: 0 };

  const expires = toMillis(coupon.expiresAt);
  if (expires !== null && expires < now) {
    return { valid: false, reason: 'This coupon has expired', discountPercent: 0, discountLbp: 0 };
  }

  const usageLimit = Number(coupon.usageLimit ?? 0);
  const usedCount = Number(coupon.usedCount ?? 0);
  if (usageLimit > 0 && usedCount >= usageLimit) {
    return { valid: false, reason: 'This coupon has reached its usage limit', discountPercent: 0, discountLbp: 0 };
  }

  const discountPercent = Number(coupon.discountPercent);
  if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
    return { valid: false, reason: 'Invalid coupon discount', discountPercent: 0, discountLbp: 0 };
  }

  const minOrderLbp = Number(coupon.minOrderLbp ?? 0);
  if (minOrderLbp > 0 && subtotalLbp < minOrderLbp) {
    return { valid: false, reason: `Minimum order of ${minOrderLbp.toLocaleString()} LBP required`, discountPercent: 0, discountLbp: 0 };
  }

  const discountLbp = Math.floor((subtotalLbp * discountPercent) / 100);
  return { valid: true, discountPercent, discountLbp };
}
