/**
 * Money handling — all commercial math in integer LBP (lira). USD is a
 * display-only derivation from site_settings.exchangeRate. Never use floats
 * for LBP: rounding errors on customer totals are money loss.
 */

export type Lbp = number; // integer

export interface MoneySettings {
  exchangeRate: number; // LBP per USD
  deliveryFeeLbp: Lbp;
  freeDeliveryThresholdLbp: Lbp;
}

export function asLbp(value: unknown): Lbp {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

export function toUsd(lbp: Lbp, rate: number): number {
  if (!rate || rate <= 0) return 0;
  return Math.round((lbp / rate) * 100) / 100;
}

/** Shipping: free above threshold, else flat fee. */
export function shippingFor(subtotalLbp: Lbp, settings: MoneySettings): Lbp {
  if (subtotalLbp <= 0) return 0;
  return subtotalLbp >= settings.freeDeliveryThresholdLbp ? 0 : settings.deliveryFeeLbp;
}

export interface Totals {
  subtotalLbp: Lbp;
  shippingLbp: Lbp;
  discountLbp: Lbp;
  totalLbp: Lbp;
  totalUsd: number;
}

/** The single place totals are computed server-side. */
export function computeTotals(subtotalLbp: Lbp, settings: MoneySettings, couponDiscountLbp: Lbp): Totals {
  const shippingLbp = shippingFor(subtotalLbp, settings);
  const discountLbp = Math.min(Math.max(0, couponDiscountLbp), subtotalLbp);
  const totalLbp = Math.max(0, subtotalLbp + shippingLbp - discountLbp);
  return {
    subtotalLbp,
    shippingLbp,
    discountLbp,
    totalLbp,
    totalUsd: toUsd(totalLbp, settings.exchangeRate),
  };
}
