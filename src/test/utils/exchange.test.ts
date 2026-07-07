import { describe, it, expect } from 'vitest';
import { EXCHANGE_RATE, formatUSD, formatLBP, formatDual, formatDualFromLBP } from '../../utils/exchange';

describe('exchange utilities', () => {
  it('EXCHANGE_RATE is 89500', () => {
    expect(EXCHANGE_RATE).toBe(89500);
  });

  describe('formatUSD', () => {
    it('formats whole dollars', () => {
      expect(formatUSD(10)).toBe('$10.00');
    });

    it('formats cents', () => {
      expect(formatUSD(10.5)).toBe('$10.50');
    });

    it('formats zero', () => {
      expect(formatUSD(0)).toBe('$0.00');
    });

    it('formats large amounts with commas', () => {
      expect(formatUSD(1234567.89)).toBe('$1,234,567.89');
    });
  });

  describe('formatLBP', () => {
    it('formats LBP with no decimals', () => {
      expect(formatLBP(89500)).toBe('LBP 89,500');
    });

    it('formats zero', () => {
      expect(formatLBP(0)).toBe('LBP 0');
    });

    it('formats large amounts', () => {
      expect(formatLBP(1000000)).toBe('LBP 1,000,000');
    });
  });

  describe('formatDual', () => {
    it('shows both USD and LBP', () => {
      const result = formatDual(10);
      expect(result).toContain('$10.00');
      expect(result).toContain('LBP 895,000');
    });

    it('handles zero', () => {
      expect(formatDual(0)).toBe('$0.00 / LBP 0');
    });
  });

  describe('formatDualFromLBP', () => {
    it('converts LBP to USD and shows both', () => {
      const result = formatDualFromLBP(895000);
      expect(result).toContain('$10.00');
      expect(result).toContain('LBP 895,000');
    });
  });
});
