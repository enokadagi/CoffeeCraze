/**
 * Best-effort per-IP in-memory rate limiting (documented as non-durable across
 * instances). Blocked requests never extend the window: once over the limit,
 * further requests return the same retry-after without incrementing the count.
 * Entries are swept lazily so the map cannot grow unbounded.
 */

export function rateLimiter(maxPerWindow = 30, windowMs = 60_000) {
  const map = new Map<string, { count: number; resetAt: number }>();
  let checksSinceSweep = 0;

  return {
    check(key: string): { allowed: boolean; retryAfterMs: number } {
      const now = Date.now();
      if (++checksSinceSweep >= 100) {
        checksSinceSweep = 0;
        for (const [k, entry] of map) {
          if (now > entry.resetAt) map.delete(k);
        }
      }
      let entry = map.get(key);
      if (!entry || now > entry.resetAt) {
        entry = { count: 1, resetAt: now + windowMs };
        map.set(key, entry);
        return { allowed: true, retryAfterMs: 0 };
      }
      if (entry.count >= maxPerWindow) {
        return { allowed: false, retryAfterMs: entry.resetAt - now };
      }
      entry.count++;
      return { allowed: true, retryAfterMs: 0 };
    },
  };
}

export function getClientIP(r: Request): string {
  return (
    r.headers.get('cf-connecting-ip') ||
    r.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    r.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}