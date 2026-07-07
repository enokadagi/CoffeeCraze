#!/usr/bin/env node
/**
 * Bootstrap admin role + seed catalog via Firebase Admin SDK.
 * Requires: firebase login (Application Default Credentials) or service account.
 */
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ADMIN_UID = process.env.ADMIN_UID || 'WPM6NaetzleM1KvEol5qK2XnoeT2'; // tgenuka90@gmail.com

// Import seed data from compiled path — read dbSeeder source and extract counts
const seederPath = join(__dirname, '..', 'src', 'utils', 'dbSeeder.ts');
const seederSrc = readFileSync(seederPath, 'utf8');

function extractArray(name) {
  const start = seederSrc.indexOf(`const ${name} = [`);
  if (start === -1) return [];
  let depth = 0;
  let i = seederSrc.indexOf('[', start);
  const begin = i;
  for (; i < seederSrc.length; i++) {
    if (seederSrc[i] === '[') depth++;
    if (seederSrc[i] === ']') {
      depth--;
      if (depth === 0) break;
    }
  }
  const arrCode = seederSrc.slice(begin, i + 1);
  // eslint-disable-next-line no-eval
  return eval(arrCode);
}

try {
  const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (saPath && existsSync(saPath)) {
    initializeApp({ credential: cert(JSON.parse(readFileSync(saPath, 'utf8'))) });
  } else {
    initializeApp({ credential: applicationDefault(), projectId: 'coffeecraze-f27d3' });
  }
} catch (e) {
  console.error('Failed to init firebase-admin:', e.message);
  process.exit(1);
}

const db = getFirestore();

async function seedCollection(name, items, idField = 'id') {
  const snap = await db.collection(name).limit(1).get();
  if (!snap.empty) {
    const count = (await db.collection(name).count().get()).data().count;
    console.log(`[skip] ${name}: already has ${count} documents`);
    return count;
  }
  const batch = db.batch();
  for (const item of items) {
    const id = item[idField];
    const ref = id ? db.collection(name).doc(id) : db.collection(name).doc();
    const { [idField]: _id, ...data } = item;
    batch.set(ref, id ? item : data);
  }
  await batch.commit();
  console.log(`[seed] ${name}: wrote ${items.length} documents`);
  return items.length;
}

async function main() {
  console.log('Bootstrapping admin:', ADMIN_UID);
  await db.collection('users').doc(ADMIN_UID).set({
    uid: ADMIN_UID,
    email: 'tgenuka90@gmail.com',
    displayName: 'TGenuka',
    role: 'admin',
    onboarded: true,
    createdAt: new Date().toISOString(),
  }, { merge: true });
  console.log('Admin role set.');

  const products = extractArray('SEED_PRODUCTS');
  const plans = extractArray('SEED_PLANS');
  const cms = extractArray('SEED_CMS');
  const blog = extractArray('SEED_BLOG');

  const p = await seedCollection('products', products);
  const pl = await seedCollection('plans', plans);
  const c = await seedCollection('cms_content', cms);
  const b = await seedCollection('blog_posts', blog);

  console.log('\nDone:', { products: p, plans: pl, cms: c, blog: b });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
