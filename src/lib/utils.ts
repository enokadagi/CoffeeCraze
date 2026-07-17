import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency: 'LBP' | 'USD' = 'LBP') {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }
  return new Intl.NumberFormat('en-LB', {
    style: 'currency',
    currency: 'LBP',
    maximumFractionDigits: 0
  }).format(price);
}

export function formatDate(dateStr: string, locale: string = 'en-US', options?: Intl.DateTimeFormatOptions): string {
  return new Date(dateStr).toLocaleDateString(
    locale,
    options ?? { month: 'short', day: 'numeric', year: 'numeric' }
  );
}

export const OFFICIAL_EXCHANGE_RATE = 89500; // 1 USD = 89,500 LBP

export function convertUsdToLbp(usd: number): number {
  return usd * OFFICIAL_EXCHANGE_RATE;
}

export function convertLbpToUsd(lbp: number): number {
  return lbp / OFFICIAL_EXCHANGE_RATE;
}

export function getDualPricing(product: { price?: number, priceLbp?: number, priceUsd?: number }): { lbp: number, usd: number } {
  let lbp = product.priceLbp || product.price || 0;
  let usd = product.priceUsd || 0;
  
  if (lbp > 0 && usd === 0) {
    usd = convertLbpToUsd(lbp);
  } else if (usd > 0 && lbp === 0) {
    lbp = convertUsdToLbp(usd);
  }
  
  return { lbp, usd };
}

/**
 * Locale-invariant numeric formatter for LBP amounts.
 * Avoids the `.split('LBP')` crash that occurs when browsers format
 * the currency symbol differently (e.g. "ل.ل." vs "LBP" vs "L.L.").
 */
export function formatLbpNumeric(amount: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(amount));
}

/**
 * Safely converts a Firestore Timestamp or ISO string to a JS Date.
 * Returns current date as fallback to prevent "Invalid Date" renders.
 */
export function safeDate(value: unknown): Date {
  if (!value) return new Date();
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const maybeDate = (value as {toDate?: unknown}).toDate;
    if (typeof maybeDate === 'function') return maybeDate();
  }
  const d = new Date(value as string | number | Date);
  return isNaN(d.getTime()) ? new Date() : d;
}
