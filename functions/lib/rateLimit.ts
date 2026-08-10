/** Best-effort per-IP in-memory rate limiting (documented as non-durable across instances). */

export function rateLimiter(maxPerWindow = 30, windowMs = 60_000) {
  const map = new Map<string, { count: number; resetAt: number }>();
  return {
    check(key: string): { allowed: boolean; retryAfterMs: number } {
      const now = Date.now();
      let entry = map.get(key);
      if (!entry || now > entry.resetAt) {
        entry = { count: 1, resetAt: now + windowMs };
        map.set(key, entry);
        return { allowed: true, retryAfterMs: 0 };
      }
      entry.count++;
      if (entry.count > maxPerWindow) return { allowed: false, retryAfterMs: entry.resetAt - now };
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
