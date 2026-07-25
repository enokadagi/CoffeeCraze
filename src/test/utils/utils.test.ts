import { describe, it, expect } from 'vitest';
import { cn, formatPrice, formatDate, cleanUndefined } from '../../lib/utils';

describe('cn (className merge)', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    const showHidden = false;
    expect(cn('base', showHidden && 'hidden', 'visible')).toBe('base visible');
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

describe('cleanUndefined', () => {
  it('returns null as null', () => {
    expect(cleanUndefined(null)).toBeNull();
  });

  it('returns undefined as undefined', () => {
    expect(cleanUndefined(undefined)).toBeUndefined();
  });

  it('returns primitives unchanged', () => {
    expect(cleanUndefined(42)).toBe(42);
    expect(cleanUndefined('hello')).toBe('hello');
    expect(cleanUndefined(true)).toBe(true);
  });

  it('removes undefined values from flat object', () => {
    const obj = { a: 1, b: undefined, c: 'keep' };
    expect(cleanUndefined(obj)).toEqual({ a: 1, c: 'keep' });
  });

  it('removes undefined values from nested objects', () => {
    const obj = { a: { b: undefined, c: 'keep' }, d: undefined };
    expect(cleanUndefined(obj)).toEqual({ a: { c: 'keep' } });
  });

  it('handles arrays by cleaning each element', () => {
    const arr = [{ a: 1, b: undefined }, { a: undefined, c: 3 }];
    expect(cleanUndefined(arr)).toEqual([{ a: 1 }, { c: 3 }]);
  });

  it('returns empty object when all values are undefined', () => {
    expect(cleanUndefined({ a: undefined, b: undefined })).toEqual({});
  });

  it('preserves valid falsy values (0, false, empty string)', () => {
    const obj = { zero: 0, falseVal: false, empty: '', nil: undefined };
    expect(cleanUndefined(obj)).toEqual({ zero: 0, falseVal: false, empty: '' });
  });

  it('handles nested arrays in objects', () => {
    const obj = { items: [{ x: 1, y: undefined }, { x: undefined, y: 2 }], meta: undefined };
    expect(cleanUndefined(obj)).toEqual({ items: [{ x: 1 }, { y: 2 }] });
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
