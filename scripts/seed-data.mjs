#!/usr/bin/env node
/**
 * Manual seed instructions — NEVER run automatically in production.
 *
 * Option A (recommended): Sign in as admin → Admin Dashboard → "Seed Demo Data"
 *   Requires double confirmation. Uses client Firebase SDK with admin Firestore rules.
 *
 * Option B: Firebase Console → Firestore → import collections manually.
 *
 * This script only prints guidance; it does not execute seeds without explicit admin auth.
 */
console.log(`
CoffeeCraze Manual Data Seed
============================

Automatic seeding is DISABLED in production builds.

To seed demo catalog data once:

  1. Deploy Firestore rules and create an admin user:
     - Register a user, then set users/{uid}.role = "admin" in Firestore Console.

  2. Sign in as admin and open /admin/dashboard

  3. Click "Seed Demo Data" (double confirmation required)

Collections seeded: products, plans, cms_content (hero block)

Do NOT re-run on a live catalog unless you intend to overwrite seed documents by ID.
`);
