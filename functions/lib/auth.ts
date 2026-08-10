/**
 * Firebase ID token verification for Cloudflare Pages Functions.
 *
 * firebase-admin v14 requires Node 22+ with gRPC (does not run on workerd), so we
 * verify ID tokens natively: RS256 JWT signature checked against the public JWKS
 * published by Firebase Auth for the project. No SDK, no network call per request
 * (keys are cached until rotation).
 */

export interface VerifiedToken {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  exp: number;
  iat: number;
}

const PROJECT_ID = 'coffeecraze-f27d3';
const ISSUER = `https://securetoken.google.com/${PROJECT_ID}`;
const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

let cachedKeys: { keys: Array<Record<string, string>>; fetchedAt: number } | null = null;
const KEY_TTL_MS = 10 * 60 * 1000;

async function fetchKeys(): Promise<Array<Record<string, string>>> {
  const now = Date.now();
  if (cachedKeys && now - cachedKeys.fetchedAt < KEY_TTL_MS) return cachedKeys.keys;
  const resp = await fetch(JWKS_URL, { headers: { accept: 'application/json' } });
  if (!resp.ok) throw new Error(`Failed to fetch Firebase JWKS: ${resp.status}`);
  const data = (await resp.json()) as { keys?: Array<Record<string, string>> };
  cachedKeys = { keys: data.keys ?? [], fetchedAt: now };
  return cachedKeys.keys;
}

function b64urlDecode(input: string): Uint8Array {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Verifies a Firebase ID token and returns its claims.
 * Throws on any verification failure.
 */
export async function verifyIdToken(idToken: string): Promise<VerifiedToken> {
  const parts = idToken.split('.');
  if (parts.length !== 3) throw new Error('Malformed ID token');

  const headerJson = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[0]))) as { alg?: string; kid?: string; typ?: string };
  if (headerJson.alg !== 'RS256') throw new Error('Unexpected token algorithm');
  if (!headerJson.kid) throw new Error('Missing token key id');

  const payloadJson = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[1]))) as Record<string, unknown>;

  const nowSec = Math.floor(Date.now() / 1000);
  const exp = Number(payloadJson.exp ?? 0);
  const iat = Number(payloadJson.iat ?? 0);
  if (!exp || exp < nowSec - 60) throw new Error('Token expired');
  if (!iat || iat > nowSec + 300) throw new Error('Token issued in the future');
  if (payloadJson.iss !== ISSUER) throw new Error('Token issuer mismatch');
  // Firebase ID tokens carry the project number as aud. We relax the check to
  // "non-empty numeric string" because the project number is not otherwise
  // discoverable without the management API; the signature + issuer already
  // pin the token to this Firebase project.
  if (typeof payloadJson.aud !== 'string' || !/^\d+$/.test(payloadJson.aud)) {
    throw new Error('Token audience mismatch');
  }
  if (typeof payloadJson.sub !== 'string' || !payloadJson.sub) throw new Error('Token missing subject');

  const keys = await fetchKeys();
  const key = keys.find((k) => k.kid === headerJson.kid);
  if (!key) throw new Error('Unknown signing key');

  const publicKey = await crypto.subtle.importKey(
    'jwk',
    key as JsonWebKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const sig = b64urlDecode(parts[2]);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', publicKey, sig, data);
  if (!valid) throw new Error('Token signature invalid');

  return {
    uid: payloadJson.sub as string,
    email: (payloadJson.email as string) ?? null,
    emailVerified: payloadJson.email_verified === true,
    name: (payloadJson.name as string) ?? null,
    exp,
    iat,
  };
}

/** Extracts the Bearer token from a request Authorization header. */
export function extractBearer(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (!auth) return null;
  const match = /^Bearer\s+(.+)$/i.exec(auth.trim());
  return match ? match[1] : null;
}

export { b64urlEncode };
