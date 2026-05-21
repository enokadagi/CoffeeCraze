# CoffeeCraze — Dashboard + Subscription + Ops Refinement TODO

> Goal: Rebuild premium, production-grade UX for user/admin dashboards, subscriptions, checkout, tracking, profile/settings, auth/security, and responsive layouts — without breaking Firebase logic or changing Firestore structure.

## Planning
- [ ] Inspect current UI routes/pages/components for:
  - User dashboard: overview, subscriptions, deliveries, orders, profile/settings, notifications, loyalty, AI recommendations
  - Admin/super admin pages: dashboard, customers, plans, subscriptions, inventory, orders, analytics, wholesale
  - Checkout/cart flow and order success pages
- [ ] Inspect existing Firestore data model usage for:
  - subscriptions, deliveries, orders, payments, invoices/receipts, addresses/profile
  - required fields + collection names + document shapes
- [ ] Produce a code-level mapping plan (UI ↔ Firestore fields) with backward compatibility notes.
- [ ] Identify and list every UI inconsistency (card sizing, oversized typography, broken mobile grids).
- [ ] Confirm implementation order to avoid regressions.

## User Dashboard UX
- [ ] Rebuild Dashboard Overview with:
  - polished KPI cards (compact typography)
  - next delivery card with accurate status/payment context
  - upcoming deliveries list + empty/loading/error states
- [ ] Add/upgrade missing dashboard sections:
  - Active Plans (actionable cards: pause/skip/extend)
  - Payment Status (next payment / overdue)
  - Delivery Tracking (timeline + delivery details)
  - Order History (filters + responsive layout)
  - Wishlist, Notifications, Settings, Support, Loyalty & Rewards
  - AI Recommendations (real recommendations using existing AI utilities)
- [ ] Ensure all dashboard sections use a consistent grid system and card sizing.

## Subscription & Custom Plan Builder
- [ ] Audit existing subscription pages/components/routes.
- [ ] Implement/upgrade Custom Plan Builder UX:
  - add/remove items
  - set quantities
  - choose delivery schedule (frequency + next date)
  - choose payment preference (monthly/prepaid/deferred)
  - validate inputs (no empty plan, quantity bounds)
- [ ] Ensure builder persists data to Firestore without breaking existing structure.
- [ ] Ensure admin dashboard reflects changes from user custom plans.
- [ ] Implement actions:
  - pause/resume
  - skip delivery cycle
  - upgrade/downgrade plan items
  - extend duration

## Plan Card & Pricing Refinement
- [ ] Standardize plan card component sizing and typography scale.
- [ ] Implement dual currency display cleanly (USD + LBP) with compact formatting.
- [ ] Fix spacing/visual hierarchy issues across mobile/tablet/desktop.

## Cart, Checkout & Order Flow
- [ ] Rebuild cart page layout (responsive, clear totals, correct UI states).
- [ ] Rebuild checkout flow as a production-stepper:
  - Shipping → Payment → Scheduling → Review → Confirm
  - strong redirects and completion states
- [ ] Add delivery scheduling UX:
  - delivery date picker
  - delivery time window selector
  - notes/instructions
- [ ] Ensure payment preference selection maps to stored fields.
- [ ] Ensure OrderSuccess/confirmation pages show accurate order + delivery + payment info.

## Tracking & Delivery System
- [ ] Create consistent delivery timeline UI for user dashboard and admin pages.
- [ ] Add delivery history UI (past deliveries) for user.
- [ ] Admin operational tracking:
  - delivery schedule
  - delivery status updates
  - customer notes/specifications and locations

## Super Admin / Admin Ops Control Center
- [ ] Rebuild admin dashboard to be operational:
  - scannable KPI cards
  - operational tasks panel
  - quick actions
- [ ] Ensure admin pages support responsive tables/cards:
  - inventory/stock levels
  - products
  - plans
  - subscriptions
  - orders
  - customers
  - wholesale queue
  - support tickets/AI controls (UI)
- [ ] Add overdue/amount-due indicators based on existing stored ledger/payment fields.

## Profile System & Settings
- [ ] Rebuild Profile page:
  - active plans
  - payment preferences
  - subscription history
  - delivery preferences
  - invoices/receipts
  - loyalty points
  - saved addresses
  - support history
- [ ] Rebuild Settings/Preferences:
  - email/phone updates
  - address management
  - notification preferences
- [ ] Ensure all updates sync correctly to Firestore.

## Authentication UX + Security UX
- [ ] Upgrade Auth forms:
  - show/hide password eye toggle
  - stronger validation
  - reset password flow (usable and correctly redirected)
  - email verification UX
  - better error handling (human-readable)
  - session handling / expired session behavior

## Contact & AI Refinement
- [ ] Ensure Contact/Support is consistent and wired to support system.
- [ ] Upgrade Chat widget UX (premium look, clear conversation states).
- [ ] Ensure AI recommendations are actually useful and context-aware.

## Responsiveness & Visual Polish (Mandatory)
- [ ] Standardize typography scale (no oversized text/cards on mobile).
- [ ] Normalize card padding, radius, borders, and shadows.
- [ ] Fix chart/table responsiveness and empty states.
- [ ] Ensure all dashboard layouts use consistent max-width and grid breakpoints.

## Testing & Regression Safety
- [ ] Verify all existing Firebase/Firestore reads/writes still work.
- [ ] Smoke test:
  - sign in/out
  - update profile + address
  - create checkout order and confirm
  - view dashboard subscription + deliveries
  - admin operations read views
- [ ] Validate currency formatting and exchange conversions.

## Done
- [ ] Mark completed tasks above as ✅

