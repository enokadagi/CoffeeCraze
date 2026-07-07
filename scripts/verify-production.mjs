#!/usr/bin/env node
/**
 * Production verification — tests live Firestore queries and public endpoints.
 * Run: node scripts/verify-production.mjs
 */
import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, getDocs, query, where, orderBy, addDoc, limit,
} from 'firebase/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split('=').map((s) => s.trim()))
    .filter(([k]) => k)
);

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const HOSTING = 'https://coffeecraze-f27d3.web.app';
const results = [];

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function runQuery(name, fn) {
  try {
    const snap = await fn();
    record(name, true, `${snap.size ?? snap.docs?.length ?? 0} docs`);
    return snap;
  } catch (e) {
    record(name, false, e.message?.slice(0, 120) || String(e));
    return null;
  }
}

async function main() {
  console.log('\n=== CoffeeCraze Production Verification ===\n');
  console.log(`Project: ${firebaseConfig.projectId}`);
  console.log(`Hosting: ${HOSTING}\n`);

  // Step 5 — Index / query verification
  await runQuery('products (public list)', () => getDocs(collection(db, 'products')));
  await runQuery('plans (public list)', () => getDocs(collection(db, 'plans')));
  await runQuery('cms_content hero query', () =>
    getDocs(query(collection(db, 'cms_content'), where('type', '==', 'hero'), where('visible', '==', true))));
  await runQuery('blog_posts published', () =>
    getDocs(query(collection(db, 'blog_posts'), where('status', '==', 'published'))));
  await runQuery('contact_messages status+createdAt index', () =>
    getDocs(query(collection(db, 'contact_messages'), where('status', '==', 'unread'), orderBy('createdAt', 'desc'), limit(5))));
  await runQuery('wholesale_accounts pending', () =>
    getDocs(query(collection(db, 'wholesale_accounts'), where('status', '==', 'pending'))));
  await runQuery('subscriptions status+nextDelivery', () =>
    getDocs(query(collection(db, 'subscriptions'), where('status', '==', 'active'), orderBy('nextDelivery', 'asc'), limit(5))));

  // Contact create (public)
  try {
    await addDoc(collection(db, 'contact_messages'), {
      name: 'QA Verification Bot',
      email: 'qa-verify@coffeecraze.test',
      message: 'Automated production verification message — safe to delete.',
      status: 'unread',
      createdAt: new Date().toISOString(),
    });
    record('contact_messages create (public)', true);
  } catch (e) {
    record('contact_messages create (public)', false, e.message?.slice(0, 120));
  }

  // Data counts
  const [products, plans, cms, blog] = await Promise.all([
    getDocs(collection(db, 'products')).catch(() => null),
    getDocs(collection(db, 'plans')).catch(() => null),
    getDocs(collection(db, 'cms_content')).catch(() => null),
    getDocs(collection(db, 'blog_posts')).catch(() => null),
  ]);

  if (products) record('Seed check: products >= 20', products.size >= 20, `count=${products.size}`);
  if (plans) record('Seed check: plans >= 5', plans.size >= 5, `count=${plans.size}`);
  if (cms) record('Seed check: CMS content exists', cms.size > 0, `count=${cms.size}`);
  if (blog) record('Seed check: blog posts exist', blog.size > 0, `count=${blog.size}`);

  // Admin users check
  try {
    const users = await getDocs(collection(db, 'users'));
    const admins = users.docs.filter((d) => d.data().role === 'admin');
    record('Admin users in Firestore', admins.length > 0, `${admins.length} admin(s) of ${users.size} users`);
    if (admins.length) {
      console.log(`   Admin UIDs: ${admins.map((d) => d.id).join(', ')}`);
    }
  } catch (e) {
    record('Admin users in Firestore', false, 'permission denied (expected without auth)');
  }

  // AI endpoint
  try {
    const res = await fetch(`${HOSTING}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Say hello in one word.' }),
    });
    const text = await res.text();
    record('AI endpoint /api/ai/chat', res.ok, `HTTP ${res.status}: ${text.slice(0, 80)}`);
  } catch (e) {
    record('AI endpoint /api/ai/chat', false, e.message);
  }

  // Hosting bundle — no Gemini key
  try {
    const html = await fetch(HOSTING).then((r) => r.text());
    const jsUrls = [...html.matchAll(/\/assets\/[^"]+\.js/g)].map((m) => m[0]);
    let geminiLeak = false;
    for (const url of jsUrls.slice(0, 5)) {
      const js = await fetch(HOSTING + url).then((r) => r.text());
      if (/VITE_GEMINI|GEMINI_API_KEY|AIzaSy[A-Za-z0-9_-]{20,}/.test(js) && !js.includes(firebaseConfig.apiKey)) {
        geminiLeak = true;
      }
      if (js.includes('VITE_GEMINI') || js.includes('GEMINI_API_KEY')) geminiLeak = true;
    }
    record('No Gemini API key in client bundle', !geminiLeak);
    record('Firebase config embedded in hosting', html.includes('assets/') && jsUrls.length > 0, `${jsUrls.length} chunks`);
  } catch (e) {
    record('Hosting bundle scan', false, e.message);
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n=== Summary: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
