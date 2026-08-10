# PHASE 1 — MONEY INTEGRITY REPORT

> Status: **NO-GO for live attestation until: (a) smoke credentials supplied, (b) valid Gemini key, (c) redeploy. All code/config gates PASS; local Pages-emulator verification completed (SPA fix proven, function contracts proven, rate limiter proven).**
> Updated: August 10, 2026

---

## Executive status

| Area | Status |
|---|---|
| Automated unit/component tests | **PASS** — 121/121 (vitest, 9 files) |
| TypeScript check | **PASS** — `npx tsc --noEmit` clean, 0 errors |
| ESLint | **PASS** — 0 errors, 3 pre-existing `no-explicit-any` warnings (server.ts/notification.ts, non-money surface) |
| Production build | **PASS** — `vite build` succeeded (`dist/` generated) |
| Firestore rules review | **PASS** — F1/F2/F3 resolved with regression tests (below) |
| Storage rules review | **PASS** — writes staff/admin/owner-only, image validated |
| Env preflight | **BLOCKED** — 12/12 `CC_*` variables missing (names below) |
| Live production smoke test | **BLOCKED** — cannot run without credentials/test accounts (external prerequisite) |
| Live security headers (nilelink.app) | **PASS** — CSP/HPKP/HSTS/XFO/nosniff/permissions-policy/referrer-policy served per `public/_headers` |
| Deep-link/SPA routing (nilelink.app) | **FAIL → FIXED in repo** — all non-`/` routes returned network 404 (no SPA fallback); fixed via `not_found_handling = "single-page-application"` (wrangler.toml) — **pending redeploy** |
| CSP vs app images (nilelink.app) | **FAIL → FIXED in repo** — `img-src` omitted `images.unsplash.com` → every hero/blog/product image blocked (console CSP violations at all viewports); `https://images.unsplash.com https://www.google.com` added to `img-src` in `public/_headers` — **pending redeploy** |
| Deployed Pages Functions (nilelink.app) | **FAIL (deployment)** — `POST /api/orders` and `POST /api/subscriptions` return **405 Method Not Allowed** → production money endpoints are stale/absent → redeploy required |
| Production AI chat (nilelink.app) | **FAIL** — `POST /api/ai/chat` returns canned fallback only (math probe answered with generic help text, not the math result) → `GEMINI_API_KEY` not wired in the deployed env → Step 11 = FAILED |
| Canonical production host | `https://coffeecraze.pages.dev/` is behind Cloudflare Zero Trust Access (302 → `dggash.cloudflareaccess.com` login); the public host is `https://coffeecraze.nilelink.app/` (200, real headers) → harness default `CC_BASE_URL` must point at `nilelink.app` |

### Missing environment variables (names only, values never displayed)

`CC_FIREBASE_API_KEY` · `CC_CUSTOMER_A_EMAIL` · `CC_CUSTOMER_A_PASSWORD` · `CC_CUSTOMER_B_EMAIL` · `CC_CUSTOMER_B_PASSWORD` · `CC_ADMIN_EMAIL` · `CC_ADMIN_PASSWORD` · `CC_TEST_PRODUCT_ID` · `CC_TEST_PRODUCT_VARIANT_ID` · `CC_TEST_PLAN_ID` · `CC_BASE_URL` · `CC_REPORT_FILE`

Checked: process env, user env, machine env. Local `.env` contains only `VITE_*`/`GEMINI_API_KEY` keys — no `CC_*` values. Run `node scripts/smoke-production.cjs --envcheck` after setting them.

---

## Automated tests (unit level)

`npx vitest run` — **8 files, 95 tests, all passing**:

| Suite | Tests |
|---|---|
| `functions/lib/stateMachine.test.ts` | 16 |
| `functions/lib/coupons.test.ts` | 8 |
| `functions/lib/orderEngine.test.ts` | 21 |
| `functions/lib/money.test.ts` | 11 |
| `src/test/utils/exchange.test.ts` | 11 |
| `src/test/utils/utils.test.ts` | 19 |
| `src/test/services/firestore.test.ts` | 6 |
| `src/test/smoke/components.test.tsx` | 3 |

## Defect found and fixed during inspection

**Coupon usage-limit race (real defect).** In `functions/api/orders.ts` the coupon redemption write (incrementing `usedCount`) was NOT protected by an optimistic-concurrency precondition. Two concurrent order creations with the same coupon could both pass the `usedCount < usageLimit` read and both increment, overshooting the limit.

- **Fix:** when a coupon validates, the coupon doc's `updateTime` is now added to the atomic `commitWrites` precondition set (`readVersions`), so any concurrent redemption aborts the transaction and the second request re-evaluates against the new count.
- Verified by unit tests (`coupons.test.ts`, `orderEngine.test.ts`).

## Live production smoke test

Harness: `scripts/smoke-production.cjs` (docs: `docs/PRODUCTION_SMOKE_TEST.md`).

**Status: BLOCKED — no credentials supplied.** Verified by `--envcheck`: all 12 required variables absent at process/user/machine scope; `.env` has no `CC_*` keys. The harness refuses to run without `CC_FIREBASE_API_KEY`, reports `BLOCKED` honestly for every step it cannot execute, and never prints or writes tokens. Dry-run with a fake key verified the safe BLOCKED path (identity failures recorded, no data touched, exit code 1).

When credentials/accounts/data are supplied and the run completes, this table is updated with real results (no fabricated evidence):

| Section | Coverage | Status |
|---|---|---|
| 1-orders | unauthenticated 401; quote math vs DB; create 201; doc integrity; client-price-ignored; qty validation (0/-3/2.5/1e9/abc/null); idempotency replay; stock race | **BLOCKED** — credentials |
| 2-coupons | server discount + snapshot; invalid 404; expired/inactive 400; usage-limit concurrency (limit=1) | **BLOCKED** — credentials |
| 3-state | admin pending→delivered step-through; delivered→pending rejected | **BLOCKED** — credentials |
| 4-cod | customer collection PATCH 403; admin collection + codAmountCollected + paymentCollectedAt | **BLOCKED** — credentials |
| 5-subs | 401; plan quote server price; fake price ignored; 404 unknown plan; create + integrity; custom quote; qty 0→400 | **BLOCKED** — credentials |
| 6-ownership | B read/modify A sub 403/404; A reads own; staff reads | **BLOCKED** — credentials |
| 7-authz | customer cancel 403; admin cancel 200 + audit_logs; terminal cancel 409 | **BLOCKED** — credentials |
| 8-integrity | requestId exactly-once; stock non-negative | **BLOCKED** — credentials |
| 9-cleanup | created orders cancelled; sub deleted; stock restored; user docs removed | **BLOCKED** — credentials |

**To run:** follow `docs/PRODUCTION_SMOKE_TEST.md` — set the `CC_*` env vars, preflight with `node scripts/smoke-production.cjs --envcheck`, then `node scripts/smoke-production.cjs`, capture the JSON report via `CC_REPORT_FILE` and return it.

## Security rules re-verification (Step 13 — static review)

### `firestore.rules` — PASS with 2 findings

- Global deny baseline; explicit allows only. **PASS**
- Orders: client `create: if false`, `delete: if false`; reads owner/staff/assigned-driver only. **PASS**
- Order updates: bounded keys; `status` must pass `isValidOrderTransition` (mirrors `functions/lib/stateMachine.ts`); payment fields + `codAmountCollected` gated to `isAdminOrAccounting`; `driverId` gated to `isAdmin`. **PASS**
- Payments, paymentLedgers, order_requests, sub_requests: `create: if false` — server-minted only. **PASS**
- Coupons: customer reads only; all writes staff-only (client cannot modify discounts/limits/usedCount). **PASS**
- Subscriptions: client `create: if false`; updates bounded + transition-validated; payment gating `isAdminOrAccounting`; owner self-serve limited to logistics/status subset. **PASS**
- Users: self-provision `role == 'customer'` only (no self-promotion); role/permissions/status immutable for owner updates (rules reject any owner attempt to change them). **PASS**
- Audit logs: create staff, read admin, update/delete denied. **PASS**
- Inventory protection: `products` writes staff-only. **PASS** (server enforces non-negative stock via transaction; rules leave stock as server/staff domain)
- **Finding F1 (MEDIUM) → RESOLVED:** blanket `isStaff()` order-status authority replaced by a least-privilege matrix. Single source of truth `functions/lib/stateMachine.ts` (`canOrderTransitionByRole`, `canRecordPayment`, `canAssignDriver`), mirrored in `firestore.rules` (`isOrderOpsTop` / `isOrderSupport` / `isFulfillmentWorker` / `isOrderTransitionAuthorized`):
  - `super_admin`/`owner`/`admin`/`manager` → all valid transitions
  - `customer_service`/`support` → all non-financial transitions, never final `delivered`
  - `inventory`/`warehouse`/`barista`/`supplier_manager` → staging only (`processing…out_for_delivery`); never confirm/cancel/deliver
  - `accounting` → payment/COD operations only, zero status authority
  - `product_manager`/`marketing`/`analyst`/`wholesale_manager` → no order-status authority
  - `customer`/`driver` → no staff path (driver has its own gate)
  - Regression tests: `functions/lib/stateMachine.test.ts` (role matrix, 12 new tests)
- **Finding F2 (MEDIUM) → RESOLVED:** `isDriverOrderUpdate` now requires `existing().status == 'out_for_delivery'` before a driver may mark delivered / record COD; enforced in rules (backend), not frontend. TS mirror `canDriverDeliver`. Regression tests: denied from pending/confirmed/processing/preparing/ready/shipped/delivered/cancelled, allowed only from out_for_delivery.
- **Finding F3 (LOW) → RESOLVED:** `loyaltyPoints` and `totalSpent` removed from the owner-profile update whitelist (`isOwnerProfileUpdate`) — business/accounting values are now server-computed only. Client audit confirmed no flow writes them after creation. Regression tests: `functions/lib/securityRules.test.ts` (14 tests) assert rules invariants for F1/F2/F3, client-create denials, storage gates.

### Security rules guard tests (new)

`functions/lib/securityRules.test.ts` — text-level invariants on the DEPLOYED `firestore.rules`/`storage.rules`: F3 keys absent from owner whitelist, role/permission immutability, driver `out_for_delivery` gate + honest-amount check, staff matrix role lists mirroring stateMachine, payment/COD/driverId gating, client create/delete denials for orders/payments/subscriptions/coupons, user self-provision role `customer` only, storage default read-only + owner/staff/admin write gates.

### `storage.rules` — PASS

- Global `write: if false`; reads public for shop assets, owner-only for `uploads/`; writes: products/plans/cms/blog/etc. staff-only, `site/` admin-only, profiles/avatars owner-only; all writes size + image-type validated. No money surface. **PASS**

## Live production evidence (network probes + browser sweep)

**Hosts:** `https://coffeecraze.pages.dev/` → HTTP 302 to Cloudflare Access login (`dggash.cloudflareaccess.com`, `Www-Authenticate: Cloudflare-Access`, `CF_AppSession`) — Zero Trust–walled, not a public target. `https://coffeecraze.nilelink.app/` → HTTP 200 and serves this repo's exact `public/_headers` payload (verified header-by-header: CSP, `permissions-policy: camera=(), microphone=(), geolocation=(self), interest-cohort=()`, `referrer-policy: strict-origin-when-cross-origin`, `x-content-type-options: nosniff`, `x-frame-options: DENY`, HSTS 1y).

**Findings (all live-proven, none theoretical):**

1. **SPA fallback missing (MEDIUM):** `GET /shop`, `/cart`, `/checkout`, `/subscriptions`, `/auth`, `/contact`, `/blog`, `/about`, `/dashboard`, `/product/*` all return **network 404** on nilelink.app (no `not_found_handling` configured at deploy time). App still rendered via client-side nav, but deep links / refresh-on-route / crawlers hit 404. **Fix applied:** `not_found_handling = "single-page-application"` in `wrangler.toml`; verified present in `dist/` after build. **Pending redeploy.**
2. **CSP blocks app images (MEDIUM):** deployed `img-src` lacks `https://images.unsplash.com` → browser console CSP violation for every Unsplash image (hero, category cards, products, about, blog); images never load. Source `grep` confirms the app only uses `images.unsplash.com` (13 refs). **Fix applied:** added `https://images.unsplash.com https://www.google.com` (Google sign-in `cleardot.gif`) to `public/_headers` `img-src`; verified in `dist/_headers` after build. **Pending redeploy.**
3. **Deployed Functions stale (HIGH, deployment):** `POST /api/orders` → **405**, `POST /api/subscriptions` → **405** on nilelink.app (only `OPTIONS /api/ai/chat` → 204 exists). The money-critical Functions this repo ships are not (or no longer) deployed on the public domain → live money flows (harness 1–9) cannot run there. **Action:** redeploy `functions/*` before smoke.
4. **Production AI = canned fallback only (HIGH):** `POST /api/ai/chat` `{"message":"Who are you?"}` → 200 with canned Concierge text; `{"message":"What is 47 times 13? Reply with only the number."}` → generic help reply (not `611`); follow-up probe → canned shipping text. Matches `functions/api/ai/chat.ts` fallback library; `env.GEMINI_API_KEY || env.GEMINI_API_KEY_PROD || env.GEMINI_APIKEY` is absent in the deployed env. Step 11 (AI) = **FAILED**. **Action:** set the Gemini key secret and redeploy (verify with `wrangler pages secret list`), then re-probe.
5. **Responsive sweep:** 7 viewports (360×800 … 1440×900) × 10 routes + first product: no horizontal overflow, no blank pages, 0 uncaught exceptions, correct titles at ≤1024px, product page renders live data. Sporadic "Could not reach Cloud Firestore backend" console errors only at 1280/1440 (transient network in the probing sandbox — inconclusive, needs re-check post-credential smoke). Cleanup: no test orders/products/users created.

## Local Pages-emulator verification (final, pre-deploy)

Ran `wrangler pages dev` (wrangler 4.100.0, config from `wrangler.toml` + `.env`) against the built `dist/` — the exact artifact the deploy will serve, including `functions/*`, `_headers`, and serving behavior. Evidence:

| Test | Result |
|---|---|
| `GET /` and **every deep link** (`/shop`, `/cart`, `/checkout`, `/subscriptions`, `/auth`, `/contact`, `/blog`, `/about`, `/dashboard`, `/product/coffee-beans`, unknown path) | **200** — SPA fallback works. Root cause of the production 404s: repo shipped `public/404.html` (an old sessionStorage-redirect hack) which **disables Pages' SPA mode by default**, plus a `public/_redirects` (`/* /index.html 200`) that the platform rejects as an infinite loop (Wrangler + API error code 10021/100324). Both removed → Pages default SPA serving restored. |
| `POST /api/orders` (no token / garbage token) | 401 `{"error":"Authentication required"}` / 401 `{"error":"Invalid session: Malformed ID token"}` — no raw error leakage |
| `POST /api/subscriptions` (no token) | 401 `{"error":"Authentication required"}` |
| `GET /api/orders` / `OPTIONS /api/orders` | 405 (method routing) / 204 preflight, `Access-Control-Allow-Origin: *`, methods `POST, OPTIONS`, headers `Content-Type, Authorization`, `max-age 86400` |
| `POST /api/ai/chat` (empty body) | 400 `{"error":"message is required"}` |
| AI rate limiter (20/60s) | **PASS** — 429 at request 20: `{"error":"Rate limit exceeded. Retry after 51s."}` |
| AI real-key path | Code executes Gemini fetch correctly (Google AI API reachable; observed `Gemini 429` from Google for the key in local `.env` — that key is not a valid Gemini key (starts `AQ.A`, real keys start `AIza`)) → graceful canned fallback. **Gemini behavior cannot be certified until a valid `AIza...` key is set.** |
| CSP `img-src` | **PASS** — updated CSP served; Playwright sweep: **0 CSP violations** (previously dozens blocking Unsplash images) |
| Responsive sweep (7 viewports × 11 routes, local) | **77/77 ok, 0 horizontal overflow, 0 page errors, 0 HTTP ≥400**; product page renders (Vanilla Syrup); 1 transient Firestore `unavailable` console note (sandbox network) |

**Also fixed:** `eslint.config.js` now ignores `.wrangler` (wrangler's local state was being linted → 765 false errors); `.gitignore` covers `.dev.vars`, `.wrangler`.

## End-to-end claims that still require live attestation

1. Pages Function `POST /api/orders` + `/api/subscriptions` behave per contract on the deployed site (the exact code this repo ships).
2. `FIREBASE_SERVICE_ACCOUNT` secret is correctly wired at deployment (Functions write via service-account JWT → OAuth2).
3. Firestore security rules (payment/order state transitions, ownership, staff/admin gates) hold against real user tokens.
4. The coupon usage-limit fix holds under actual concurrent requests.
5. Stock never goes negative under a real concurrent create race.
6. AI chat returns real Gemini answers (post-key wiring); rate-limit 429 shape verified.
7. SPA fallback (deep links 200) and CSP image loading verified post-redeploy.

None of the above are claimed as PASS until executed against the live environment.

## Test matrix — Step 3/6-12 (live, across the board)

Every Step 6-12 item (order price/qty/total manipulation, stock race, coupon integrity incl. concurrency, state transitions, COD collection, subscriptions, authz attacks) is implemented **as an automated live test in section 1-9 of the harness** listed above. None can be executed without the missing `CC_*` credentials; per the rules of engagement, no such item is marked PASS on the strength of unit tests alone.

## Final decision (Step 15)

### Production Verification

| Area | Result |
|---|---|
| Build | PASS — `vite build` succeeded (dist carries fixes) |
| TypeScript | PASS — 0 errors |
| ESLint | PASS — 0 errors (3 warnings, pre-existing `any` in `server.ts`/`notification.ts`) |
| Unit tests | PASS — 121/121 (was 95; +12 role-matrix, +14 rules-guard tests) |
| Production smoke tests | **BLOCKED** — credentials not supplied (12 vars missing) |
| Order integrity | NOT VERIFIED live (harness 1; functions 405 on prod until redeploy) |
| Stock integrity | NOT VERIFIED live (harness 1h) |
| Coupon integrity | NOT VERIFIED live (harness 2; unit 8/8) |
| COD integrity | NOT VERIFIED live (harness 4; rules reviewed) |
| Subscription integrity | NOT VERIFIED live (harness 5; functions 405 on prod until redeploy) |
| Authorization | NOT VERIFIED live (harness 6-7; unit matrix 12/12, rules guarded) |
| Firestore security | REVIEWED PASS — F1/F2/F3 RESOLVED, 14 guard tests |
| Storage security | REVIEWED PASS |
| Live security headers | PASS — nilelink.app serves repo `_headers` exactly |
| SPA deep links | FAIL (404) → FIXED in repo (`not_found_handling`), pending redeploy |
| CSP vs images | FAIL (Unsplash blocked) → FIXED in repo (`img-src`), pending redeploy |
| Deployed Functions | **FAIL (deployment)** — `/api/orders` + `/api/subscriptions` 405 on nilelink.app |
| Production AI chat | **FAIL** — canned fallback only (Gemini key not wired), Step 11 FAILED |
| Responsive layout | PASS (all viewports, no overflow/blank page); Firestore flake @1280/1440 inconclusive |

### Remaining Blockers

| Blocker | Class |
|---|---|
| `CC_*` env vars not supplied locally (12 vars, incl. 2 customer + 1 admin test accounts and a test product) | EXTERNAL / USER ACTION |
| Valid Gemini API key (`AIza...`) — repo `.env` key is not valid (`AQ.A…`, Google responds 429) | USER ACTION (secret setup) |
| Production redeploy (carries SPA fix, CSP fix, current Functions; today prod serves none of them) | USER ACTION (deployment) |
| 3 warnings (`no-explicit-any` in `server.ts`/`notification.ts`) | LOW (cosmetic) |

### Launch Recommendation

**NO-GO-to-live-attestation; READY-TO-DEPLOY.** Every code- and config-level defect found across all phases is fixed and verified locally against the emulator (SPA deep links 200, CSP clean, function contracts 401/400/405/429 correct, 121/121 tests, tsc/eslint clean, build PASS). What remains is exclusively operational: supply the 12 `CC_*` creds, set a valid `GEMINI_API_KEY`, redeploy via `npm run pages:deploy`, then run the harness (`CC_BASE_URL=https://coffeecraze.nilelink.app`) and re-probe AI. GO after the smoke report says `LIVE SMOKE OVERALL: PASS` and the AI math probe returns `611`.