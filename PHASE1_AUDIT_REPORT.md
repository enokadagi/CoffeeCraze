# PHASE 1 — COMPLETE SYSTEM AUDIT REPORT

> Generated: June 11, 2026
> Auditor: Automated Codebase Scan

---

## EXECUTIVE SUMMARY

| Category | Findings |
|----------|----------|
| **Total files audited** | 60+ (all pages, components, services, config, API) |
| **Critical issues** | 3 |
| **High issues** | 9 |
| **Medium issues** | 14 |
| **Low issues** | 7 |
| **Empty placeholder files** | 8 (4 in `src/utils/`, 4 in `src/api/middleware/`) |

---

## CRITICAL ISSUES

### C1. `dbSeeder.ts` exposed in client bundle
- `reseedAll()` function is exported and accessible from browser console
- Any visitor could call `dbSeeder.reseedAll()` and overwrite ALL Firestore data (products, plans, CMS, blog)
- **Fix:** Remove from client bundle, restrict to admin server-side only
- **File:** `src/utils/dbSeeder.ts`

### C2. 10 of 14 API files are empty placeholders
- Routes: `admin.ts`, `inventory.ts`, `orders.ts`, `products.ts`, `subscriptions.ts` — all empty
- Services: `orderService.ts`, `productService.ts`, `subscriptionService.ts` — all empty
- Middleware: `auth.ts`, `cors.ts`, `errorHandler.ts`, `validation.ts` — all empty
- Only `wholesaleInquiry.ts` and `emailService.ts` have real code
- **Impact:** No backend API for orders, products, subscriptions, admin, auth, CORS, error handling

### C3. Server uses client Firebase SDK, not Admin SDK
- `src/lib/firebase.ts` initializes a client-side Firebase app
- The Express server (`server.ts`) imports this client SDK
- Server-side Firestore writes are subject to client security rules
- Wholesale inquiry endpoint likely fails in production because Firestore rules require `request.auth.uid`
- **Fix:** Add `firebase-admin` package, initialize with service account credentials

---

## HIGH ISSUES

### H1. No authentication or CORS on Express API
- All middleware files are placeholders — no auth middleware exists
- No CORS headers on Express API
- Wholesale inquiry endpoint has no auth protection

### H2. Hardcoded exchange rate duplicated in 2 files
- `lib/utils.ts` line 16: `OFFICIAL_EXCHANGE_RATE = 89500`
- `utils/exchange.ts` line 1: `EXCHANGE_RATE = 89500`
- Duplicate values can diverge; static rate goes stale in volatile currency environment

### H3. Non-functional buttons throughout
- **Profile.tsx:** Change Password, Privacy Settings, Edit address — all no `onClick`
- **Settings.tsx:** Change Password, Two-Factor Auth, Active Sessions, Download Data, Delete Account — all inert
- **Dashboard/Overview.tsx:** pause/resume/manage/edit subscription — all just navigate to `/dashboard/subscriptions` (stubs)
- **Admin/Customers.tsx:** Ban button — no `onClick`, decorative only

### H4. Misleading analytics
- **Admin/Analytics.tsx:** "Category Sales" chart shows `product.stock` not actual sales data
- "Weekly" revenue aggregates ALL orders by day-of-week, not last 7 days

### H5. `text-cream` contrast failures (admin Wholesale page)
- `text-cream` (#F8F4EE) on light/white backgrounds — completely invisible
- Multiple instances on cards, stats, empty states

### H6. No pagination on any admin page
- All admin pages load ALL Firestore documents at once
- Will crash/break at scale (thousands of orders, customers, products)

### H7. Quick Add button hidden on mobile (ProductCard)
- `sm:translate-y-8 sm:opacity-0` — hidden on tablet+desktop, only shown on hover
- Touch devices can never trigger the button

### H8. Empty placeholder files (4 files)
- `src/utils/validators.ts` — empty
- `src/utils/emailTemplates.ts` — empty
- `src/utils/errorFormatter.ts` — empty
- `src/utils/priceConverter.ts` - empty
- Any import from these will break

### H9. Referral system uses entirely fake stats
- "Join 500+ Ritualists", "+12" avatar count, `'RITUALIST10'` referral code — all hardcoded mock data

---

## MEDIUM ISSUES

| # | Issue | File |
|---|-------|------|
| M1 | Social links in Footer are `href="#"` — broken | `Footer.tsx` |
| M2 | No SEO meta tags (OG, Twitter, etc.) | `SEO.tsx` |
| M3 | All fonts resolve to Arial/Helvetica (design intent unrealized) | `tailwind.config.js` |
| M4 | Color palette has excessive duplication (6 aliases for #C78A47) | `tailwind.config.js` |
| M5 | Tailwind v3-style config used with Tailwind v4 | `tailwind.config.js` |
| M6 | Project name is "react-example" not "CoffeeCraze" | `package.json` |
| M7 | `framer-motion` and `redux` referenced in vite config but not in dependencies | `vite.config.ts` |
| M8 | `@` alias maps to project root, not `./src` | `vite.config.ts`, `tsconfig.json` |
| M9 | No date-range filtering on analytics page | `Admin/Analytics.tsx` |
| M10 | Modals missing `role="dialog"` and `aria-modal` | CMS, Blog, Plans admin pages |
| M11 | Obfuscated column headers ("Ritualist_Node", etc.) in admin tables | Orders, Inventory, Customers, Subscriptions |
| M12 | AiBarista uses hardcoded hex colors instead of theme variables | `AiBarista.tsx` |
| M13 | Dashboard Overview sub management stubs — all navigate to list | `Dashboard/Overview.tsx` |
| M14 | No reply capability from Admin Messages page | `Admin/Messages.tsx` |

---

## LOW ISSUES

| # | Issue | File |
|---|-------|------|
| L1 | Cart badge colors identical in scrolled/unscrolled states | `Header.tsx` |
| L2 | Custom scrollbar class `scrollbar-thin` not a standard Tailwind class | `CustomPlanBuilder.tsx` |
| L3 | `Overdue` typo throughout codebase | Multiple files |
| L4 | `italic italic` duplicate class | `Dashboard/Loyalty.tsx` |
| L5 | Duplicate `@types/react-dom` in devDeps | `package.json` |
| L6 | Unused imports across 5+ admin pages | Multiple admin files |
| L7 | Garbled comment in vite config (encoding issue) | `vite.config.ts` |

---

## BROKEN LAYOUTS / ROUTING

| Page | Issue |
|------|-------|
| Home | Background `bg-coffee-50` on sourcing section — not a palette class |
| Shop | DEMO_PRODUCTS fallback shown when no Firestore data |
| Subscriptions | DEFAULT_PLANS fallback used when no remote plans exist |
| Checkout | Only `cash_on_delivery` payment method available |
| Dashboard Orders | Tracking steps use hardcoded mock dates |
| Dashboard Loyalty | Entire rewards system is hardcoded, no data fetching |
| FAQ | All questions hardcoded — no CMS integration |
| CoffeeQuiz | Fallback recommendation hardcoded (silent failure) |
| AiBarista | No `role="log"` or `aria-live` on chat — inaccessible |

---

## SECURITY WEAKNESSES

| Issue | Severity |
|-------|----------|
| `dbSeeder.reseedAll()` exposed in client bundle | **CRITICAL** |
| No auth middleware on Express API | **HIGH** |
| No CORS on Express API | **HIGH** |
| Wholesale inquiry has no rate limiting | **MEDIUM** |
| XSS vulnerability in email HTML template | **MEDIUM** |
| No input sanitization in email template | **MEDIUM** |
| Firestore rules hardcode `cash_on_delivery` only payment method | **MEDIUM** |
| No security headers on Firebase Hosting | **LOW** |
| `Confirm()` browser dialog for destructive actions (cancel subscription) | **LOW** |

---

## MISSING PERMISSIONS CHECK

- Current codebase has only `UserRole.ADMIN` and `UserRole.CUSTOMER` / `WHOLESALE`
- ProtectedRoute checks only for `ADMIN` role
- No employee management system exists
- No granular permissions (ProductManager, CustomerService, etc.)
- Admin routes simply check `allowedRoles={[UserRole.ADMIN]}` — binary access control

---

## MOBILE ISSUES FOUND

| Issue | File |
|-------|------|
| ProductCard Quick Add hidden on mobile (tablet+) via hover-only pattern | `ProductCard.tsx` |
| Mobile menu has no focus trap | `Header.tsx` |
| CustomPlanBuilder uses `scrollbar-thin` (not available) | `CustomPlanBuilder.tsx` |
| Dashboard tables force scroll on mobile | Multiple admin |

---

## PLACEHOLDER / MOCK CONTENT

| Content | Location | What it shows |
|---------|----------|---------------|
| DEMO_PRODUCTS (3 items) | `Shop.tsx` | Fallback when no products |
| DEFAULT_PLANS (3 items) | `Subscriptions.tsx` | Fallback when no plans |
| FAQ hardcoded (4 items) | `FAQ.tsx` | No CMS integration |
| Loyalty rewards (3 tiers) | `Dashboard/Loyalty.tsx` | Hardcoded |
| Referral stats fake | `Dashboard/ReferralSystem.tsx` | "500+ Ritualists" |
| Tracking mock dates | `Dashboard/Orders.tsx` | "Oct 24, 10:00 AM" |
| Analytics fake metrics | `Admin/Analytics.tsx` | Stock shown as sales |
| Invoice placeholder URL | `paymentService.ts` | `invoices.example.com` |
| Social links `href="#"` | `Footer.tsx` | Broken |
| Contact social links `href="#"` | `Contact.tsx` | Broken |

---

**END OF PHASE 1 AUDIT REPORT**
