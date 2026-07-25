import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _env: any = (globalThis as any)?.process?.env ?? {};
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _env = (import.meta as any)?.env ?? _env;
} catch {
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

let app: FirebaseApp | null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;
if (firebaseConfig.apiKey) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
} else {
  console.warn('[CoffeeCraze] Firebase not initialized because VITE_FIREBASE_API_KEY is not set.');
}

export { db, auth, storage };
