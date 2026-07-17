import { OFFICIAL_EXCHANGE_RATE } from '@/lib/utils';
export const EXCHANGE_RATE = OFFICIAL_EXCHANGE_RATE;

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatLBP(amount: number): string {
  return `LBP ${new Intl.NumberFormat('en-US', {
    style: 'decimal',
    maximumFractionDigits: 0
  }).format(amount)}`;
}

export function formatDual(usdAmount: number): string {
  const lbpAmount = usdAmount * EXCHANGE_RATE;
  return `${formatUSD(usdAmount)} / ${formatLBP(lbpAmount)}`;
}

export function formatDualFromLBP(lbpAmount: number): string {
  const usdAmount = lbpAmount / EXCHANGE_RATE;
  return `${formatUSD(usdAmount)} / ${formatLBP(lbpAmount)}`;
}
