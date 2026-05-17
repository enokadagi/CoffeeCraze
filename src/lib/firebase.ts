import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCpEk7hN9Yyt4Ykj0LuEF6qkzLK_gyxmUw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "coffeecraze-f27d3.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://coffeecraze-f27d3-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "coffeecraze-f27d3",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "coffeecraze-f27d3.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "571039033130",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:571039033130:web:ed51fe2ac564124c67e053",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-YY4HNH9M9R"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Test connection as required
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase Connected Successfully");
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
