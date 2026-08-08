# CoffeeCraze — Production Completion TODO

## Phase 1 — Fix Upload System (CRITICAL)
- [ ] 1.1 Rewrite `storage.rules` to allow ALL admin upload paths
- [ ] 1.2 Update `SiteSettings.tsx` to use shared `upload.ts` (progress, retry, WebP)
- [ ] 1.3 Update `Plans.tsx` to use shared `upload.ts`
- [ ] 1.4 Update `Blog.tsx` to use shared `upload.ts`
- [ ] 1.5 Update `CMS.tsx` to use shared `upload.ts`
- [ ] 1.6 Update `ProductFormModal.tsx` to use shared `upload.ts`
- [ ] 1.7 Rewrite `src/lib/firebase.ts` fail-fast + non-null exports

## Phase 2 — Notifications (FCM)
- [ ] 2.1 Add `VITE_FIREBASE_VAPID_KEY` to `.env.example`
- [ ] 2.2 Include VAPID key in SW injection (vite.config.ts)
- [ ] 2.3 Fix AuthContext FCM token auto-init (avoid repeated prompts)
- [ ] 2.4 Verify enablePush() flow persists token + prefs

## Phase 3 — CMS Completeness
- [ ] 3.1 Wire `Home.tsx` hero to consume `site_settings.hero*`
- [ ] 3.2 Ensure all editable pages consume CMS (audit)

## Phase 4 — Global UI/UX & Mobile
- [ ] 4.1 Fix Checkout price formatting (`formatPrice`)
- [ ] 4.2 Replace all raw `<img>` tags → `ImageWithFallback`
- [ ] 4.3 Redesign customer dashboard pages (Overview, Orders, Subscriptions, Loyalty, Settings)
- [ ] 4.4 Mobile safe-area/responsive fixes (320–430px, sticky checkout/cart)

## Phase 5 — Realtime & Reliability
- [ ] 5.1 Verify realtime listeners across orders/subscriptions/inventory
- [ ] 5.2 Run `npm run lint` (tsc) — zero errors
- [ ] 5.3 Run `npm run test` — pass
- [ ] 5.4 Run `npm run build` — pass

## Phase 6 — Production Completion Report
- [ ] 6.1 Update `PRODUCTION_COMPLETION_REPORT.md` with findings/fixes/readiness

