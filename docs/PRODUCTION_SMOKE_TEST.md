# Production Smoke Test — `scripts/smoke-production.cjs`

Safe, repeatable live verification of **Cloudflare Pages Functions** (`/api/orders`, `/api/subscriptions`) and **Firestore security rules** on the deployed site.

> **Target host (verified Aug 10, 2026):** use `CC_BASE_URL=https://coffeecraze.nilelink.app` — it is the public production host (HTTP 200; serves the repo's `_headers`). The `coffeecraze.pages.dev` host is behind Cloudflare Zero Trust Access (302 → `dggash.cloudflareaccess.com` login) and will block every harness request.

The harness authenticates with **real Firebase ID tokens**, so every Firestore call the script makes is subject to the deployed **security rules** — the script verifies both the API contract and the rules simultaneously.

## Rules of engagement

- **No secrets in output.** Tokens are memory-only; the report redacts `*Token`, `*Key`, `*Secret`, `*Password`, `authorization` fields.
- **No faking evidence.** Every line is either `PASS` (live response verified against DB read-back), `FAIL`, `SKIPPED`, or `BLOCKED` (with reason).
- **Cleanup is automatic** (orders cancelled, subscription deleted, stock restored, user docs removed), but runs are still best done on the staging/current deployment with disposable test data.

## Prerequisites

1. Deployed Pages Functions with the `FIREBASE_SERVICE_ACCOUNT` secret set (the Functions use service-account JWT → OAuth2 for Firestore writes). Verify: `wrangler pages secret list` or the Cloudflare dashboard.
2. Firebase Auth accounts:
   - **Customer A** — must have **email verified** (Firebase console → Authentication → users) or subscription-create tests report `BLOCKED` honestly.
   - **Customer B** — any email/password.
   - **Admin** — must resolve to role `owner`, `super_admin`, or `admin` in the `users/{uid}` doc. If the account doesn't exist yet, run the harness once: it creates accounts and `users` docs automatically (customer `A`/`B` docs self-provision as `role: customer`), then promote the admin doc in the console or via an owner account.
   - New accounts created by the harness are NOT email-verified — verify A's email in the console to unlock plan/ownership tests.
3. A test **product** in Firestore (`CC_TEST_PRODUCT_ID`) with a price; optionally a variant (`CC_TEST_PRODUCT_VARIANT_ID`) to unlock the stock-race test. A test **plan** (`CC_TEST_PLAN_ID`) unlocks subscription plan + ownership tests.
4. A test coupon is auto-created and cleaned up by the harness (`SMOKE10V1`), including usage-limit concurrency testing.

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `CC_BASE_URL` | no | default `https://coffeecraze.nilelink.app` (pages.dev is behind Cloudflare Access) |
| `CC_FIREBASE_API_KEY` | yes | Firebase web API key (for identity toolkit) |
| `CC_PROJECT_ID` | no | default `coffeecraze-f27d3` |
| `CC_CUSTOMER_A_EMAIL` / `CC_CUSTOMER_A_PASSWORD` | yes | verified customer |
| `CC_CUSTOMER_B_EMAIL` / `CC_CUSTOMER_B_PASSWORD` | yes | second customer for ownership tests |
| `CC_ADMIN_EMAIL` / `CC_ADMIN_PASSWORD` | yes | must map to owner/super_admin/admin |
| `CC_TEST_PRODUCT_ID` | yes | product with price (and stock for race tests) |
| `CC_TEST_PRODUCT_VARIANT_ID` | no | unlocks stock-race + variant quote tests |
| `CC_TEST_PLAN_ID` | no | unlocks subscription plan + ownership tests |
| `CC_DELAY_MS` | no | pacing between requests, default 2000 (429 protection) |
| `CC_REPORT_FILE` | no | write JSON report to this path |
| `CC_STAFF_EMAIL` / `CC_STAFF_PASSWORD` | no | optional staff row in ownership tests |

## Run

```powershell
# preflight (no secrets printed, exits non-zero if required vars missing)
$env:CC_FIREBASE_API_KEY=... ; $env:CC_CUSTOMER_A_EMAIL=... ; ...  # set all vars first
node scripts/smoke-production.cjs --envcheck

# full run, saving evidence
node scripts/smoke-production.cjs
```

Example with report output:

```powershell
$env:CC_REPORT_FILE="$env:TEMP\smoke-$(Get-Date -f yyyyMMdd-HHmm).json"
node scripts/smoke-production.cjs
```

The JSON report is the evidence you share back (it contains no tokens). Example summary tail:

```
[PASS] 1-orders :: 1c-create — HTTP 201
...
===== SUMMARY (142s) =====
PASS 31 · FAIL 0 · SKIPPED 2 · BLOCKED 0
LIVE SMOKE OVERALL: PASS
```

## What is covered

1. **Orders**: unauthenticated 401 · server quote math vs DB · create 201 · doc integrity (userId, server prices, snapshot) · client price manipulation ignored · quantity validation (0 / -3 / 2.5 / 1e9 / 'abc' / null) · idempotency (`requestId` replay → 200 same orderId, stock unchanged) · stock race (variant stock=1, two concurrent creates → exactly one 201, stock never negative).
2. **Coupons**: server discount + snapshot · invalid code 404 · expired/inactive 400 · usage-limit concurrency at limit=1.
3. **State machine**: admin step-through pending → delivered; delivered → pending rejected (403 via rules / 409 via API cancel).
4. **COD collection**: customer PATCH rejected 403; admin records payment + `codAmountCollected` + `paymentCollectedAt`.
5. **Subscriptions**: unauthenticated 401 · plan quote = server DB price · fake client price ignored · unknown plan 404 · plan create 201 + integrity · custom-quote server price · invalid quantity 400.
6. **Ownership**: B cannot read/modify A's subscription (403/404); A can read own; staff can read.
7. **Authorization**: customer cancel → 403; admin cancel → 200 + `audit_logs.cancel_order`; cancel on terminal state → 409.
8. **Integrity sweep**: `requestId` exactly-once; stock never negative.
9. **Cleanup**: cancel created orders, remove subscription, restore stock/variant, delete user docs.

## Troubleshooting

- `429` responses → increase `CC_DELAY_MS`; the harness self-paces at 30 req/min by default.
- Subscription creates return `BLOCKED — email NOT verified` → verify A in Firebase console.
- `BLOCKED — admin role` → promote the admin `users/{uid}` doc.
- If identitytoolkit errors with `API key not valid`, re-check `CC_FIREBASE_API_KEY`.

## Security

- Script never prints or writes ID tokens, OAuth tokens, or passwords.
- `.gitignore` excludes `.env*` and `*.smoke-report.json` — never commit env files or reports with credentials.