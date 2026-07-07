import { describe, it, expect } from 'vitest';
import { cn, formatPrice, formatDate } from '../../lib/utils';

describe('cn (className merge)', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('merges tailwind classes correctly', () => {
    expect(cn('px-4 py-2', 'px-6')).toBe('py-2 px-6');
  });

  it('handles empty input', () => {
    expect(cn()).toBe('');
  });

  it('handles undefined values', () => {
    expect(cn('foo', undefined, 'bar')).toBe('foo bar');
  });
});

describe('formatPrice', () => {
  it('formats LBP by default', () => {
    const result = formatPrice(1000);
    expect(result).toContain('1,000');
  });

  it('formats USD when currency param is USD', () => {
    const result = formatPrice(10, 'USD');
    expect(result).toContain('$');
    expect(result).toContain('10.00');
  });

  it('formats LBP when currency param is LBP', () => {
    const result = formatPrice(1000, 'LBP');
    expect(result).toContain('1,000');
  });
});

describe('formatDate', () => {
  it('formats date with default en-US locale', () => {
    const result = formatDate('2026-06-01');
    expect(result).toBeTruthy();
  });

  it('formats date with ar-SA locale', () => {
    const result = formatDate('2026-06-01', 'ar-SA');
    expect(result).toBeTruthy();
    // Arabic digits or Arabic month names
    expect(result).not.toMatch(/June/);
  });
});
