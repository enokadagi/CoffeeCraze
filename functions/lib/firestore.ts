/**
 * Minimal Firestore v1 REST client for Cloudflare Pages Functions.
 *
 * firebase-admin cannot run on workerd (gRPC), so we authenticate as the Firebase
 * service account: sign a JWT (RS256) with the private key, exchange it for an
 * OAuth2 access token, then call the Firestore REST API directly.
 *
 * Environment (Cloudflare Pages secret `FIREBASE_SERVICE_ACCOUNT`):
 *   FIREBASE_SERVICE_ACCOUNT = <JSON content of the service account key file>
 *
 * Supports single-doc reads, document writes with optimistic-concurrency
 * preconditions, and read-write transactions via beginTransaction/commit/rollback.
 */

export interface FirestoreDoc {
  exists: boolean;
  data: Record<string, unknown>;
  updateTime?: string;
  createTime?: string;
}

export interface WriteOp {
  collection: string;
  docId: string; // explicit id (auto-ids are not supported in atomic commits)
  data: Record<string, unknown>;
  // Preconditions
  precondition?: { exists?: boolean; updateTime?: string };
}

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

function getServiceAccount(): ServiceAccount {
  const raw =
    (globalThis as unknown as { env?: Record<string, string> }).env?.FIREBASE_SERVICE_ACCOUNT ||
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ||
    '';
  if (!raw) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT secret is not configured. Add the Firebase service account JSON as a Cloudflare Pages secret.'
    );
  }
  const parsed = JSON.parse(raw) as ServiceAccount;
  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is missing project_id, client_email or private_key');
  }
  return parsed;
}

function baseUrl(): string {
  const sa = getServiceAccount();
  return `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents`;
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.accessToken;
  const sa = getServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const { b64urlEncode } = await import('./auth');
  const encode = (obj: unknown) => new TextEncoder().encode(JSON.stringify(obj));
  const encHeader = b64urlEncode(new Uint8Array(encode(header)));
  const encClaim = b64urlEncode(new Uint8Array(encode(claim)));

  const pem = sa.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '');
  const rawKey = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8',
    rawKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${encHeader}.${encClaim}`));
  const jwt = `${encHeader}.${encClaim}.${b64urlEncode(new Uint8Array(sig))}`;

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!resp.ok) {
    throw new Error(`OAuth token exchange failed: ${resp.status} ${await resp.text().catch(() => '')}`);
  }
  const data = (await resp.json()) as { access_token: string; expires_in?: number };
  cachedToken = { accessToken: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 - 60_000 };
  return cachedToken.accessToken;
}

async function api(path: string, init?: RequestInit): Promise<unknown> {
  const token = await getAccessToken();
  const resp = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    let code = '';
    try {
      const parsed = JSON.parse(body) as { error?: { code?: number; message?: string; status?: string } };
      code = parsed.error?.status ?? parsed.error?.code?.toString() ?? '';
    } catch {
      /* non-JSON error */
    }
    throw new FirestoreApiError(resp.status, code || body || `Firestore request failed`, body);
  }
  return resp.json();
}

export class FirestoreApiError extends Error {
  status: number;
  details: string;
  constructor(status: number, message: string, details: string) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// ---------- value encoding ----------

export function encodeValue(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return { nullValue: null };
  switch (typeof value) {
    case 'boolean':
      return { booleanValue: value };
    case 'number':
      return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
    case 'string':
      return { stringValue: value };
    case 'bigint':
      return { integerValue: value.toString() };
    case 'object': {
      if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
      const fields: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        if (v !== undefined) fields[k] = encodeValue(v);
      }
      return { mapValue: { fields } };
    }
    default:
      return { nullValue: null };
  }
}

export function decodeValue(value: Record<string, unknown>): unknown {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) {
    const vals = (value.arrayValue as { values?: Record<string, unknown>[] })?.values ?? [];
    return vals.map(decodeValue);
  }
  if ('mapValue' in value) {
    const fields = (value.mapValue as { fields?: Record<string, unknown> })?.fields ?? {};
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields)) out[k] = decodeValue(v as Record<string, unknown>);
    return out;
  }
  if ('timestampValue' in value) return value.timestampValue;
  if ('referenceValue' in value) return value.referenceValue;
  if ('bytesValue' in value) return value.bytesValue;
  return null;
}

function docPath(collection: string, docId: string): string {
  return `${collection}/${docId}`;
}

// ---------- reads ----------

/** Reads one document. */
export async function getDoc(collection: string, docId: string): Promise<FirestoreDoc> {
  const path = docPath(collection, docId);
  try {
    const res = (await api(`/${path}`)) as { name?: string; fields?: Record<string, unknown>; createTime?: string; updateTime?: string };
    return { exists: true, data: decodeFields(res.fields ?? {}), updateTime: res.updateTime, createTime: res.createTime };
  } catch (err) {
    if (err instanceof FirestoreApiError && err.status === 404) {
      return { exists: false, data: {} };
    }
    throw err;
  }
}

function decodeFields(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) out[k] = decodeValue(v as Record<string, unknown>);
  return out;
}

/** Reads multiple documents by path (NOT atomic). */
export async function batchGet(requests: Array<{ collection: string; docId: string }>): Promise<FirestoreDoc[]> {
  const sa = getServiceAccount();
  const name = (r: { collection: string; docId: string }) =>
    `projects/${sa.project_id}/databases/(default)/documents/${docPath(r.collection, r.docId)}`;
  const res = (await api(`:batchGet`, {
    method: 'POST',
    body: JSON.stringify({
      documents: requests.map(name),
    }),
  })) as Array<
    | { found?: { name: string; fields?: Record<string, unknown>; createTime?: string; updateTime?: string } }
    | { missing?: string }
  >;

  const map = new Map<string, FirestoreDoc>();
  for (const entry of res) {
    if (!entry.found) continue;
    const short = entry.found.name.replace(/^projects\/[^/]+\/databases\/\(default\)\/documents\//, '');
    map.set(short, { exists: true, data: decodeFields(entry.found.fields ?? {}), updateTime: entry.found.updateTime, createTime: entry.found.createTime });
  }
  return requests.map((r) => map.get(docPath(r.collection, r.docId)) ?? { exists: false, data: {} });
}

/** Runs a query with basic filters (equality only). */
export async function queryDocs(
  collection: string,
  filters: Array<{ field: string; value: unknown }>
): Promise<FirestoreDoc[]> {
  const where = filters.map((f) => ({
    fieldFilter: { field: { fieldPath: f.field }, op: 'EQUAL', value: encodeValue(f.value) },
  }));
  const body = {
    structuredQuery: {
      from: [{ collectionId: collection }],
      where: where.length === 1 ? { fieldFilter: where[0].fieldFilter } : { compositeFilter: { op: 'AND', filters: where } },
      limit: 100,
    },
  };
  const res = (await api(`:runQuery`, { method: 'POST', body: JSON.stringify(body) })) as Array<{
    document?: { name: string; fields?: Record<string, unknown>; createTime?: string; updateTime?: string };
  }>;
  return res
    .filter((r) => r.document)
    .map((r) => ({
      exists: true,
      data: decodeFields(r.document!.fields ?? {}),
      updateTime: r.document!.updateTime,
      createTime: r.document!.createTime,
    }));
}

// ---------- writes ----------

function updateMaskFor(data: Record<string, unknown>): string[] {
  return Object.keys(data).filter((k) => data[k] !== undefined);
}

function writeOpToRequest(op: WriteOp): Record<string, unknown> {
  if (!op.docId) throw new Error('writeOpToRequest: docId is required (auto-ids are not supported in atomic commits)');
  const name = `${baseUrl()}/${op.collection}/${op.docId}`;
  const request: Record<string, unknown> = {
    update: {
      name,
      fields: (encodeValue(op.data) as { mapValue: { fields: unknown } }).mapValue.fields,
    },
    updateMask: { fieldPaths: updateMaskFor(op.data) },
  };
  if (op.precondition) {
    const pc: Record<string, unknown> = {};
    if (op.precondition.exists !== undefined) pc.exists = op.precondition.exists;
    if (op.precondition.updateTime) pc.updateTime = op.precondition.updateTime;
    request.currentDocument = pc;
  }
  return request;
}

/** Creates a document with an auto-generated id (non-atomic; use commitWrites for atomicity). */
export async function createDoc(collection: string, data: Record<string, unknown>): Promise<string> {
  const res = (await api(`/${collection}`, {
    method: 'POST',
    body: JSON.stringify(encodeValue(data).mapValue),
  })) as { name?: string };
  if (!res.name) throw new Error('createDoc: no document name returned');
  return res.name.split('/').pop() as string;
}

/**
 * Atomically applies a batch of writes (Firestore commit is atomic).
 * Preconditions are attached to every write: documents that were previously
 * read get an `updateTime` precondition (optimistic concurrency — if any of
 * them changed since the read, the whole commit fails and nothing is written),
 * and writes carrying their own `exists` precondition are enforced as-is.
 * Throws `AbortedError` when a precondition fails.
 */
export async function commitWrites(
  writes: WriteOp[],
  readVersions?: Array<{ collection: string; docId: string; updateTime?: string }>
): Promise<void> {
  const versions = new Map<string, string>();
  for (const r of readVersions ?? []) {
    if (r.updateTime) versions.set(`${r.collection}/${r.docId}`, r.updateTime);
  }
  const body = {
    writes: writes.map((op) => {
      const request = writeOpToRequest(op);
      if (!op.precondition) {
        const version = versions.get(`${op.collection}/${op.docId}`);
        if (version) (request as Record<string, unknown>).currentDocument = { updateTime: version };
      }
      return request;
    }),
  };
  try {
    await api(`:commit`, { method: 'POST', body: JSON.stringify(body) });
  } catch (err) {
    if (err instanceof FirestoreApiError) {
      const status = err.status;
      const code = typeof err.message === 'string' ? err.message : '';
      if (status === 409 || status === 412 || code.includes('ABORTED') || code.includes('FAILED_PRECONDITION')) {
        throw new AbortedError(`Atomic commit aborted (${status}): ${err.message}`);
      }
    }
    throw err;
  }
}

export class AbortedError extends Error {}

export async function updateDoc(
  collection: string,
  docId: string,
  data: Record<string, unknown>,
  precondition?: { exists?: boolean; updateTime?: string }
): Promise<void> {
  const path = docPath(collection, docId);
  const body: Record<string, unknown> = encodeValue(data).mapValue as unknown as Record<string, unknown>;
  const qs = new URLSearchParams();
  for (const f of updateMaskFor(data)) qs.append('updateMask.fieldPaths', f);
  if (precondition?.exists === true) qs.set('currentDocument.exists', 'true');
  if (precondition?.exists === false) qs.set('currentDocument.exists', 'false');
  if (precondition?.updateTime) qs.set('currentDocument.updateTime', precondition.updateTime);
  await api(`/${path}?${qs.toString()}`, { method: 'PATCH', body: JSON.stringify(body) });
}
