#!/usr/bin/env node
/**
 * Production plan seeder — creates the subscription `plans` documents
 * against the LIVE catalog (product IDs resolved from Firestore).
 *
 * Usage:
 *   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account.json"
 *   node scripts/seed-plans.mjs
 *
 * Idempotent: existing plan IDs are left untouched (skipped, reported).
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS || !existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to a Firebase service-account JSON first.');
  process.exit(1);
}
const sa = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

// Plan definitions (fields kept identical to Admin Plans CRUD payloads, plus
// `items` derived from real products so the /api/subscriptions snapshot is full).
const SEED_PLANS = [
  {
    id: 'starter-pack',
    name: 'Starter',
    description: 'The easiest way to begin your coffee journey. A small, curated selection delivered biweekly.',
    price: 1200000,
    priceUsd: 13.4,
    priceLbp: 1200000,
    features: [
      '2 x 250g Bags per delivery',
      'Curated roast variety',
      'Biweekly delivery',
      'Priority customer support',
    ],
    productRefs: ['ethiopia 250g', 'colombia 250g'],
    quantity: 1,
    frequency: 'biweekly',
    minDeliveries: 2,
    isFeatured: false,
    isCustomizable: true,
  },
  {
    id: 'explorer-plan',
    name: 'Explorer',
    description: 'For the curious coffee adventurer. Discover rotating single-origins from across the world.',
    price: 2500000,
    priceUsd: 27.9,
    priceLbp: 2500000,
    features: [
      '3 x 250g Single-Origin Bags',
      'Tasting notes & brew guide',
      'Weekly delivery',
      'Free shipping on every order',
    ],
    productRefs: ['ethiopia 250g', 'colombia 250g', 'ethiopia 250g'],
    quantity: 1,
    frequency: 'weekly',
    minDeliveries: 3,
    isFeatured: false,
    isCustomizable: true,
  },
  {
    id: 'premium-suite',
    name: 'Premium',
    description: 'Our most popular plan for dedicated home baristas. Maximum freshness, maximum variety.',
    price: 4500000,
    priceUsd: 50.28,
    priceLbp: 4500000,
    features: [
      '4 x 250g Premium Bags + Capsule Pack',
      'Access to limited small-batch drops',
      'Weekly delivery',
      'Dedicated personal concierge',
      'Free premium brewing accessories',
    ],
    productRefs: ['ethiopia 250g', 'colombia 250g', 'espresso blend', 'capsule collection'],
    quantity: 1,
    frequency: 'weekly',
    minDeliveries: 4,
    isFeatured: true,
    isCustomizable: false,
  },
  {
    id: 'family-plan',
    name: 'Family',
    description: 'Coffee for the whole household. Large format bags, variety for every taste, delivered weekly.',
    price: 3200000,
    priceUsd: 35.7,
    priceLbp: 3200000,
    features: [
      '2 x 1kg Bags (mixed roasts)',
      'Ground + Whole Bean options',
      'Weekly delivery',
      'Family-size discount applied',
      'Free delivery always',
    ],
    productRefs: ['espresso 1kg', 'colombia 250g'],
    quantity: 1,
    frequency: 'weekly',
    minDeliveries: 2,
    isFeatured: false,
    isCustomizable: true,
  },
  {
    id: 'office-plan',
    name: 'Office',
    description: 'Keep your team energized. Bulk beans and capsules delivered to your office every week.',
    price: 7500000,
    priceUsd: 83.75,
    priceLbp: 7500000,
    features: [
      '4 x 1kg Bags + 40 Capsules',
      'Mixed roast profiles for all tastes',
      'Weekly delivery to your office',
      'Dedicated account manager',
      'Custom branded packaging available',
    ],
    productRefs: ['espresso 1kg', 'colombia 250g', 'espresso blend', 'capsule collection'],
    quantity: 1,
    frequency: 'weekly',
    minDeliveries: 1,
    isFeatured: false,
    isCustomizable: true,
  },
  {
    id: 'custom-plan',
    name: 'Custom',
    description: 'A fully personalized coffee subscription tailored exactly to your tastes and schedule.',
    price: 9500000,
    priceUsd: 106.15,
    priceLbp: 9500000,
    features: [
      'You choose the beans & quantities',
      'Custom roast profile on request',
      'Flexible delivery frequency',
      'Dedicated personal roaster contact',
      'First-access to micro-lots & experiments',
    ],
    productRefs: [],
    quantity: 1,
    frequency: 'monthly',
    minDeliveries: 1,
    isFeatured: false,
    isCustomizable: true,
  },
  {
    id: 'daily-essentials',
    name: 'Daily',
    description: 'Fresh coffee delivered to your door every single day. Perfect for the dedicated coffee devotee who never compromises.',
    price: 350000,
    priceUsd: 3.91,
    priceLbp: 350000,
    features: [
      '1 x 200g Bag per day',
      'Fresh-roasted daily dispatch',
      'Daily delivery - 7 days a week',
      'Priority morning slot guarantee',
      'Free brewing consultation',
    ],
    productRefs: ['ethiopia 250g'],
    quantity: 1,
    frequency: 'daily',
    minDeliveries: 7,
    isFeatured: true,
    isCustomizable: false,
  },
];

async function main() {
  // Load the live catalog for name/price resolution.
  const snap = await db.collection('products').get();
  const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const keys = ['ethiopia 250g', 'colombia 250g', 'espresso blend', 'espresso 1kg', 'capsule collection'];
  const byKey = new Map(keys.map((k) => [k, undefined]));
  for (const p of products) {
    const name = (p.name || '').toString().toLowerCase();
    if (name.includes('ethiopia') && !byKey.get('ethiopia 250g')) byKey.set('ethiopia 250g', p);
    if ((name.startsWith('colombia') || name.includes('colombia')) && !byKey.get('colombia 250g')) byKey.set('colombia 250g', p);
    if (name.includes('house blend') && !byKey.get('espresso blend')) byKey.set('espresso blend', p);
    if (name.includes('1kg') && name.includes('espresso') && !byKey.get('espresso 1kg')) byKey.set('espresso 1kg', p);
    if (name.includes('capsule') && !byKey.get('capsule collection')) byKey.set('capsule collection', p);
  }

  const writeBatches = [];
  let created = 0;
  let skipped = 0;
  let upgraded = 0;

  for (const plan of SEED_PLANS) {
    const existing = await db.collection('plans').doc(plan.id).get();
    const { productRefs, quantity, ...rest } = plan;
    const items = productRefs
      .map((key) => {
        const p = byKey.get(key);
        if (!p) {
          console.warn(`[warn] ${plan.id}: no live product matched "${key}" — item omitted`);
          return null;
        }
        return { productId: p.id, name: p.name, price: Number(p.priceLbp ?? p.price ?? 0), quantity };
      })
      .filter(Boolean);
    const productIds = items.map((i) => i.productId);
    const doc = {
      ...rest,
      productIds,
      items,
      createdAt: existing.exists ? existing.data().createdAt ?? new Date().toISOString() : new Date().toISOString(),
    };
    if (existing.exists) {
      // Keep the base fields intact — only top up items/productIds when a plan
      // was created before the items mapping existed.
      if (existing.data()?.items?.length) {
        console.log(`[skip] ${plan.id} — already exists with items`);
        skipped++;
        continue;
      }
      writeBatches.push(db.collection('plans').doc(plan.id).set(doc, { merge: true }));
      console.log(`[upgrade] ${plan.id} — ${items.length} item(s) mapped`);
      upgraded++;
    } else {
      writeBatches.push(db.collection('plans').doc(plan.id).set(doc));
      console.log(`[seed] ${plan.id} — ${items.length} item(s) mapped`);
      created++;
    }
  }

  if (writeBatches.length > 0) {
    await Promise.all(writeBatches);
    console.log(`\nDone: ${created} plan(s) created, ${upgraded} upgraded, ${skipped} skipped.`);
  } else {
    console.log(`\nDone: nothing to write (${skipped} already present).`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});