import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('en-LB', {
    style: 'currency',
    currency: 'LBP',
    maximumFractionDigits: 0
  }).format(price);
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
