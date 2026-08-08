import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// Use direct properties so Vite can statically replace import.meta.env at build time.
const env: ImportMetaEnv = typeof import.meta !== 'undefined' ? import.meta.env : ({} as ImportMetaEnv);

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

function assertConfig(config: Record<string, string>): void {
  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key.replace('VITE_', ''));
  if (missing.length > 0) {
    throw new Error(
      `[CoffeeCraze] Firebase is not configured. Missing env vars: ${missing.join(', ')}. ` +
      'Set VITE_FIREBASE_* variables in your .env file (see .env.example).'
    );
  }
}

// Fail fast in development and production: if the Firebase env config is absent,
// the app cannot function (Auth, Firestore, Storage, Messaging all require it).
assertConfig(firebaseConfig);

const app: FirebaseApp = initializeApp(firebaseConfig);
const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);
const storage: FirebaseStorage = getStorage(app);

export { app, db, auth, storage };

