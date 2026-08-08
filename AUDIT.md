# CoffeeCraze — Master Product, UX, UI, Architecture & Customer Experience Audit

**Date:** August 2026
**Scope:** Full codebase, data model, security rules, deployed behaviors
**Method:** Static code audit + security-rule analysis + customer-journey walkthrough (4 deep passes)
**Status:** Audit only — no code modified

---

## A. Executive Summary

CoffeeCraze is a Lebanese coffee e-commerce platform (React 19 + Vite + Firebase + Tailwind v4 + Cloudflare Pages) with an ambitious product vision: curated coffee rituals, subscriptions, an AI Barista, a coffee quiz, wholesale, loyalty, referrals, a driver dispatch app, and a full admin suite. The **visual design is genuinely good** — the espresso/caramel/cream palette, motion language, and typography create a premium brand feel that punches above a typical MVP.

**The honest verdict:** The app is a **design-forward, technically-functional but operationally-incomplete platform**. It looks like a polished product and falls apart where money changes hands. The critical problems are not visual — they are:

1. **The revenue pipeline is client-trusted.** Order totals, prices, stock, coupon discounts, and even "payment status paid" can be manipulated by any user. There is no server-side price verification anywhere.
2. **Payments don't exist.** The checkout offers "Pay Now −10%", "Monthly Payment", and "Deferred" options — but every order is created as Cash-On-Delivery `pending`. The discounts are real (total is reduced) but no payment is ever collected or recorded.
3. **Coupons are broken end-to-end.** The seeder writes `isActive` but the Cart queries `active`; customers are denied by security rules when incrementing usage. Applying a coupon fails silently, and even a working coupon would be **lost between Cart and Checkout** — the discount never reaches the order.
4. **Subscriptions are fiction.** Subscriptions are created `active` with no payment, no billing schedule, and no automation. The "preferred delivery day" is computed as *today's weekday name*. No address is collected.
5. **Stock is never decremented.** Orders don't reduce inventory; the entire inventory system is a display feature.
6. **The referral program is 100% decorative.** The share link is copied but the `ref` parameter is never read anywhere; the 200-points-per-referral promise is never implemented.
7. **Granular permissions are decorative.** Roles restrict *navigation*, but the 8 permission strings assigned to employees are never checked anywhere.
8. **A destructive `reseedAll()` button is shipped in the admin bundle** — despite a comment in the codebase stating client-side seeding is a security risk.
9. **The AI Barista loops** — a `useEffect` with no dependency array re-fetches the entire catalog, cart, orders, and profile on **every render** (infinite Firestore read churn).
10. **Fabricated social proof.** "10,000+ Orders", "4.9/5", fake Unsplash avatars, "ESTABLISHED BEIRUT 1994" — claims that are demonstrably false and legally risky.

**The single most important takeaway:** CoffeeCraze must decide whether it is a **marketing experience** (current state — beautiful, untrustworthy) or a **coffee company** (needs a server-side order pipeline, real payment capture, inventory truth, and honest marketing). Everything in the roadmap below serves that decision.

---

## B. Current Product Architecture

### Stack
| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6, React Router 7, Tailwind CSS v4 (hybrid v3 config), motion v12 |
| Backend | Firebase (Auth, Firestore, Storage) + Cloudflare Pages Functions (AI) + Express dev server |
| AI | Gemini via raw fetch (Cloudflare Function `functions/api/ai/chat.ts` + `catalog.ts`), client-side `gemini.ts` |
| Analytics | recharts |
| Other | Leaflet (GPS picker), sonner toasts, xlsx (admin export), canvas-confetti |

### Architecture pattern
- **Single-page React app**, lazy-loaded routes, code-split chunks (~530 kB gzip total).
- **Direct-to-Firestore client writes** for nearly everything (orders, subscriptions, reviews, messages, payments, wishlist, carts). There is **no server-side application layer for commerce** — no order validation, no price lookup, no stock transaction, no billing.
- Two server artifacts: an Express dev server (`server.ts`) and Cloudflare Pages Functions (production AI endpoint only). A dormant `firebase-functions/` duplicate of `aiChat` exists but is **not** the production target.
- Cloud Functions are NOT deployed; `firebase.json` functions source is the unhardened duplicate.

### Data model (Firestore collections)
users, products, plans, cms_content, blog_posts, faqs, contact_messages, reviews, wishlist, orders, subscriptions, deliveries, payments, paymentLedgers, site_settings, carts, audit_logs, wholesale_accounts, offers, coupons, employee_invites, employees — **22 collections**, only ~12 typed in `src/types/index.ts`. `inventory_logs` has a type but **no security rule** (global deny).

### Strongest value proposition implemented today
**"Ritual" positioning + subscription plans + AI recommendations.** The brand language (rituals, curated, premium) is coherent and differentiated; the AI Barista + Coffee Quiz + Custom Plan Builder trio is genuinely forward-thinking — no local competitor has it.

### What's missing from the value proposition
Everything that makes a promise *true*: honest pricing, real payment, real delivery scheduling, real inventory, real rewards, real social proof, real reviews, real support responses. The product sells trust — but trust infrastructure is the weakest layer.

---

## C. Complete Page Inventory (43 routes)

### Public storefront
| Route | Purpose | Health |
|---|---|---|
| `/` Home | Hero (CMS), sourcing stats, subscriptions band, collections, AI teaser | ⚠️ static fabricated stats; no featured products; mesh-gradient positioned wrong (Home.tsx:121) |
| `/shop` Shop | Grid + category filter + price slider + rating + search | ⚠️ **no sort**; tag filter dead; minPrice dead; no isActive filter |
| `/category/:category` | Category landing | ⚠️ no sort/count/breadcrumb |
| `/product/:id` ProductDetail | Gallery, variants, reviews, related | 🔴 **stale variant bug** across product→product nav (ProductDetail.tsx:33-37); fullDescription never rendered; no breadcrumbs |
| `/cart` Cart | Items, coupon, totals | 🔴 **coupon lost at checkout**; negative total possible; coupon increment denied by rules |
| `/checkout` Checkout | 4-step wizard, GPS, payment options | 🔴 **fictional payment options**; duration discount applies to all carts; variant dropped from order items |
| `/order-success/:id` | Confetti + order id | ⚠️ no data fetch; renders "Order #undefined" |
| `/subscriptions` | Plan cards + modal | 🔴 preferredDay = today's weekday; no address; fake avatars |
| `/custom-plan-builder` | 4-step builder | 🔴 hardcoded Friday/Morning delivery; discount display math bug; no shipping in total |
| `/subscription/confirmation` | Static | ⚠️ double-space grammar; no real info |
| `/wishlist` | Saved products | ⚠️ silent truncation at 30 |
| `/coffee-quiz` | 3-question quiz | ⚠️ RITUAL15 code decorative; result not saved; links to whole shop |
| `/ai-barista` | Chat | 🔴 **infinite re-fetch loop** (no deps array, AiBarista.tsx:36-81) |
| `/wholesale` | Inquiry form | ⚠️ guests can't submit, not told why; no phone field; server route dead |
| `/contact` | Form + info | ⚠️ no spam protection; no order-number field; duplicate chat widget |
| `/faq` | Accordion | ⚠️ no search/categories |
| `/about` | Story | ⚠️ "Since 1994" unverifiable; hardcoded stats |
| `/blog`, `/blog/:id` | Articles | 🔴 blog engagement fields mismatch rules (denied); comments in doc array (1 MiB limit); likes never roll back |
| `/auth` | Login/register | ⚠️ no password confirmation; verification banner skipped by immediate redirect |
| `/onboarding` | 2-step profile | 🔴 **overwrites existing addresses** (Onboarding.tsx:46) |
| `/invite/:email` | Invite accept | ⚠️ misleading "not found" on wrong account |

### Customer dashboard
| Route | Purpose | Health |
|---|---|---|
| `/dashboard` Overview | Metrics, subscriptions, deliveries, orders | ⚠️ verification banner good |
| `/dashboard/orders` | Orders + tracking timeline | 🔴 OrderHistory status mapping missing ready/preparing/out_for_delivery → shows "Pending" |
| `/dashboard/subscriptions` | Manage subscriptions | ⚠️ pause/resume works, but billing fiction |
| `/dashboard/loyalty` | Loyalty | 🔴 **fully static** — no earning, no redemption, no history |
| `/dashboard/settings` | Profile + notifications | ⚠️ OK; email change no re-verify |

### Admin
| Route | Purpose | Health |
|---|---|---|
| `/admin` Overview | KPIs | ⚠️ hardcoded 89500; stub `overdueLedger=0`, `totalRevLastWeek=0`; silent failure |
| `/admin/inventory` | Product CRUD + stock | ✅ strongest module; 🔴 reseed landmine in SiteSettings; no user attribution in stock history |
| `/admin/orders` | Order pipeline | ✅ status flow + driver assignment; 🔴 no refund/stock reversion; maps link crashes on missing GPS |
| `/admin/customers` + `/:id` | Customer archive | ⚠️ ban/delete no cascade; no impersonation |
| `/admin/subscriptions` | Subscription lifecycle | ⚠️ status only, no items/schedule edit |
| `/admin/plans` | Plan CRUD | ⚠️ no price cross-validation |
| `/admin/employees` | Invites + permissions | ⚠️ permissions decorative; 10 of 18 roles have zero UI |
| `/admin/cms` | Sections + FAQ | ✅ best-functioning admin feature |
| `/admin/blog` | Posts | ⚠️ fields mismatch rules |
| `/admin/messages` | Inbox | 🔴 **replies written to subcollection nothing reads** |
| `/admin/wholesale` | Partner approvals | 🔴 fetch has no try/catch (skeleton forever); no audit log |
| `/admin/analytics` | Charts | 🔴 no loading/error states; currency mixing; "active customers" = all users |
| `/admin/settings` | Site settings | 🔴 **dbSeeder.reseedAll() in client bundle**; exchangeRate=0 → division by zero |
| `/driver` | Dispatch | ⚠️ hardcodes cash collection for ALL deliveries incl. prepaid |

### Utility
NotFound, 404.html shim, ErrorBoundary, PageLoader.

---

## D. Complete Customer Journey

### Today's journey (new customer, mobile)
1. **Arrival** (ad/social) → 2. Home (hero, 2 CTAs) → 3. Shop → 4. Product → 5. Cart → 6. **Register** (email + password + name; Google OAuth available) → 7. **Verification gate** (must verify email in inbox; resend available) → 8. Checkout (4 steps: address+GPS → payment method → schedule → review) → 9. Order created (COD) → 10. Confirmation → 11. Dashboard tracking → 12. Delivery by driver (WhatsApp/call) → 13. Review → 14. Loyalty/referral (static).

### Pain points per step
| Step | Pain |
|---|---|
| Home | No products shown; fake stats; "collections" links break if CMS category renamed |
| Shop | No sort; 9px text; hover-only quick-add invisible on touch |
| Product | Stale variant bug; no stock-per-variant; no "Buy Now"; grind/weight confusion for novices |
| Register | Immediate navigate skips verification banner; no password confirm |
| Verify | Works, but new users who can't find the email are stuck (resend exists — good) |
| Checkout | "Pay Now" promises a discount with no payment; 3/6/12-month "duration" on a 1-off cart; grind not recorded; totals mismatch between steps |
| Confirmation | No items/total/delivery date shown |
| Tracking | Status labels wrong for 3 of 9 statuses |
| Support | Contact form replies never reach customers |

### Ideal shortest journey (target)
**Browse → Product → Add → (logged in) Checkout (prefilled address) → Confirm → Done — ≤4 taps beyond browsing.** Realistic with: guest checkout or one-tap Google sign-in, saved address book, COD-only honesty (remove fake payment options), and a 1-page checkout on mobile.

---

## E. Complete Subscription Journey

### Today
Subscriptions page → plan cards (Firestore) → "Start Ritual" → modal (time slot + date) → **creates `active` subscription with `paymentStatus: PENDING`, `preferredDay` = today's weekday name, no address** → confirmation page with no data.

Custom Plan Builder → 4 steps (products, frequency/duration, logistics form, review) → **creates subscription with hardcoded `preferredDay: 'Friday'`, `preferredTime: 'Morning'`, no delivery fee in total** → confirmation.

### Answers to the audit questions
- Can a normal customer understand subscriptions in <30s? **No** — no price-per-cycle breakdown on the plan cards beyond a single number; no "what happens next" timeline.
- Can they subscribe without support? **Yes** — but the result is meaningless (no billing, no address).
- Can they change their subscription easily? **Partially** — pause/resume/cancel/edit-address exist in dashboard; skip-a-delivery does not.
- Can they pause instead of cancel? **Yes**.
- Can they skip one delivery? **No**.
- Can they understand exactly what they will pay? **No** — payment schedule fields exist in types but are never written.
- Can they understand when the next delivery arrives? **Partially** — nextDelivery shown, but never updated by any automation.

---

## F. Complete Checkout Journey

1. Cart summary (subtotal, shipping flat 25,000 LBP, coupon — which **doesn't survive into checkout**)
2. Step 1: Address form + GPS pin (LocationPicker works well)
3. Step 2: Payment method — **only COD exists**, yet UI offers "Pay Now −10%", "Monthly Payment", "Deferred", and 1/3/6/12-month duration pickers; **all orders created COD `pending` regardless**
4. Step 3: Delivery date + time window + notes
5. Step 4: Review — **no items with grind/variant; no shipping/discount line items; total in USD only**
6. Submit → `OrderService.create` → profile address save → navigate to confirmation

### Psychology issues
- **Surprise-free pricing? No.** The final total in Checkout ignores the Cart coupon discount → customer pays more than shown.
- **Progress visibility? Yes** (4-step header).
- **Cognitive load? High.** Payment timing + duration options that mean nothing; LBP/USD dual display everywhere with no currency preference.
- **Typing? High.** No address book selector at checkout (addresses saved to profile are never offered for reuse).

---

## G. UI/UX Audit

### What works
- Cohesive espresso/caramel/cream palette with a strong "premium roastery" identity.
- Home hero and section rhythm (eyebrow → display heading → body → CTAs).
- Mobile filter drawer, slide-in menu with focus trap, skip-to-content link, smooth route transitions.
- ImageWithFallback with retries; skeleton loading on most lists.
- Driver dashboard is genuinely usable (tabs, GPS route, tel: links, good empty states).

### What's broken/confusing
- **Two design "skins" coexist** (design-system skin vs "roastery retro" skin — italic uppercase black headlines, huge radii on About/Cart/Subscriptions vs pill/display system on Home/Shop). The app reads as two different brands.
- **Dead CSS classes** everywhere: `card-responsive`, `text-error`, `duration-normal`, `-z-0`, `animate-shimmer`, `prose`, `no-scrollbar`, `focus-ring` — none defined; several silently break styling (notably `.bg-mocha/20` forced opaque by an `!important` alias → solid dark circles in Auth/Analytics).
- **`--site-bg` runtime var never consumed** by CSS (Site Settings background color does nothing visible).
- **Transparent header over dark heroes** → dark links invisible on Home/Wholesale before scroll.
- **Micro-text**: 8–10px badges (ProductCard, Dashboard) unreadable on mobile.
- Header mobile menu shows a "Current Time … UTC" widget (misleading, non-functional).
- Wholesale page has **two `<h1>`s**.

---

## H. Design System Audit

- Tokens exist in `src/styles/design-system/` (colors, spacing 8pt, radii, shadows, type scale) — **well-built but incompletely adopted**.
- Tailwind v4 used with legacy `@config` + `!important` alias block (inconsistent cascade: `.text-caramel` has !important, `.text-espresso` does not).
- **Fonts: Inter 400–700 loaded, but `font-black`/w800 used everywhere** → synthetic faux-bold.
- **No serif actually loaded** — `font-serif` = Inter italic (About quotes, ProductDetail).
- Color scale inconsistency: `coffee-400` (caramel) vs `coffee-500` (darker) vs `coffee-600` (mocha) — one scale mixes hues.
- `text-fluid-*` scale defined but never used.
- No `prefers-reduced-motion` anywhere; infinite ambient animations on Home/Auth/Subscriptions.
- PWA: SVG-only manifest icons (unreliable), apple-touch-icon is an SVG (iOS needs PNG), no favicon.ico, og:image is SVG (WhatsApp/Twitter won't render).
- **Verdict: 60/40 unified — fix by consolidating skins and deleting dead utilities.**

---

## I. Mobile Audit

**Strengths:** All grids collapse; tables wrapped in overflow-x-auto; header drawer with scroll-lock; AiBarista uses 100dvh + safe-area insets; driver UI works well.

**Problems:**
1. Header offset hand-rolled per page (`pt-16/24/32/40/56`) — overlap/whitespace drift across pages.
2. Shop filter drawer has **no body scroll-lock**.
3. Quick-add button hover-only → invisible on touch.
4. `bg-mocha/20` forced opaque → solid dark circle over Auth form on mobile.
5. 320px edge cases: About floating badge clipped; Auth 1000px decorative circle relies on root overflow.
6. PWA install prompt can overlap ProductDetail sticky add-to-cart bar.
7. Cart quantity steppers 32px — below 44px touch target guidance.
8. No bottom navigation for the storefront (header-only).

---

## J. Accessibility Audit

**Good:** skip link, focus trap in header drawer, aria-labels on wishlist buttons, focus-visible rings, buttons-not-divs, label-wrapped inputs.

**Failures (WCAG AA):**
1. `--color-text-muted` ≈ 3.4:1 on cream — fails AA for 9–12px text (used pervasively).
2. `text-caramel` on white ≈ 2.9:1 for tiny labels.
3. White text on amber/blue badges ≈ 2:1.
4. No `aria-current` on active nav (header + sidebar).
5. Cart quantity steppers/remove have icon-only buttons, no aria-label.
6. Chat input placeholder-only, no label.
7. `<tr onClick>` admin order rows not keyboard-accessible.
8. Search input `outline-none` with no replacement focus style.
9. No reduced-motion support.
10. Heading order drift (`<h3>` for field labels in Admin Orders).

---

## K. Performance Audit

- **Build:** 43 chunks, gzip total ~530 kB; index JS 197 kB (61 gzip) — acceptable but heavy.
- **Known bottlenecks:**
  1. **AiBarista context effect loops** — continuous Firestore reads (products + plans + cart + orders + profile) per render.
  2. `ProductService.getAll()` fetches the **entire products collection**, client-sorts; no pagination anywhere (products, orders, users, subscriptions all unbounded).
  3. Admin dashboard fires 5 full-collection `getDocs` in parallel on mount.
  4. GA script injection blocked by CSP (script never loads — wasted bytes).
  5. Hero images not preloaded; Inter 800 not preloaded.
  6. No image CDN/resizing pipeline (full-size uploads served from Firebase Storage).
- **Good:** route-level code splitting, vendor chunking, lazy xlsx/recharts/leaflet, skeletons.

---

## L. Security Audit

### Critical
1. **Price manipulation end-to-end.** Client submits order totals; rules only check `total >= 0`; carts are owner-writable with no content validation. A user can write `items: [{price: 1}]` in their cart and checkout "pays" 1 LBP. Same for subscriptions (arbitrary planId/price) and payments (`status: 'paid'` forgeable by the owner — firestore.rules payments create does not restrict status).
2. **`dbSeeder.reseedAll()` in client bundle** (SiteSettings.tsx:124) — any ADMIN session can wipe/reseed production data. Vite excludes it in prod (`excludeDevOnly` replaces with `export default {}`) → the button **crashes** (good) but the code path is a landmine; it worked before the exclusion.
3. **Coupon increment denied** — rules require isStaff for coupon writes, but the Cart calls `increment(usedCount)` as a customer → guaranteed permission-denied (feature broken, not a security hole).
4. **SVG upload stored-XSS vector** — storage rules allow `image/*` including `image/svg+xml`; content type is client-claimed. Staff could host an SVG with scripts in the public bucket.
5. **AI endpoint open to the public** — no auth; paid Gemini quota burnable by anyone (mitigated by per-IP 20/min + 100/hr + 500/day in-memory limits, non-durable across isolates). API key in URL query string (`?key=`), leaks into logs.
6. **Prompt injection** — client-supplied context (cart, orders, profile email) is interpolated into the system prompt server-side.
7. **PII to Gemini** — full user email, cart, and order history sent to the model with no consent.

### High
8. **Self-writable loyalty/totalSpent/emailVerified** — `isOwnerProfileUpdate` (post-fix) still allows owners to set `loyaltyPoints`, `totalSpent`, `emailVerified` in profile updates → points and spend forgeable.
9. **Audit logs forgeable** — client-side writes by any staff; no server append-only trail.
10. **Contact form spam** — unauthenticated create with no rate limit/captcha.
11. **Unhardened duplicate `firebase-functions/aiChat`** — open CORS `*`, no rate limits, no size caps. If anyone runs `firebase deploy --only functions`, it goes live.
12. `server.ts` CORS `*` + `unsafe-inline 'unsafe-eval'` CSP; in-memory rate-limit store never cleaned.
13. **Wholesale server route always 500s** — uses client Firestore SDK server-side without auth → permission-denied; dead code, but noisy.

### Good
- Firestore rules use explicit allow with global deny; role helpers solid; driver/order update restrictions correct.
- CSP on `_headers` is strong (frame-ancestors 'none', object-src 'none', base-uri 'self', form-action 'self').
- `.env` gitignored; API keys are Firebase-public by design; no hardcoded secrets in client bundle.
- Storage rules restrict writes to staff/owners.
- Error handling now logs real errors (Auth/Checkout).

---

## M. Admin Audit

**Admin CAN operate without code:** products, inventory/stock, plans, orders (status + driver assignment), customers (role/ban/delete), subscriptions (pause/activate/cancel), CMS sections, FAQ, blog, messages (reply — though replies never reach customers), wholesale approvals, site settings (exchange rate, fees, branding).

**Admin CANNOT (without code):**
- Coupons/promotions management (no admin UI at all — seeder only)
- Homepage product placement (featured/new) — no UI to set `isFeatured`
- Email templates / transactional emails (emailService.ts exists, never wired)
- Push notifications (tokens collected, no send path)
- Refunds/cancellations with stock reversion
- Reports with date ranges/exports beyond a basic Excel product export
- Order editing (line items, prices)
- Reviews moderation UI
- Loyalty/rewards configuration (static values in code)
- SEO per-page management (SEO.tsx is title+description only)

---

## N. Employee/RBAC Audit

**Roles defined (18):** owner, super_admin, admin, manager, accounting, customer_service, inventory, warehouse, barista, marketing, supplier_manager, driver, support, analyst, product_manager, wholesale_manager, wholesale, customer.

**Problems:**
1. **10 of 18 roles have no sidebar entry and no route** — owner, manager, accounting, inventory, warehouse, barista, marketing, supplier_manager, support, driver (driver has a route but not in this layout) log in to an **empty workspace**.
2. **Permissions matrix decorative** — `AVAILABLE_PERMISSIONS` written to user docs; `ProtectedRoute.requiredPermission` exists but **no route passes it**; nav filters by role only.
3. No role for delivery manager distinct from driver.
4. `hasPermission()` helper in security rules is **defined but never used**.
5. Role hierarchy is defined (`ROLE_HIERARCHY`) but routing checks specific lists rather than hierarchy (except `hasRole`).

**Target model:** consolidate to ~8 real roles (Owner, Admin, Product Manager, Inventory Manager, Customer Support, Accounting, Marketing/Content, Driver) with enforced permission checks on every admin action.

---

## O. AI Barista Audit

### Infrastructure
- Production: Cloudflare Function (`/api/ai/chat`) → Gemini via raw fetch, keyword fallback; 3-tier IP rate limits; 2,000-char message clamp; history truncated to 12 turns.
- Client: `gemini.ts` with fallback keyword engine; context = 50 products, 10 plans, cart, recent orders, wishlist, profile.

### Findings
1. 🔴 **Infinite effect loop** (AiBarista.tsx:36-81, no deps array) — re-fetches all context on every render; in StrictMode this doubles. Severe.
2. 🔴 **AI quotes wrong prices** — `catalog.ts` system prompt hardcodes "Ethiopian Yirgacheffe ($18)" while the seeded product is 350,000 LBP (~$3.90) and "Starter Plan $25/mo" vs actual ~1,200,000 LBP (~$13.40). The prompt says "NEVER make up prices" while hardcoding wrong ones.
3. Fallback responses hardcode `contact@coffeecraze.com` (wrong — real is `coffeecraze@nilelink.app`) and fake hours/prices.
4. No chat persistence; history resets on navigation.
5. No product grounding links in replies (recommendations are text-only; no "open product" affordance).
6. Context includes PII (email, cart, orders) with no consent.
7. Quiz mode: `JSON.parse` on Gemini output can 500.
8. History passed to Gemini excludes the just-sent message (stale state) — mild inconsistency.
9. No AbortController on client fetch — requests can hang.

---

## P. Coffee Academy Opportunity

**Recommendation: LAUNCH LATER (P2/P3).** Rationale:
- The platform cannot yet reliably sell coffee; education on top of a broken commerce layer multiplies surface area.
- That said, the content engine (Blog + CMS) already exists and the brand ("ritual", "curated") is a natural education fit.

**Phased:**
- **Phase 1 (after commerce is real):** free "Brew Basics" blog series + quiz→course mapping; reuse existing Blog/CMS infrastructure. Cost: low. Loyalty: high (return visits).
- **Phase 2:** 3–5 structured courses (French Press, Pour-Over, Espresso Foundations) with progress tracking and certificates. Revenue: new stream, subscription-tier differentiator.
- **Phase 3:** live workshops/events in Beirut + corporate training; ties to wholesale customers.

**Differentiator:** certification is a credible moat vs. supermarket coffee brands and other Shopify-style roasters in Lebanon; nobody local offers structured coffee education.

---

## Q. Trust & Conversion Audit

### What builds trust today
- Premium, consistent visual identity
- GPS pin for delivery, live tracking timeline, driver name
- Email verification requirement for checkout
- FAQ, contact info, About story, wholesale program
- Error handling now surfaces real errors

### What destroys trust (customers will notice)
1. **Fake stats** — "10,000+ Orders", "4.9/5", "+2K ritualists", fake Unsplash avatars, "Since 1994". Unverifiable claims = fraud risk.
2. **Checkout bait-and-switch** — coupon shown on Cart, ignored at Checkout.
3. **Fake payment options** — "Pay Now −10%" with no payment collected.
4. **Wrong delivery day** — preferredDay = today's weekday.
5. **Silent failures** — coupons "fail to apply", reviews fail with blog engagement, admin errors render empty pages.
6. **Wrong prices from AI** — the AI confidently quotes wrong catalog prices.
7. No return/refund policy, no privacy policy, no terms, no delivery-area statement, no roaster credentials, no team.

### Conversion levers missing
- Featured products on Home, testimonials with real names/photos, trust badges (COD, delivery area, quality guarantee), free-delivery progress bar, guest checkout, address book reuse, order tracking SMS/WhatsApp, post-delivery review prompt, real referral rewards.

---

## R. Missing Features (ranked)

### P0 — Critical (block launch)
1. Server-side order validation (price recompute from products DB, stock check, atomic stock decrement)
2. Honest payment capture (COD-only with clear labeling, or real card/wallet integration)
3. Coupon pipeline fixed end-to-end (schema match, server-side usage increment, carry into order total)
4. Remove fake payment options/duration discounts or make them real and recorded
5. Kill `dbSeeder` from the client bundle entirely
6. Fix AiBarista effect loop
7. Honest social proof (replace fabricated stats, fix fake avatars)
8. Order items must include variant (grind/weight) for fulfillment

### P1 — Important
9. Stock decrement + low-stock notifications + stock-per-variant
10. Real subscription engine: billing schedule, nextDelivery computation, pause/skip/resume, address collection
11. Email notifications (order confirmation, shipping updates, verification) — emailService exists, wire it
12. Granular permission enforcement
13. Blog engagement fix (rule fields match, subcollection for comments)
14. Referral program implemented (read `ref`, award points, unique codes)
15. Checkout: address book reuse, per-step validation, consistent LBP/USD totals, free-shipping progress
16. Currency preference honored (`UserPreferences.currency`)
17. Contact form rate limiting; replies delivered to customers (email)

### P2 — Valuable
18. Product search on header, sort on Shop, active-filter badges, URL-shareable filters
19. Wishlist for guests (localStorage fallback), wishlist >30 items, share wishlist
20. Order history pagination; reviews pagination + rating breakdown
21. Homepage: featured products, testimonials, delivery info strip
22. SEO: OG/Twitter cards per page, JSON-LD (Product/FAQ/Breadcrumb), per-page descriptions
23. PWA: PNG icons, apple-touch icon, manifest completeness
24. Admin: coupons UI, featured toggle UI, refund flow, analytics filters + date ranges
25. Guest checkout option

### P3 — Future
26. Coffee Academy (see P)
27. Real card payment (Lebanese PSP or gateway), wallets
28. Push notifications (FCM send path)
29. Marketplace/roaster partnerships, seasonal boxes
30. Events/tastings, community

---

## S. Features To Remove

1. **Fake payment options** in Checkout ("Pay Now", "Monthly", "Deferred", duration discounts) — until a payment processor exists
2. **`dbSeeder` import + Force Re-seed button** from SiteSettings (move to admin-only server script)
3. **"Current Time" widget** in mobile menu
4. **Step 3 "Ritual Manifested" dead screen** in Cart (unreachable code)
5. **Dead classes/utilities**: `card-responsive`, `text-error`, `-z-0`, `animate-shimmer` (or define it), `prose` (or add typography plugin), `no-scrollbar`, `focus-ring` (or use it), `bg-mocha/*` opacity aliases (or fix them), `--site-bg` (or wire it)
6. **Server route `/api/wholesale-inquiry`** (always 500s) or rewrite with Admin SDK
7. **`firebase-functions/` duplicate** aiChat (or harden + deploy it and remove the CF version)
8. **`hasPermission` unused rule function** (or enforce it)
9. **Fake avatars/stats** in Subscriptions/Home/About
10. **Duplicate ChatWidget** on Contact page (one concierge entry is enough)
11. **`text-fluid-*` unused scale** and redundant design-system import in main.tsx

---

## T. Features To Simplify

1. **Checkout** → one page on mobile: address (prefill from book) + COD only + confirm. Kill step 2's fictional choices.
2. **Currency display** → single currency per user (preference), not dual-everything.
3. **Auth** → one-tap Google sign-in as default; email+password secondary; add password confirm.
4. **Shop filters** → visible chips (category/rating) + sort dropdown; delete dead minPrice/tag.
5. **Subscriptions modal** → day-of-week picker, address, and explicit price-per-cycle; remove jargon.
6. **Admin sidebar** → only roles with UI; hide empty workspaces.
7. **Header** → active-state styling; move wishlist into mobile menu; remove UTC clock.
8. **Loyalty page** → show real points history or hide until implemented.

---

## U. Recommended Future Features

| # | Feature | Customer benefit | Business benefit | Complexity | Impact |
|---|---|---|---|---|---|
| 1 | Real card/wallet payments | Convenience, trust | Cash-flow, lower COD risk | High | ★★★★★ |
| 2 | Subscription engine (schedule + billing + skip) | Predictability | Recurring revenue | High | ★★★★★ |
| 3 | WhatsApp order notifications | Status certainty | Less support load | Low-Med | ★★★★ |
| 4 | Referral with real rewards | Discounts | Acquisition | Low | ★★★★ |
| 5 | Coffee Academy (phased) | Education, loyalty | New revenue, moat | Med | ★★★★ |
| 6 | Seasonal/discovery boxes | Excitement, gifting | Average order value | Med | ★★★ |
| 7 | Corporate/wholesale storefront | B2B convenience | B2B revenue | Med | ★★★ |
| 8 | Gift subscriptions | Gifting ease | New segment | Low | ★★★ |
| 9 | Events/tastings | Community | Brand depth | Low | ★★ |

---

## V. Critical Bugs (must fix before launch)

1. **AiBarista infinite re-fetch loop** — AiBarista.tsx:36-81
2. **Coupon broken + lost at checkout** — schema mismatch (isActive vs active), rules deny increment, discount never in order
3. **Fictional payment options + duration discounts on all carts** — Checkout.tsx:106-131, 215-216
4. **Client-trusted prices end-to-end** — carts/orders/payments/subscriptions forgeable
5. **No stock decrement anywhere** — oversell
6. **Subscriptions: active-without-payment, wrong preferredDay, no address** — Subscriptions.tsx:88-99
7. **dbSeeder.reseedAll() in client bundle** — SiteSettings.tsx:11,124
8. **ProductDetail stale variant across navigation** — ProductDetail.tsx:33-37
9. **Checkout drops variant (grind/weight)** — Checkout.tsx:176-182
10. **Blog engagement fields mismatch rules** → likes denied — blog_posts rule vs seeder fields
11. **Driver marks all deliveries cash-collected + PAID** — Driver/Dashboard.tsx:33-45
12. **Onboarding overwrites existing addresses** — Onboarding.tsx:46
13. **"New" badge dead with Timestamp createdAt; stock-less products show contradictory UI** — ProductCard.tsx:27-34
14. **Admin Orders maps link crashes on missing GPS** — Orders.tsx:301
15. **Admin Wholesale fetch no try/catch → permanent skeleton** — Wholesale.tsx:17-23
16. **AI quotes wrong prices** — functions/api/ai/catalog.ts

## W. High Priority Problems

1. Granular permissions decorative; 10 roles with empty workspace
2. Referral program non-functional (ref never parsed, points never awarded)
3. Replies to contact messages never reach customers
4. Fake social proof (stats, avatars, "1994", "+2K")
5. OrderHistory shows 3 statuses as "Pending"
6. GA blocked by CSP; exchangeRate double-sourced (hardcoded 89500 vs site_settings)
7. wishlist truncation at 30; no guest wishlist
8. No verification banner after register (navigates immediately)
9. Admin analytics currency mixing + stub metrics
10. Contact form spam vector (no rate limit)

## X. Medium Problems

1. Mixed Timestamp/ISO-string date handling across writers/consumers
2. ProductFormModal random SKUs, no uniqueness
3. Plans/products price cross-validation missing
4. No active nav highlighting (aria-current, nested paths)
5. Transparent header contrast over dark heroes
6. Micro-text 8–10px; touch targets < 44px
7. `.bg-mocha/20` forced-opaque bug
8. Two `<h1>` on Wholesale; heading-order drift in Admin Orders
9. `-z-0` dead class; fixed-header offsets hand-rolled per page
10. Cart `loading` state never changes; "1 item" counts lines not units
11. Quiz: RITUAL15 decorative; results not saved; single-word profile split bug
12. Subscriptions plan cards crash on missing features/price (NaN)
13. ProductCard hover-only quick-add invisible on touch
14. NotFound lacks useful CTAs; 404 shim OK
15. `updatedAt` string vs Timestamp in subscriptions/orders
16. Blog sort NaN with Timestamp dates; raw `post.date` renders [object Object]

## Y. Low Priority Problems

1. `_headers` lacks HSTS/report-to; server.ts CSP weak (dev only)
2. Sitemap static-only; no OG per-page; favicon.ico missing; apple-touch-icon SVG
3. Inter 800 not loaded (faux bold)
4. `duration-normal`/`duration-400` dead utilities
5. `logo.png` orphaned asset
6. PageTransition fade-only; scroll restoration disabled (intentional)
7. `navigator.clipboard` unguarded in ReferralSystem
8. `crypto.randomUUID()` insecure-context dependency in BlogDetail
9. Chat history excludes last message; no AbortController
10. ErrorBoundary doesn't reset on route change
11. `env(safe-area)` only in AiBarista; PWA prompt overlap risk
12. `lebanonCities` flat fee — no per-region pricing

---

## Z. Recommended Roadmap

### Phase 0 — Truth & Trust (this week)
1. Delete `dbSeeder` from the client bundle; remove Force Re-seed button
2. Remove fake payment options; COD-only, honest labels
3. Fix coupon pipeline or disable coupons UI until fixed
4. Replace fabricated stats/avatars with real data or remove
5. Fix AiBarista loop (add deps)
6. Fix ProductDetail stale variant
7. Fix OrderHistory status mapping

### Phase 1 — Money Integrity (2–3 weeks)
8. **Server-side order creation** (Cloudflare Function): recompute totals from products, validate stock, decrement atomically, record discount lines
9. Real payment capture or strict COD labeling with amounts
10. Stock-per-variant enforcement
11. Subscription engine v1: billing schedule, address, day-of-week, nextDelivery computation
12. Email notifications (order received/shipped/delivered)
13. Permission enforcement (requiredPermission on routes + rules via hasPermission)

### Phase 2 — Retention (month 2)
14. Referral program implemented
15. Contact replies via email
16. Loyalty: earn/redeem rules wired to orders
17. Guest checkout + address book reuse
18. Blog comments to subcollection; engagement rule fields fixed
19. Reviews moderation + duplicate prevention

### Phase 3 — Growth (month 3+)
20. Payments integration (PSP)
21. Coffee Academy phase 1
22. Seasonal boxes, gifts
23. PWA/SEO polish
24. Analytics filters + exports

---

## Final Scorecard (0–100)

| Dimension | Score | Notes |
|---|---|---|
| Product | **52** | Vision strong; delivery incomplete |
| Customer Experience | **38** | Broken coupons, fake payment, wrong prices |
| UX | **55** | Good flows, bad trust signals |
| UI | **72** | Genuinely attractive, two skins |
| Visual Design | **74** | Premium identity, micro-text/contrast issues |
| Mobile | **60** | Solid responsive base, touch-target/hover issues |
| Desktop | **70** | Best experience |
| Accessibility | **32** | Contrast, aria gaps, no reduced-motion |
| Performance | **58** | Loops, unbounded reads, GA blocked |
| Security | **48** | Client-trusted money, reseed landmine, SVG XSS, open AI |
| Checkout | **25** | Fictional payments, coupon loss, variant loss |
| Subscriptions | **15** | Fiction end-to-end |
| AI | **45** | Loop bug + wrong prices, good fallback design |
| Admin | **60** | Strong modules, destructive button, dead features |
| CMS | **70** | Best-in-class here |
| Employee Management | **35** | Decorative permissions, orphaned roles |
| Trust | **30** | Fabricated claims dominate |
| Conversion | **35** | Coupon bait-and-switch, no product surface on Home |
| Scalability | **45** | Unbounded reads, no pagination, no server layer |
| **Overall Production Readiness** | **38** | **NOT LAUNCH-READY for real money transactions** |

---

## The 10 Things, Straight Up

1. **Working:** Visual identity, mobile responsiveness, admin CMS/FAQ/blog, driver dispatch UX, error logging (Auth/Checkout), security baseline (CSP, rules structure).
2. **Broken:** Payments (fictional), coupons (end-to-end), subscriptions (fiction), stock (never decremented), referral (decorative), blog engagement (rule mismatch), messages replies (dead), AiBarista (loop), loyalty (static).
3. **Confusing:** Payment timing/duration options that mean nothing; dual-currency everywhere; "preferred delivery day = today"; 10 roles with empty workspaces; two design skins.
4. **Missing:** Server-side order validation, payment capture, email notifications, permissions enforcement, honest social proof, address book reuse, sort/filters that work, featured products on Home, return/refund policy.
5. **Remove:** Fake payment options, dbSeeder from client, UTC clock, dead CSS classes, dead server route, duplicate aiChat, fake avatars/stats, duplicate ChatWidget.
6. **Simplify:** Checkout to 1 page COD, single-currency display, one-tap Google sign-in, shop filters, admin sidebar to roles-with-UI.
7. **Add:** Server-side order pipeline, stock transactions, subscription engine, email notifications, real referral, honest reviews, per-page SEO, PNG PWA assets.
8. **Must fix before launch:** V (critical bugs list) + coupon honesty + payment honesty + remove fabricated claims.
9. **Can wait:** Coffee Academy, real card payments, events, marketplace, push notifications.
10. **Can make CoffeeCraze exceptional:** Honest trust layer first, then Coffee Academy certification, WhatsApp order updates, seasonal discovery boxes, and Beirut's first genuine specialty-coffee membership with education. The brand, the design, and the AI ambition are already exceptional — the business logic needs to catch up.
