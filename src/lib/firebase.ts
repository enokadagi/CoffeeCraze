import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const REQUIRED_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

export function validateEnv(): string[] {
  const missing = REQUIRED_VARS.filter(
    (name) => !import.meta.env[name as keyof ImportMeta['env']]
  );
  if (missing.length > 0) {
    console.warn(
      `[CoffeeCraze] Missing environment variables:\n  ${missing.join('\n  ')}\n` +
      'Set these in your .env file. See .env.example for reference.'
    );
  }
  return missing;
}

let _env: any = (globalThis as any)?.process?.env ?? {};
try {
  // In Vite dev/client this will be available as import.meta.env
  _env = (import.meta as any)?.env ?? _env;
} catch (_) {
  // ignore - fallback to process.env
}

const firebaseConfig = {
  apiKey: _env.VITE_FIREBASE_API_KEY || _env.FIREBASE_API_KEY || '',
  authDomain: _env.VITE_FIREBASE_AUTH_DOMAIN || _env.FIREBASE_AUTH_DOMAIN || '',
  databaseURL: _env.VITE_FIREBASE_DATABASE_URL || _env.FIREBASE_DATABASE_URL || '',
  projectId: _env.VITE_FIREBASE_PROJECT_ID || _env.FIREBASE_PROJECT_ID || '',
  storageBucket: _env.VITE_FIREBASE_STORAGE_BUCKET || _env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: _env.VITE_FIREBASE_MESSAGING_SENDER_ID || _env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: _env.VITE_FIREBASE_APP_ID || _env.FIREBASE_APP_ID || '',
  measurementId: _env.VITE_FIREBASE_MEASUREMENT_ID || _env.FIREBASE_MEASUREMENT_ID || ''
};

let app: any = null;
let db: any = null;
let auth: any = null;
let storage: any = null;
let googleProvider: any = null;

if (firebaseConfig.apiKey) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.addScope('profile');
  googleProvider.addScope('email');
  googleProvider.setCustomParameters({ prompt: 'select_account' });
} else {
  console.warn('[CoffeeCraze] Firebase not initialized because VITE_FIREBASE_API_KEY is not set.');
}

export { db, auth, storage, googleProvider };
