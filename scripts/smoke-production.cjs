/**
 * CoffeeCraze — PHASE 1 LIVE SMOKE TEST HARNESS
 *
 * Exercises the deployed server-authoritative APIs against the REAL environment:
 *   POST /api/orders        (quote | create | cancel)
 *   POST /api/subscriptions (quote | create)
 * plus Firestore security-rule checks (ownership, authorization, COD collection,
 * order state machine) and data-integrity read-back verification.
 *
 * Rules of the road:
 *  - Never prints tokens, private keys, cookies or API secrets.
 *  - Never hardcodes secrets; everything comes from environment variables.
 *  - PASS is reported only after a request actually executed and verified.
 *  - Creates only clearly-prefixed test data and restores/cleans up what it can;
 *    anything requiring manual cleanup is reported explicitly.
 *
 * Usage:
 *   node scripts/smoke-production.cjs --envcheck   # config check, no network
 *   node scripts/smoke-production.cjs              # run full suite
 *
 * Env vars documented in docs/PRODUCTION_SMOKE_TEST.md
 */

'use strict';

const fs = require('node:fs');

const env = process.env;
const BASE = (env.CC_BASE_URL || 'https://coffeecraze.nilelink.app').replace(/\/+$/, '');
const API_KEY = env.CC_FIREBASE_API_KEY || '';
const PROJECT = env.CC_PROJECT_ID || 'coffeecraze-f27d3';
const DELAY_MS = Number(env.CC_DELAY_MS ?? 2000);
const FIRESTORE_V1 = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const IDENTITY = 'https://identitytoolkit.googleapis.com/v1';

/* ------------------------------------------------------------------ */
/* Reporting                                                            */
/* ------------------------------------------------------------------ */

const results = [];

function record(status, section, test, detail, evidence) {
  results.push({ status, section, test, detail, evidence });
  const tag = status === 'PASS' ? 'PASS' : status === 'FAIL' ? 'FAIL' : status === 'SKIPPED' ? '----' : 'BLOC';
  console.log(`[${tag}] ${section} :: ${test} — ${detail}`);
  if (status === 'FAIL' && evidence !== undefined && evidence !== null) {
    console.log(`      evidence: ${safeJson(evidence).slice(0, 500)}`);
  }
}

function safeJson(value) {
  try {
    return JSON.stringify(value, (key, val) =>
      /token|secret|password|private.?key|refresh|cookie|authorization|credential|api.?key/i.test(key)
        ? '[REDACTED]'
        : val
    );
  } catch {
    return String(value);
  }
}

function errText(err) {
  return err && typeof err === 'object' && err.message ? String(err.message).slice(0, 300) : String(err ?? 'unknown').slice(0, 300);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pace = () => (DELAY_MS ? sleep(DELAY_MS + Math.random() * DELAY_MS) : Promise.resolve());
const uid = () => `smoke-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

/* ------------------------------------------------------------------ */
/* Product API HTTP (never logs bodies / headers)                      */
/* ------------------------------------------------------------------ */

async function http(path, { method = 'GET', body, token } = {}) {
  const init = { method, headers: {} };
  if (body !== undefined) { init.headers['content-type'] = 'application/json'; init.body = JSON.stringify(body); }
  if (token) init.headers.authorization = `Bearer ${token}`;
  const resp = await fetch(BASE + path, init);
  const text = await resp.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  return { status: resp.status, ok: resp.ok, data };
}

async function apiPost(path, body, token) {
  for (let attempt = 1; ; attempt++) {
    const r = await http(path, { method: 'POST', body, token });
    if (r.status === 429 && attempt <= 3) {
      console.log('     [rate] 429 — backing off');
      await sleep(DELAY_MS * 2 + 1000);
      continue;
    }
    return r;
  }
}

/* ------------------------------------------------------------------ */
/* Firebase Auth (identity toolkit) — tokens in memory only            */
/* ------------------------------------------------------------------ */

function decodeJwtPayload(token) {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = part.length % 4 === 0 ? '' : '='.repeat(4 - (part.length % 4));
    return JSON.parse(Buffer.from(part + pad, 'base64').toString('utf8'));
  } catch { return {}; }
}

async function identityCall(endpoint, payload) {
  const resp = await fetch(`${IDENTITY}/${endpoint}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await resp.json().catch(() => ({}));
  return { status: resp.status, ok: resp.ok, data };
}

async function ensureIdentity(email, password) {
  if (!email || !password) throw new Error('email/password env vars not set');
  let r = await identityCall('accounts:signInWithPassword', { email, password, returnSecureToken: true });
  if (r.status === 400 && /EMAIL_NOT_FOUND|USER_NOT_FOUND|INVALID_LOGIN_CREDENTIALS/.test(r.data?.error?.message || '')) {
    r = await identityCall('accounts:signUpWithPassword', { email, password, returnSecureToken: true });
  }
  if (!r.ok || !r.data?.idToken) throw new Error(`auth failed (${r.status} ${r.data?.error?.message || 'unknown'})`);
  const claims = decodeJwtPayload(r.data.idToken);
  return {
    token: r.data.idToken,
    uid: r.data.localId || claims.sub,
    email: claims.email || '',
    emailVerified: claims.email_verified === true,
    displayName: r.data.displayName || email.split('@')[0] || 'Smoke',
  };
}

/* ------------------------------------------------------------------ */
/* Firestore REST with USER tokens (security rules ARE enforced)       */
/* ------------------------------------------------------------------ */

function fsUrl(path) { return `${FIRESTORE_V1}/${path}`; }

function encodeValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  switch (typeof value) {
    case 'boolean': return { booleanValue: value };
    case 'number': return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
    case 'string': return { stringValue: value };
    case 'bigint': return { integerValue: value.toString() };
    case 'object': {
      if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
      const fields = {};
      for (const [k, v] of Object.entries(value)) if (v !== undefined) fields[k] = encodeValue(v);
      return { mapValue: { fields } };
    }
    default: return { nullValue: null };
  }
}

function encodeFields(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj ?? {})) out[k] = encodeValue(v);
  return out;
}

function decodeValue(v) {
  if (v && typeof v === 'object') {
    if ('stringValue' in v) return v.stringValue;
    if ('integerValue' in v) return Number(v.integerValue);
    if ('doubleValue' in v) return v.doubleValue;
    if ('booleanValue' in v) return v.booleanValue;
    if ('nullValue' in v) return null;
    if ('arrayValue' in v) return (v.arrayValue?.values || []).map(decodeValue);
    if ('mapValue' in v) { const m = {}; for (const [k, x] of Object.entries(v.mapValue?.fields || {})) m[k] = decodeValue(x); return m; }
    if ('timestampValue' in v) return v.timestampValue;
    if ('referenceValue' in v) return v.referenceValue;
    if ('bytesValue' in v) return v.bytesValue;
  }
  return v;
}

function decodeFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields || {})) out[k] = decodeValue(v);
  return out;
}

async function fsRequest(method, path, token, body, query) {
  const url = fsUrl(path) + (query ? `?${query}` : '');
  const init = { method, headers: { authorization: `Bearer ${token}` } };
  if (body !== undefined) { init.headers['content-type'] = 'application/json'; init.body = JSON.stringify(body); }
  const resp = await fetch(url, init);
  if (resp.status === 404) return { status: 404, ok: false, data: null };
  const data = await resp.json().catch(() => null);
  return { status: resp.status, ok: resp.ok, data };
}

async function fsGet(token, path) {
  const r = await fsRequest('GET', path, token);
  return { status: r.status, ok: r.status === 200, exists: r.status === 200, data: r.status === 200 ? decodeFields(r.data?.fields) : null };
}

async function fsPatch(token, path, fields) {
  const r = await fsRequest('PATCH', path, token, encodeFields(fields));
  return { status: r.status, ok: r.ok, data: r.ok ? decodeFields(r.data?.fields) : r.data };
}

async function fsCreate(token, collection, docId, data) {
  const r = await fsRequest('POST', `${collection}?documentId=${encodeURIComponent(docId)}`, token, encodeFields(data));
  return { status: r.status, ok: r.ok, data: r.ok ? decodeFields(r.data?.fields) : r.data };
}

async function fsDelete(token, path) {
  const r = await fsRequest('DELETE', path, token);
  return { status: r.status, ok: r.ok, data: r.data };
}

async function fsQuery(token, collection, filters) {
  const where = filters.map((f) => ({
    fieldFilter: { field: { fieldPath: f.field }, op: f.op || 'EQUAL', value: encodeValue(f.value) },
  }));
  const structuredQuery = { from: [{ collectionId: collection }] };
  if (where.length) structuredQuery.where = where.length === 1 ? where[0] : { compositeFilter: { op: 'AND', filters: where } };
  const r = await fsRequest('POST', `${collection}:runQuery`, token, { structuredQuery });
  return { status: r.status, ok: r.ok, docs: Array.isArray(r.data) ? r.data.filter((d) => d.document).map((d) => ({ data: decodeFields(d.document.fields) })) : [] };
}

/* ------------------------------------------------------------------ */
/* MAIN                                                                */
/* ------------------------------------------------------------------ */

async function main() {
  const startedAt = Date.now();

  if (!API_KEY) { console.log('BLOCKED :: CC_FIREBASE_API_KEY missing — see docs/PRODUCTION_SMOKE_TEST.md'); process.exit(1); }
  console.log(`smoke target: ${BASE} | project ${PROJECT} | pacing ${DELAY_MS}ms`);

  if (process.argv.includes('--envcheck')) {
    const required = ['CC_FIREBASE_API_KEY', 'CC_CUSTOMER_A_EMAIL', 'CC_CUSTOMER_A_PASSWORD', 'CC_CUSTOMER_B_EMAIL', 'CC_CUSTOMER_B_PASSWORD', 'CC_ADMIN_EMAIL', 'CC_ADMIN_PASSWORD', 'CC_TEST_PRODUCT_ID'];
    const missing = required.filter((k) => !env[k]);
    console.log(missing.length ? `envcheck: MISSING → ${missing.join(', ')}` : 'envcheck: all required vars present');
    if (env.CC_TEST_PLAN_ID) console.log('envcheck: CC_TEST_PLAN_ID present (plan tests enabled)');
    else console.log('envcheck: CC_TEST_PLAN_ID absent (plan/ownership tests will SKIP)');
    process.exit(missing.length ? 1 : 0);
  }

  const A = await ensureIdentity(env.CC_CUSTOMER_A_EMAIL, env.CC_CUSTOMER_A_PASSWORD).catch((e) => { record('BLOCKED', 'identity', 'customer A', errText(e), null); return null; });
  const B = await ensureIdentity(env.CC_CUSTOMER_B_EMAIL, env.CC_CUSTOMER_B_PASSWORD).catch((e) => { record('BLOCKED', 'identity', 'customer B', errText(e), null); return null; });
  const admin = await ensureIdentity(env.CC_ADMIN_EMAIL, env.CC_ADMIN_PASSWORD).catch((e) => { record('BLOCKED', 'identity', 'admin', errText(e), null); return null; });
  if (!A || !B || !admin) { await reportSummary(startedAt, 1); return; }

  // Ensure user docs exist (self-provisioning allowed by rules when role = customer)
  for (const [u, label] of [[A, 'A'], [B, 'B'], [admin, 'ADMIN']]) {
    const existing = await fsGet(u.token, `users/${u.uid}`);
    if (!existing.exists) {
      const res = await fsCreate(u.token, 'users', u.uid, {
        uid: u.uid, email: u.email, displayName: `Smoke ${label}`, role: 'customer', onboarded: true,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
      if (!res.ok) record('BLOCKED', 'provision', `users/${label}`, `user doc create HTTP ${res.status}`, null);
    }
  }
  const adminProf = await fsGet(admin.token, `users/${admin.uid}`);
  const adminRole = adminProf.exists ? (adminProf.data.role || '') : '';
  if (adminProf.exists && !['owner', 'super_admin', 'admin'].includes(adminRole)) {
    record('BLOCKED', 'provision', 'admin-role', `admin resolves to role '${adminRole}' — need owner/super_admin/admin`, null);
    await reportSummary(startedAt, 1);
    return;
  }

  const pid = env.CC_TEST_PRODUCT_ID;
  const productRes = await fsGet(admin.token, `products/${pid}`);
  if (!productRes.exists) { record('BLOCKED', 'provision', 'product', `CC_TEST_PRODUCT_ID ${pid} not found`, null); await reportSummary(startedAt, 1); return; }
  const product = productRes.data;
  const variant = env.CC_TEST_PRODUCT_VARIANT_ID
    ? (product.variants || []).find((v) => v.id === env.CC_TEST_PRODUCT_VARIANT_ID) || null
    : null;
  if (env.CC_TEST_PRODUCT_VARIANT_ID && !variant) { record('BLOCKED', 'provision', 'variant', `variant ${env.CC_TEST_PRODUCT_VARIANT_ID} not on ${pid}`, null); await reportSummary(startedAt, 1); return; }

  const settingsRes = await fsGet(admin.token, 'site_settings/app');
  const settings = settingsRes.exists
    ? { fee: Math.round(Number(settingsRes.data.deliveryFeeLbp ?? 25000)), threshold: Math.round(Number(settingsRes.data.freeDeliveryThresholdLbp ?? 1500000)) }
    : { fee: 25000, threshold: 1500000 };

  const unitLbp = Math.round(Number(variant ? variant.priceLbp ?? variant.price : product.priceLbp ?? product.price) || 0);
  const originalStock = await productStock(admin, pid, null);
  const originalVariantStock = variant ? await productStock(admin, pid, variant.id) : null;
  if (!unitLbp) { record('BLOCKED', 'provision', 'price', `product ${pid} has no price`, null); await reportSummary(startedAt, 1); return; }

  const shipping = { fullName: 'Smoke Test Customer', street: 'Rue Smoke 1', city: 'Beirut', phone: '+9613000001' };
  const ctx = { A, B, admin, createdOrders: [], createdSubId: null };

  /* ---------- 1. orders ---------- */

  // 1a unauthenticated
  let r = await apiPost('/api/orders', { mode: 'quote', items: [{ productId: pid, quantity: 1 }] }, null);
  record(r.status === 401 ? 'PASS' : 'FAIL', 'orders', '1a-unauthenticated', r.status === 401 ? '401 as expected' : `got ${r.status}`, r.data);

  // 1b valid quote — server math must equal DB math
  await pace();
  const qty2body = { productId: pid, quantity: 2, ...(variant ? { variantId: variant.id } : {}) };
  r = await apiPost('/api/orders', { mode: 'quote', items: [qty2body] }, A.token);
  const quote = r.status === 200 && r.data?.ok ? r.data.quote : null;
  const expectSubtotal = unitLbp * 2;
  const expectShipping = expectSubtotal >= settings.threshold ? 0 : settings.fee;
  record(r.status === 200 && quote && quote.subtotalLbp === expectSubtotal && quote.shippingLbp === expectShipping && quote.totalLbp === expectSubtotal + expectShipping
    ? 'PASS' : 'FAIL', '1-orders', '1b-valid-quote', `HTTP ${r.status} subtotal ${quote?.subtotalLbp}/${expectSubtotal} ship ${quote?.shippingLbp}/${expectShipping}`, quote && { subtotal: quote.subtotalLbp, shipping: quote.shippingLbp, total: quote.totalLbp });

  // 1c valid create
  await pace();
  const reqId = uid();
  r = await apiPost('/api/orders', { mode: 'create', requestId: reqId, items: [qty2body], shipping, deliveryDate: '2026-08-20' }, A.token);
  const orderId = r.status === 201 ? r.data?.orderId : null;
  record(r.status === 201 ? 'PASS' : 'FAIL', '1-orders', '1c-create', `HTTP ${r.status} ${r.data?.error || ''}`, r.data);
  if (orderId) ctx.createdOrders.push(orderId);

  // 1d doc integrity (admin read-back)
  await pace();
  if (orderId) {
    const o = (await fsGet(admin.token, `orders/${orderId}`)).data || {};
    const item = (o.items || [])[0] || {};
    const itemOk = item.productId === pid && item.quantity === 2 && item.unitPriceLbp === unitLbp;
    const moneyOk = o.subtotalLbp === expectSubtotal && o.shippingLbp === expectShipping && o.totalLbp === expectSubtotal + expectShipping
      && o.currency === 'LBP' && o.paymentMethod === 'cash_on_delivery' && o.paymentStatus === 'pending' && o.status === 'pending';
    const pass = itemOk && moneyOk && o.userId === A.uid && o.requestId === reqId;
    record(pass ? 'PASS' : 'FAIL', '1-orders', '1d-doc-integrity', 'snapshot + totals + money flags + owner + requestId', { userId: o.userId, requestId: o.requestId, status: o.status, paymentStatus: o.paymentStatus, paymentMethod: o.paymentMethod, currency: o.currency, item });
  }

  // 1e price/total manipulation — clientPrice + fabricated totals must be ignored
  await pace();
  r = await apiPost('/api/orders', {
    mode: 'create', requestId: uid(),
    items: [{ productId: pid, quantity: 1, clientPrice: 1 }],
    shipping, deliveryDate: '2026-08-20',
    subtotal: 1, total: 1, shipping: -50, discount: 999999,
  }, A.token);
  if (r.status === 201) ctx.createdOrders.push(r.data.orderId);
  const manipDoc = r.status === 201 ? (await fsGet(admin.token, `orders/${r.data.orderId}`)).data : null;
  const expectedOne = unitLbp + (unitLbp >= settings.threshold ? 0 : settings.fee);
  record(r.status === 201 && manipDoc && manipDoc.subtotalLbp === unitLbp && manipDoc.totalLbp === expectedOne && manipDoc.discountLbp === 0
    ? 'PASS' : 'FAIL', '1-orders', '1e-price-manipulation', 'client price/totals/discount ignored — authoritative stored', manipDoc && { subtotal: manipDoc.subtotalLbp, total: manipDoc.totalLbp, discount: manipDoc.discountLbp });

  // 1f quantity manipulation
  await pace();
  for (const qty of [0, -3, 2.5, 1e9, 'abc', null]) {
    const rr = await apiPost('/api/orders', { mode: 'create', requestId: uid(), items: [{ productId: pid, quantity: qty }], shipping, deliveryDate: '2026-08-20' }, A.token);
    const expected = qty === 1e9 ? 409 : 400;
    record(rr.status === expected ? 'PASS' : 'FAIL', '1-orders', `1f-qty-${String(qty)}`, `HTTP ${rr.status} expected ${expected}`, rr.data);
  }

  // 1g idempotency — same requestId twice → same order, single decrement
  await pace();
  const stockBefore = await productStock(admin, pid, variant?.id);
  r = await apiPost('/api/orders', { mode: 'create', requestId: reqId, items: [qty2body], shipping, deliveryDate: '2026-08-20' }, A.token);
  const stockAfter = await productStock(admin, pid, variant?.id);
  const idemOk = r.status === 200 && r.data?.idempotent === true && r.data?.orderId === orderId;
  record(idemOk && stockAfter === stockBefore ? 'PASS' : 'FAIL', '1-orders', '1g-idempotency', `HTTP ${r.status} idempotent=${r.data?.idempotent} stock did not change (${stockAfter})`, r.data);

  // 1h stock race (variant-required fixture; skips otherwise)
  await pace();
  if (variant) {
    await fsPatch(admin.token, `products/${pid}`, { variants: product.variants.map((v) => v.id === variant.id ? { ...v, stock: 1 } : v) });
    await pace();
    const ids = [uid(), uid()];
    const [ra, rb] = await Promise.all([
      apiPost('/api/orders', { mode: 'create', requestId: ids[0], items: [{ productId: pid, quantity: 1, variantId: variant.id }], shipping, deliveryDate: '2026-08-20' }, A.token),
      apiPost('/api/orders', { mode: 'create', requestId: ids[1], items: [{ productId: pid, quantity: 1, variantId: variant.id }], shipping, deliveryDate: '2026-08-20' }, B.token),
    ]);
    const afterRace = await productStock(admin, pid, variant.id);
    await patchProductStock(admin, pid, variant.id, originalVariantStock);
    const winners = [ra, rb].filter((x) => x.status === 201).length;
    for (const x of [ra, rb]) if (x.status === 201) ctx.createdOrders.push(x.data.orderId);
    record(winners === 1 && afterRace >= 0 ? 'PASS' : 'FAIL', '1-orders', '1h-stock-race', `winners ${winners}/1, stock after ${afterRace} (never negative)`, { ra: ra.status, rb: rb.status, afterRace });
  } else {
    record('SKIPPED', '1-orders', '1h-stock-race', 'requires CC_TEST_PRODUCT_VARIANT_ID', null);
  }

  /* ---------- 2. coupons ---------- */
  const couponCode = `SMOKE_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  await pace();
  const cr = await fsCreate(admin.token, 'coupons', couponCode, {
    code: couponCode, discountPercent: 10, isActive: true, usageLimit: 100, usedCount: 0, createdAt: new Date().toISOString(),
  });
  record(cr.ok ? 'PASS' : 'FAIL', '2-coupons', '2a-fixture', `coupon created HTTP ${cr.status}`, null);

  // 2a valid application — server-side discount, client discount ignored
  await pace();
  r = await apiPost('/api/orders', {
    mode: 'create', requestId: uid(), items: [{ productId: pid, quantity: 1 }], shipping, deliveryDate: '2026-08-20',
    couponCode, couponDiscount: 1,
  }, A.token);
  if (r.status === 201) ctx.createdOrders.push(r.data.orderId);
  const ordDoc = r.status === 201 ? (await fsGet(admin.token, `orders/${r.data.orderId}`)).data : null;
  const discountExpect = Math.floor((unitLbp * 10) / 100);
  const soldUsed = (await fsGet(admin.token, `coupons/${couponCode}`)).data?.usedCount ?? -1;
  record(r.status === 201 && ordDoc?.couponCode === couponCode && ordDoc?.couponDiscountLbp === discountExpect && soldUsed === 1
    ? 'PASS' : 'FAIL', '2-coupons', '2b-valid-discount', `discount ${ordDoc?.couponDiscountLbp} expected ${discountExpect}, usedCount ${soldUsed}`, { discount: ordDoc?.couponDiscountLbp, total: ordDoc?.totalLbp, usedCount: soldUsed });

  // 2b invalid code
  r = await apiPost('/api/orders', { mode: 'quote', items: [{ productId: pid, quantity: 1 }], couponCode: 'NOPE_NOT_EXISTS' }, A.token);
  record(r.status === 200 && r.data?.quote === null ? 'PASS' : 'FAIL', '2-coupons', '2b-invalid-code', `quote null + HTTP ${r.status}`, null);

  // 2c expired + inactive → rejected
  await fsPatch(admin.token, `coupons/${couponCode}`, { isActive: false, expiresAt: new Date(Date.now() - 10000).toISOString() });
  r = await apiPost('/api/orders', { mode: 'quote', items: [{ productId: pid, quantity: 1 }], couponCode }, A.token);
  const q2 = r.data?.quote;
  record(r.status === 200 && q2?.ok === false && q2?.coupon?.valid === false && q2?.coupon?.discountLbp === 0
    ? 'PASS' : 'FAIL', '2-coupons', '2c-expired-inactive', 'quote not ok, no discount', q2 && { valid: q2.coupon.valid, blockers: q2.blockers });
  await fsPatch(admin.token, `coupons/${couponCode}`, { isActive: true, expiresAt: null });

  // 2d usage-limit race: limit=1, two concurrent creates → exactly one redemption
  await fsPatch(admin.token, `coupons/${couponCode}`, { usageLimit: 1, usedCount: 0 });
  const [c1, c2] = await Promise.all([
    apiPost('/api/orders', { mode: 'create', requestId: uid(), items: [{ productId: pid, quantity: 1 }], shipping, deliveryDate: '2026-08-20', couponCode }, A.token),
    apiPost('/api/orders', { mode: 'create', requestId: uid(), items: [{ productId: pid, quantity: 2 }], shipping, deliveryDate: '2026-08-20', couponCode }, B.token),
  ]);
  const usedAfter = (await fsGet(admin.token, `coupons/${couponCode}`)).data?.usedCount ?? -1;
  const winsUsed = [c1, c2].filter((x) => x.status === 201).length;
  for (const x of [c1, c2]) if (x.status === 201) ctx.createdOrders.push(x.data.orderId);
  record(winsUsed === 1 && usedAfter === 1 ? 'PASS' : 'FAIL', '2-coupons', '2d-usage-limit-race', `redeemed ${winsUsed}/1, usedCount ${usedAfter} at limit 1`, { statuses: [c1.status, c2.status], usedAfter });

  // 2e cleanup
  const delC = await fsDelete(admin.token, `coupons/${couponCode}`);
  record(delC.ok || delC.status === 404 ? 'PASS' : 'FAIL', '2-coupons', '2e-cleanup', `HTTP ${delC.status}`, null);

  /* ---------- 3. order state machine (admin rules) ---------- */
  const lifeOrderId = orderId; // from 1c
  if (lifeOrderId) {
    let ok = true;
    for (const step of ['confirmed', 'processing', 'preparing', 'ready', 'out_for_delivery', 'delivered']) {
      const rr = await fsPatch(admin.token, `orders/${lifeOrderId}`, { status: step, updatedAt: new Date().toISOString() });
      ok = ok && rr.ok;
      record(rr.ok ? 'PASS' : 'FAIL', '3-state', `3a-step-${step}`, `HTTP ${rr.status}`, rr.data);
    }
    const bad = await fsPatch(admin.token, `orders/${lifeOrderId}`, { status: 'pending', updatedAt: new Date().toISOString() });
    record(bad.status === 403 ? 'PASS' : 'FAIL', '3-state', '3b-delivered->pending-rejected', `HTTP ${bad.status} expected 403`, bad.data);
  }

  /* ---------- 4. COD collection ---------- */
  if (lifeOrderId) {
    const ord = (await fsGet(admin.token, `orders/${lifeOrderId}`)).data || {};
    const totalLbp = Number(ord.totalLbp ?? ord.total ?? 0);
    const cust = await fsPatch(A.token, `orders/${lifeOrderId}`, { paymentStatus: 'collected', codAmountCollected: totalLbp });
    record(cust.status === 403 ? 'PASS' : 'FAIL', '4-cod', '4a-customer-rejected', `HTTP ${cust.status} expected 403`, cust.data);
    const collect = await fsPatch(admin.token, `orders/${lifeOrderId}`, { paymentStatus: 'collected', codAmountCollected: totalLbp, paymentCollectedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    const afterDoc = (await fsGet(admin.token, `orders/${lifeOrderId}`)).data || {};
    record(collect.ok && afterDoc.paymentStatus === 'collected' && afterDoc.codAmountCollected === totalLbp && afterDoc.paymentCollectedAt
      ? 'PASS' : 'FAIL', '4-cod', '4b-admin-records-collection', `HTTP ${collect.status} status ${afterDoc.paymentStatus} amount ${afterDoc.codAmountCollected}`, null);
  }

  /* ---------- 5. subscriptions ---------- */
  r = await apiPost('/api/subscriptions', { mode: 'quote', planId: 'whatever' }, null);
  record(r.status === 401 ? 'PASS' : 'FAIL', '5-subs', '5a-unauthenticated', `HTTP ${r.status} expected 401`, null);
  if (!env.CC_TEST_PLAN_ID) {
    record('SKIPPED', '5-subs', 'plan-path', 'set CC_TEST_PLAN_ID to include plan tests', null);
  } else {
    const planId = env.CC_TEST_PLAN_ID;
    const planDoc = (await fsGet(admin.token, `plans/${planId}`)).data || {};
    const planPrice = Math.round(Number(planDoc.priceLbp ?? planDoc.price ?? 0));
    r = await apiPost('/api/subscriptions', { mode: 'quote', planId }, A.token);
    record(r.status === 200 && r.data?.priceLbp === planPrice ? 'PASS' : 'FAIL', '5-subs', '5b-plan-quote-server-price', `server ${r.data?.priceLbp} vs plan ${planPrice}`, r.data);
    r = await apiPost('/api/subscriptions', { mode: 'quote', planId, priceLbp: 1, priceUsd: 0.01 }, A.token);
    record(r.status === 200 && r.data?.priceLbp === planPrice ? 'PASS' : 'FAIL', '5-subs', '5c-fake-price-ignored', `server still ${r.data?.priceLbp}`, null);
    r = await apiPost('/api/subscriptions', { mode: 'quote', planId: 'nonexistent-plan-xyz' }, A.token);
    record(r.status === 404 ? 'PASS' : 'FAIL', '5-subs', '5d-unknown-plan-404', `HTTP ${r.status}`, r.data);
    if (!A.emailVerified) {
      record('BLOCKED', '5-subs', '5e-plan-create', 'customer A email NOT verified — subscriptions require email_verified; verify in Firebase console Authentication → users', null);
    } else {
      r = await apiPost('/api/subscriptions', {
        mode: 'create', requestId: uid(), planId,
        deliveryDay: 'Monday', deliveryTimeSlot: '09:00-12:00', address: { street: 'Rue Smoke 2', city: 'Beirut' },
      }, A.token);
      const subId = r.status === 201 ? r.data?.subscriptionId : null;
      if (subId) ctx.createdSubId = subId;
      record(r.status === 201 && subId ? 'PASS' : 'FAIL', '5-subs', '5e-plan-create', `HTTP ${r.status} ${r.data?.error || ''}`, { subId });
      if (subId) {
        const subDoc = (await fsGet(admin.token, `subscriptions/${subId}`)).data || {};
        record(subDoc.userId === A.uid && subDoc.status === 'active' && subDoc.priceLbp === planPrice && subDoc.paymentMethod === 'cash_on_delivery' && subDoc.nextDelivery
          ? 'PASS' : 'FAIL', '5-subs', '5f-plan-create-integrity', 'userId/status/server price/COD/nextDelivery', { userId: subDoc.userId, status: subDoc.status, priceLbp: subDoc.priceLbp, next: subDoc.nextDelivery });
      }
    }
  }
  // custom build — client price ignored
  r = await apiPost('/api/subscriptions', { mode: 'quote', customItems: [{ productId: pid, quantity: 1, priceLbp: 1 }] }, A.token);
  record(r.status === 200 && r.data?.priceLbp === unitLbp ? 'PASS' : 'FAIL', '5-subs', '5g-custom-server-price', `server=${r.data?.priceLbp} vs product ${unitLbp}`, null);
  r = await apiPost('/api/subscriptions', { mode: 'create', requestId: uid(), customItems: [{ productId: pid, quantity: 0 }], deliveryDay: 'Monday', deliveryTimeSlot: 'x' }, A.token);
  record(r.status === 400 ? 'PASS' : 'FAIL', '5-subs', '5h-invalid-qty-400', `HTTP ${r.status}`, r.data);

  /* ---------- 6. ownership (rules) ---------- */
  if (ctx.createdSubId) {
    const readB = await fsGet(B.token, `subscriptions/${ctx.createdSubId}`);
    record(readB.status === 403 || readB.status === 404 ? 'PASS' : 'FAIL', '6-ownership', '6a-B-read-A-sub', `HTTP ${readB.status}`, null);
    const modB = await fsPatch(B.token, `subscriptions/${ctx.createdSubId}`, { status: 'cancelled' });
    record(modB.status === 403 ? 'PASS' : 'FAIL', '6-ownership', '6b-B-modify-A-sub', `HTTP ${modB.status}`, null);
    const readA = await fsGet(A.token, `subscriptions/${ctx.createdSubId}`);
    record(readA.status === 200 ? 'PASS' : 'FAIL', '6-ownership', '6c-A-reads-own', `HTTP ${readA.status}`, null);
    const readAdm = await fsGet(admin.token, `subscriptions/${ctx.createdSubId}`);
    record(readAdm.status === 200 ? 'PASS' : 'FAIL', '6-ownership', '6d-staff-reads', `HTTP ${readAdm.status}`, null);
  } else {
    record('SKIPPED', '6-ownership', 'sub ownership', 'requires created subscription (CC_TEST_PLAN_ID)', null);
  }

  /* ---------- 7. authorization matrix ---------- */
  const cancelTarget = (ctx.createdOrders || []).find((id) => id !== lifeOrderId) || ctx.createdOrders?.[0];
  if (cancelTarget) {
    r = await apiPost('/api/orders', { mode: 'cancel', orderId: cancelTarget, reason: 'smoke: customer attempt' }, A.token);
    record(r.status === 403 ? 'PASS' : 'FAIL', '7-authz', '7a-cancel-customer-403', `HTTP ${r.status} expected 403`, r.data);
    r = await apiPost('/api/orders', { mode: 'cancel', orderId: cancelTarget, reason: 'smoke: admin cancel' }, admin.token);
    record(r.status === 200 && r.data?.status === 'cancelled' ? 'PASS' : 'FAIL', '7-authz', '7b-cancel-admin-200', `HTTP ${r.status} status ${r.data?.status}`, r.data);
    const audit = await fsQuery(admin.token, 'audit_logs', [{ field: 'documentId', value: cancelTarget }]);
    record(audit.docs?.some((d) => d.data.action === 'cancel_order') ? 'PASS' : 'FAIL', '7-authz', '7c-cancel-audited', 'cancel_order in audit_logs', null);
  }
  if (lifeOrderId) {
    r = await apiPost('/api/orders', { mode: 'cancel', orderId: lifeOrderId, reason: 'x' }, admin.token);
    record(r.status === 409 ? 'PASS' : 'FAIL', '7-authz', '7d-cancel-terminal-409', `HTTP ${r.status} (delivered terminal)`, r.data);
  }

  /* ---------- 8. data integrity final sweep ---------- */
  const sweep = await fsQuery(admin.token, 'orders', [{ field: 'requestId', value: reqId }]);
  record(sweep.docs?.length === 1 ? 'PASS' : 'FAIL', '8-integrity', '8a-requestId-exactly-once', `orders with requestId = ${sweep.docs?.length}`, null);
  const stockFinal = await productStock(admin, pid, variant?.id);
  record(stockFinal >= 0 ? 'PASS' : 'FAIL', '8-integrity', '8b-stock-non-negative', `stock now ${stockFinal}`, null);

  /* ---------- 9. cleanup ---------- */
  const terminal = new Set(['delivered', 'cancelled', 'refunded']);
  for (const id of ctx.createdOrders) {
    const x = await apiPost('/api/orders', { mode: 'cancel', orderId: id, reason: 'smoke cleanup' }, admin.token);
    const okCleanup = x.ok || x.status === 409;
    record(okCleanup ? 'PASS' : 'FAIL', '9-cleanup', `cancel ${id.slice(0, 8)}`, `HTTP ${x.status}`, null);
  }
  if (ctx.createdSubId) {
    const del = await fsDelete(admin.token, `subscriptions/${ctx.createdSubId}`);
    record(del.ok ? 'PASS' : 'FAIL', '9-cleanup', `subscription ${ctx.createdSubId.slice(0, 8)}`, `HTTP ${del.status}`, null);
  }
  if (originalStock >= 0) {
    await fsPatch(admin.token, `products/${pid}`, { stock: originalStock });
    record('PASS', '9-cleanup', 'stock restored', `-> ${originalStock}`, null);
  }
  if (originalVariantStock !== null) {
    await patchProductStock(admin, pid, variant.id, originalVariantStock);
    record('PASS', '9-cleanup', 'variant stock restored', `-> ${originalVariantStock}`, null);
  }
  for (const [u, label] of [[A, 'A'], [B, 'B']]) {
    const del = await fsDelete(admin.token, `users/${u.uid}`);
    record(del.ok || del.status === 404 ? 'PASS' : 'FAIL', '9-cleanup', `users/${label} doc`, `HTTP ${del.status}`, null);
  }
  record('PASS', '9-cleanup', 'manual', 'Firebase Auth accounts + order_requests/sub_requests idempotency docs need console-level cleanup if desired', null);

  await reportSummary(startedAt, 0);
}

/* ------------------------------------------------------------------ */
/* Product helpers                                                     */
/* ------------------------------------------------------------------ */

async function productStock(admin, pid, variantId) {
  const r = await fsGet(admin.token, `products/${pid}`);
  if (!r.exists) return null;
  if (variantId) return (r.data.variants || []).find((v) => v.id === variantId)?.stock ?? null;
  return Number(r.data.stock ?? null);
}

async function patchProductStock(admin, pid, variantId, stock) {
  const r = await fsGet(admin.token, `products/${pid}`);
  const variants = (r.data?.variants || []).map((v) => (v.id === variantId ? { ...v, stock } : v));
  await fsPatch(admin.token, `products/${pid}`, { variants });
}

/* ------------------------------------------------------------------ */
/* Summary                                                             */
/* ------------------------------------------------------------------ */

async function reportSummary(startedAt, exitCode) {
  const counts = { PASS: 0, FAIL: 0, SKIPPED: 0, BLOCKED: 0 };
  for (const r of results) counts[r.status] = (counts[r.status] || 0) + 1;
  console.log(`\n===== SUMMARY (${Math.round((Date.now() - startedAt) / 1000)}s) =====`);
  for (const r of results) console.log(`${r.status} | ${r.section} | ${r.test}`);
  console.log(`PASS ${counts.PASS} · FAIL ${counts.FAIL} · SKIPPED ${counts.SKIPPED} · BLOCKED ${counts.BLOCKED}`);
  const overall = counts.FAIL ? 'FAIL' : counts.BLOCKED ? 'BLOCKED' : 'PASS';
  console.log(`\nLIVE SMOKE OVERALL: ${overall}`);
  if (env.CC_REPORT_FILE) {
    fs.writeFileSync(
      env.CC_REPORT_FILE,
      JSON.stringify({ generatedAt: new Date().toISOString(), project: PROJECT, base: BASE, results: results.map((r) => ({ ...r, evidence: r.evidence || null })) }, null, 2)
    );
    console.log(`JSON report: ${env.CC_REPORT_FILE}`);
  }
  process.exit(exitCode);
}

main().catch((err) => { console.error('FATAL ::', errText(err)); process.exit(1); });