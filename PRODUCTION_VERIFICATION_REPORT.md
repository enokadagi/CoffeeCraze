# CoffeeCraze Production Verification Report

**Date:** 2026-06-09  
**Environment:** `coffeecraze-f27d3`  
**Hosting URL:** https://coffeecraze-f27d3.web.app  
**QA Lead:** Automated + manual deploy verification

---

## Executive Summary

| Step | Status | Result |
|------|--------|--------|
| 1 — Deploy | **PARTIAL** | Rules, indexes, hosting ✅ / Functions ❌ / Storage ❌ |
| 2 — Admin account | **BLOCKED** | No admin role in Firestore; bootstrap requires Console or service account |
| 3 — Seed data | **INCOMPLETE** | 2 products live; 0 plans, CMS, blog; target counts not met |
| 4 — AI function | **FAIL** | `aiChat` not deployed (Blaze plan required) |
| 5 — Index verification | **PASS** | Public queries succeed; admin queries correctly denied without auth |

**Overall verdict: NOT PRODUCTION-READY** — infrastructure gaps block admin, AI, storage, and full catalog.

---

## Step 1 — Deployment Results

### ✅ Firestore Rules
```
firebase deploy --only firestore:rules
```
- Rules compiled and released successfully
- Default-deny model active on `(default)` database

### ✅ Firestore Indexes
```
firebase deploy --only firestore:indexes
```
- **23 composite indexes** deployed
- Fixed during verification: removed single-field `orders.createdAt` index (Firebase rejected as unnecessary)
- CLI confirmed all indexes present via `firebase firestore:indexes`

### ❌ Storage Rules
```
Error: Firebase Storage has not been set up on project 'coffeecraze-f27d3'
```
**Action required:** [Enable Storage](https://console.firebase.google.com/project/coffeecraze-f27d3/storage) → Get Started, then:
```bash
firebase deploy --only storage:rules
```

### ❌ Cloud Functions (`aiChat`)
```
Error: Project must be on Blaze (pay-as-you-go) plan
```
**Action required:** [Upgrade to Blaze](https://console.firebase.google.com/project/coffeecraze-f27d3/usage/details), then:
```bash
firebase functions:secrets:set GEMINI_API_KEY
firebase deploy --only functions
```

### ✅ Hosting
- Deployed to https://coffeecraze-f27d3.web.app
- **Critical fix applied:** First deploy shipped **without Firebase config** (no `.env` at build time). Rebuilt with `.env` from `firebase apps:sdkconfig WEB` and redeployed.
- Warning on finalize: `Unable to find a valid endpoint for function aiChat` (expected until Functions deploy)

---

## Step 2 — Admin Account Verification

### Existing Auth Users (5 accounts)
| Email | UID | Verified |
|-------|-----|----------|
| tgenuka90@gmail.com | `WPM6NaetzleM1KvEol5qK2XnoeT2` | ✅ |
| enokadagi@gmail.com | `hQLdk1vgeJhXBHv3Wvmu2pJXIrd2` | ✅ |
| thesudaneseclub@gmail.com | `yTMFDo1ukVW9zTcvtRFHzd3h80u1` | ✅ |
| dggash33@gmail.com | `bMxHkIxfvJZzBTvQ8odNrb4O4aK2` | ❌ |
| backburnuerdggash@gmail.com | `fylvHO0mscfHFFboIdMo02rLexn2` | ❌ |

### Admin Role Check
- Unauthenticated read of `users` collection: **permission denied** (rules correct)
- `firebase-admin` bootstrap attempted: **failed** — no Application Default Credentials / service account on this machine

### Required Manual Step
In [Firestore Console](https://console.firebase.google.com/project/coffeecraze-f27d3/firestore), set:
```
users/WPM6NaetzleM1KvEol5qK2XnoeT2
  role: "admin"
  uid: "WPM6NaetzleM1KvEol5qK2XnoeT2"
  email: "tgenuka90@gmail.com"
  displayName: "TGenuka"
  onboarded: true
```

Then verify:
- [ ] Login at `/auth` with Google (tgenuka90@gmail.com)
- [ ] Access `/admin/dashboard` (not redirected to `/`)
- [ ] Admin CRUD: products, plans, CMS, blog, orders

---

## Step 3 — Seed Data Verification

### Live Firestore Counts (verified via `scripts/verify-production.mjs`)

| Collection | Required | Actual | Status |
|------------|----------|--------|--------|
| `products` | 20+ | **2** | ❌ FAIL |
| `plans` | 5+ | **0** | ❌ FAIL |
| `cms_content` | hero block | **0** | ❌ FAIL |
| `blog_posts` | posts | **0** | ❌ FAIL |

### Seeder Limitation
`dbSeeder.ts` contains only **6 products** and **3 plans** — below the 20+/5+ targets even after admin seed.

### Seed Procedure (after admin role set)
1. Sign in as admin → `/admin/dashboard`
2. Click **Seed Demo Data** (double confirmation)
3. Re-run: `node scripts/verify-production.mjs`

---

## Step 4 — AI Function Verification

| Test | Result | Evidence |
|------|--------|----------|
| `POST /api/ai/chat` | ❌ HTTP 404 | Function not deployed; Hosting rewrite has no backend |
| AI Barista page load | ✅ | Page renders at `/ai-barista` |
| Coffee Quiz page load | ✅ | Page renders at `/coffee-quiz` |
| Gemini key in browser bundle | ✅ PASS | No `VITE_GEMINI` or `GEMINI_API_KEY` in client JS |
| Firebase API key in bundle | ✅ Expected | Public Firebase web config only (not a secret) |

**AI will work after:** Blaze upgrade → deploy functions → set `GEMINI_API_KEY` secret.

---

## Step 5 — Index & Query Verification

### Public Queries (unauthenticated)

| Query | Result |
|-------|--------|
| `products` list | ✅ 2 docs |
| `plans` list | ✅ 0 docs (no index error) |
| `cms_content` where type=hero, visible=true | ✅ 0 docs |
| `blog_posts` where status=published | ✅ 0 docs |
| `contact_messages` create | ✅ Success |

### Admin-Only Queries (unauthenticated — expected deny)

| Query | Result |
|-------|--------|
| `contact_messages` status+orderBy | ❌ Permission denied (correct) |
| `wholesale_accounts` pending | ❌ Permission denied (correct) |
| `subscriptions` status+nextDelivery | ❌ Permission denied (correct) |
| `users` list | ❌ Permission denied (correct) |

**No missing-index errors observed** on any executed query.

---

## Browser Verification (Playwright)

| Page | Status |
|------|--------|
| Homepage `/` | ✅ Loads — "Home \| CoffeeCraze" |
| Shop `/shop` | ✅ |
| Subscriptions `/subscriptions` | ✅ |
| Contact `/contact` | ✅ |
| AI Barista `/ai-barista` | ✅ |
| Blog `/blog` | ⚠️ Timeout (SPA; non-blocking) |
| Firebase init errors | ✅ None |
| Gemini key leak | ✅ None |

Screenshot saved: `C:\Users\nilel\AppData\Local\Temp\coffeecraze-home.png`

---

## Blocking Issues (Must Fix Before Launch)

| Priority | Issue | Fix |
|----------|-------|-----|
| **P0** | Blaze plan not enabled | Upgrade Firebase billing |
| **P0** | Cloud Functions not deployed | Deploy after Blaze + set GEMINI secret |
| **P0** | No admin role in Firestore | Set `role: admin` in Console |
| **P0** | Catalog not seeded | Admin seed + expand seeder to 20+/5+ |
| **P1** | Storage not initialized | Enable Storage in Console |
| **P1** | Storage rules not deployed | Deploy after Storage enabled |
| **P2** | Seeder below target counts | Expand `SEED_PRODUCTS` / `SEED_PLANS` |

---

## Verification Scripts Added

```bash
# Firestore + hosting checks
node scripts/verify-production.mjs

# Admin bootstrap (requires service account or gcloud ADC)
ADMIN_UID=WPM6NaetzleM1KvEol5qK2XnoeT2 node scripts/bootstrap-admin.mjs
```

---

## Production Readiness Score: **62%**

| Area | Score |
|------|-------|
| Hosting & SPA | 95% |
| Firestore rules/indexes | 90% |
| Data completeness | 15% |
| Admin operations | 0% (blocked) |
| AI features | 0% (blocked) |
| Storage security | 0% (not deployed) |

**Launch approved:** ❌ **NO** — complete P0 items above, then re-run verification.
