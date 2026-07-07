/**
 * A collection of reusable validation and sanitization utilities.
 * All functions are pure — no side effects, no external dependencies.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Lebanese mobile prefixes (Alfa / Touch / MTC) */
const LEBANESE_PREFIXES = [
  "70", "71", "76", "78", "79", // Alfa
  "03", "81", "07",              // Touch / formerly MTC
] as const;

/** Country-code → regex pairs for phone validation. Extend as needed. */
const PHONE_PATTERNS: Record<string, RegExp> = {
  LB: /^(?:\+961|00961)?(?:3[0-9]{7}|7[0-9]{7}|8[0-9]{7}|0[0-9]{8})$/,
  US: /^(?:\+1|1)?[2-9]\d{2}[2-9]\d{2}\d{4}$/,
  FR: /^(?:\+33|0033)[1-9]\d{8}$/,
  UK: /^(?:\+44|0044)[1-9]\d{9}$/,
};

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

// Reasonably strict RFC-5322-ish pattern – rejects most edge-cases without
// being pedantic about quoted strings / IP-literal domains.
const EMAIL_RE =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

export function isValidEmail(email: string): boolean {
  if (typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  return EMAIL_RE.test(trimmed);
}

// ---------------------------------------------------------------------------
// Phone
// ---------------------------------------------------------------------------

/**
 * Validate a phone number.
 *
 * @param phone  Raw phone string (may include `+`, spaces, dashes).
 * @param country  ISO 3166-1 alpha-2 code (default `"LB"` for Lebanon).
 */
export function isValidPhone(phone: string, country = "LB"): boolean {
  if (typeof phone !== "string") return false;

  // Strip common separators before validating.
  const cleaned = phone.replace(/[\s\-().]/g, "");

  const pattern = PHONE_PATTERNS[country.toUpperCase()];
  if (!pattern) {
    // Fallback: any string of 7-15 digits (with optional leading +).
    return /^\+?\d{7,15}$/.test(cleaned);
  }

  return pattern.test(cleaned);
}

// ---------------------------------------------------------------------------
// Password
// ---------------------------------------------------------------------------

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

export function isValidPassword(
  password: string,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof password !== "string") {
    return { valid: false, errors: ["Password must be a string."] };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`,
    );
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    errors.push(
      `Password must not exceed ${PASSWORD_MAX_LENGTH} characters.`,
    );
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter.");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter.");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one digit.");
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character.");
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// URL
// ---------------------------------------------------------------------------

const URL_RE = /^https?:\/\/.+\..+/i;

export function isValidUrl(url: string): boolean {
  if (typeof url !== "string") return false;

  const trimmed = url.trim();
  if (trimmed.length > 2048) return false;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return URL_RE.test(trimmed);
  }
}

// ---------------------------------------------------------------------------
// Name
// ---------------------------------------------------------------------------

const NAME_RE = /^[a-zA-Zà-üÀ-ÜñÑ'\- ]{2,100}$/;

export function isValidName(name: string): boolean {
  if (typeof name !== "string") return false;
  const trimmed = name.trim();
  if (trimmed.length < 2) return false;
  return NAME_RE.test(trimmed);
}

// ---------------------------------------------------------------------------
// Not empty
// ---------------------------------------------------------------------------

export function isNotEmpty(value: string): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

// ---------------------------------------------------------------------------
// Price
// ---------------------------------------------------------------------------

/**
 * General-purpose price validation.
 *
 * - Must be a finite number.
 * - Must be >= 0.
 * - Maximum two decimal places.
 * - Upper bound of 1 000 000 to catch fat-finger errors.
 */
export function isValidPrice(price: number): boolean {
  if (typeof price !== "number" || !Number.isFinite(price)) return false;
  if (price < 0 || price > 1_000_000) return false;

  // Allow at most two decimal places.
  const parts = price.toString().split(".");
  if (parts.length === 2 && parts[1].length > 2) return false;

  return true;
}

// ---------------------------------------------------------------------------
// Quantity
// ---------------------------------------------------------------------------

/**
 * Validate an item quantity (count).
 *
 * - Must be a safe integer >= 0.
 * - Upper bound of 100 000 for sanity.
 */
export function isValidQuantity(qty: number): boolean {
  if (typeof qty !== "number" || !Number.isInteger(qty)) return false;
  if (!Number.isSafeInteger(qty)) return false;
  return qty >= 0 && qty <= 100_000;
}

// ---------------------------------------------------------------------------
// LBP Price
// ---------------------------------------------------------------------------

/**
 * Lebanese Pound price validation.
 *
 * The LBP has been subject to high inflation so values can be large.
 * Rules:
 * - Must be a finite number >= 0.
 * - No decimal places (LBP is not subdivided any more in practice).
 * - Upper bound of 10 000 000 000 (10 billion) to stay within safe integer range.
 */
export function isValidLBPPrice(price: number): boolean {
  if (typeof price !== "number" || !Number.isFinite(price)) return false;
  if (price < 0 || price > 10_000_000_000) return false;

  // Reject fractional values.
  if (!Number.isInteger(price)) return false;

  return true;
}

// ---------------------------------------------------------------------------
// Sanitize
// ---------------------------------------------------------------------------

/**
 * Strip HTML / XML tags, collapse whitespace, and trim the result.
 *
 * @param input  Raw user-supplied string.
 * @returns  Safe, sanitised plain-text string.
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";

  return (
    input
      // Strip HTML / XML tags.
      .replace(/<[^>]*>/g, "")
      // Decode common HTML entities.
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, "/")
      // Normalise whitespace runs to a single space.
      .replace(/\s+/g, " ")
      .trim()
  );
}
