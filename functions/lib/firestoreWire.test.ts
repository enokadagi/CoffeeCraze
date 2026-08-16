import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';

/**
 * Wire-format regression guards for the Firestore REST client.
 *
 * Guards two classes of bug that broke production ordering (each produced a
 * misleading "Stock changed while placing the order" / 400 on every create):
 *   1. updateMask/currentDocument nested inside `update` instead of being
 *      siblings of it in the Write message (commit endpoint 400).
 *   2. updateDoc sending `updateMask=stock` (message-typed param must be
 *      `updateMask.fieldPaths=stock`) and double-wrapping `fields`.
 */

type FetchCall = { url: string; init: RequestInit | undefined; method: string | undefined };

const calls: FetchCall[] = [];

let fakePem = '';
let fakeClientEmail = 'sa@test.coffeecraze-f27d3.iam.gserviceaccount.com';
let fakeProject = 'coffeecraze-f27d3';

function mockFirestore(status: number, okBody: unknown) {
  calls.length = 0;
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init, method: init?.method as string | undefined });
    if (String(url).includes('oauth2.googleapis.com/token')) {
      return new Response(JSON.stringify({ access_token: 'fake-token', expires_in: 3600 }), { status: 200 });
    }
    return new Response(JSON.stringify(okBody), { status, headers: { 'content-type': 'application/json' } });
  }));
}

afterEach(() => vi.unstubAllGlobals());

beforeAll(async () => {
  const subtle = globalThis.crypto.subtle;
  const kp = await subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign']);
  const raw = await subtle.exportKey('pkcs8', kp.privateKey);
  fakePem = `-----BEGIN PRIVATE KEY-----${Buffer.from(raw).toString('base64')}-----END PRIVATE KEY-----`;
  process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({
    project_id: fakeProject,
    client_email: fakeClientEmail,
    private_key: fakePem,
  });
});

describe('commitWrites — Wire (Write) message shape', () => {
  it('updateMask and currentDocument are SIBLINGS of update, not nested', async () => {
    const { commitWrites } = await import('./firestore');
    mockFirestore(200, { writeResults: [], commitTime: '2026-01-01T00:00:00Z' });

    await commitWrites(
      [
        { collection: 'products', docId: 'p1', data: { stock: 4, updatedAt: 'now' }, precondition: { exists: true } },
        { collection: 'orders', docId: 'o1', data: { status: 'pending' } },
        { collection: 'orders', docId: 'o2', data: { status: 'pending' } },
      ],
      [
        { collection: 'products', docId: 'p1', updateTime: '2026-01-01T00:00:01Z' },
        { collection: 'orders', docId: 'o2', updateTime: '2026-01-01T00:00:02Z' },
      ]
    );

    const commit = calls.find((c) => c.url.includes(':commit'));
    expect(commit).toBeDefined();
    const body = JSON.parse(String(commit!.init?.body));
    expect(Array.isArray(body.writes)).toBe(true);
    expect(body.writes).toHaveLength(3);

    const [w1, w2, w3] = body.writes;
    // siblings
    expect(w1.update).not.toHaveProperty('updateMask');
    expect(w1.update).not.toHaveProperty('currentDocument');
    expect(w1.updateMask).toEqual({ fieldPaths: ['stock', 'updatedAt'] });
    expect(w1.update.name).toContain('/documents/products/p1');
    expect(w1.update.name).toMatch(/^projects\/coffeecraze-f27d3\/databases\/\(default\)\/documents\/products\/p1$/);
    // op-level exists precondition wins over the readVersion of the same doc
    expect(w1.currentDocument).toEqual({ exists: true });
    // no precondition and no readVersion -> no currentDocument
    expect(w2).not.toHaveProperty('currentDocument');
    // no precondition but a readVersion -> updateTime precondition attached
    expect(w3.currentDocument).toEqual({ updateTime: '2026-01-01T00:00:02Z' });
    expect(w3.updateMask).toEqual({ fieldPaths: ['status'] });
    // fields is the direct map, never {fields:{fields:...}}
    expect(w1.update.fields).toEqual({ stock: { integerValue: '4' }, updatedAt: { stringValue: 'now' } });
    expect(w1.update.fields.fields).toBeUndefined();
    // name is RELATIVE (a full https URL is rejected by the commit endpoint)
    expect(w1.update.name).not.toMatch(/^https?:/);
  });

  it('does not attach currentDocument when neither precondition nor readVersion exist', async () => {
    const { commitWrites } = await import('./firestore');
    mockFirestore(200, { writeResults: [], commitTime: '2026-01-01T00:00:00Z' });

    await commitWrites([{ collection: 'orders', docId: 'o1', data: { status: 'pending' } }]);

    const commit = calls.find((c) => c.url.includes(':commit'));
    const body = JSON.parse(String(commit!.init?.body));
    expect(body.writes[0]).not.toHaveProperty('currentDocument');
    expect(body.writes[0].updateMask).toEqual({ fieldPaths: ['status'] });
    expect(body.writes[0].update.fields).toEqual({ status: { stringValue: 'pending' } });
    expect(body.writes[0].update.fields.fields).toBeUndefined();
  });
});

describe('commitWrites — error mapping', () => {
  it('409/ABORTED maps to AbortedError (genuine concurrency)', async () => {
    const { commitWrites, AbortedError } = await import('./firestore');
    mockFirestore(409, { error: { code: 409, status: 'ABORTED', message: 'ABORTED: concurrent write' } });
    await expect(
      commitWrites([{ collection: 'orders', docId: 'o1', data: { status: 'pending' } }])
    ).rejects.toBeInstanceOf(AbortedError);
  });

  it('400 FAILED_PRECONDITION maps to AbortedError (stale read version)', async () => {
    const { commitWrites, AbortedError } = await import('./firestore');
    mockFirestore(400, { error: { code: 400, status: 'FAILED_PRECONDITION', message: 'FAILED_PRECONDITION: version mismatch' } });
    await expect(
      commitWrites([{ collection: 'orders', docId: 'o1', data: { status: 'pending' } }])
    ).rejects.toBeInstanceOf(AbortedError);
  });

  it('400 INVALID_ARGUMENT does NOT masquerade as "stock changed" (surfaces as real error)', async () => {
    const { commitWrites, AbortedError } = await import('./firestore');
    mockFirestore(400, { error: { code: 400, status: 'INVALID_ARGUMENT', message: 'Invalid JSON payload received.' } });
    await expect(
      commitWrites([{ collection: 'orders', docId: 'o1', data: { status: 'pending' } }])
    ).rejects.not.toBeInstanceOf(AbortedError);
  });

  it('412 PRECONDITION_FAILED maps to AbortedError', async () => {
    const { commitWrites, AbortedError } = await import('./firestore');
    mockFirestore(412, { error: { code: 412, status: 'PRECONDITION_FAILED', message: 'PRECONDITION_FAILED' } });
    await expect(
      commitWrites([{ collection: 'orders', docId: 'o1', data: { status: 'pending' } }])
    ).rejects.toBeInstanceOf(AbortedError);
  });
});

describe('updateDoc — PATCH wire shape', () => {
  it('uses updateMask.fieldPaths dotted param and a single-level fields body', async () => {
    const { updateDoc } = await import('./firestore');
    mockFirestore(200, { name: 'docs/products/p1', fields: { stock: { integerValue: '9' } } });

    await updateDoc('products', 'p1', { stock: 9 });

    const patch = calls.find((c) => c.method === 'PATCH' || c.url.includes('documents/products/p1'));
    expect(patch).toBeDefined();
    expect(patch!.url).toContain('updateMask.fieldPaths=stock');
    expect(patch!.url).not.toContain('updateMask=stock');
    const body = JSON.parse(String(patch!.init?.body));
    expect(body).toHaveProperty('fields');
    expect(body.fields).toHaveProperty('stock');
    expect(body.fields!.fields).toBeUndefined(); // no double-wrapped {fields:{fields:...}}
  });

  it('carries precondition query params', async () => {
    const { updateDoc } = await import('./firestore');
    mockFirestore(200, { name: 'docs/products/p1', fields: { stock: { integerValue: '9' } } });

    await updateDoc('products', 'p1', { stock: 9 }, { exists: false, updateTime: '2026-01-01T00:00:00Z' });

    const patch = calls.find((c) => c.url.includes('documents/products/p1'));
    expect(patch!.url).toContain('currentDocument.exists=false');
    expect(patch!.url).toContain(`currentDocument.updateTime=${encodeURIComponent('2026-01-01T00:00:00Z')}`);
  });
});

describe('createDoc — auto-id POST shape', () => {
  it('sends a single-level fields body (no double wrap)', async () => {
    const { createDoc } = await import('./firestore');
    mockFirestore(200, { name: 'projects/coffeecraze-f27d3/databases/(default)/documents/products/auto123' });

    const id = await createDoc('products', { name: 'x', stock: 1 });

    expect(id).toBe('auto123');
    const post = calls.find((c) => c.method === 'POST' && c.url.endsWith('/documents/products'));
    expect(post).toBeDefined();
    const body = JSON.parse(String(post!.init?.body));
    expect(body.fields).toHaveProperty('name');
    expect(body.fields!.fields).toBeUndefined();
  });
});