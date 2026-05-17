import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserRole, UserProfile } from '../types';

export const AuthService = {
  async login(email: string, pass: string): Promise<User> {
    const { user } = await signInWithEmailAndPassword(auth, email, pass);
    return user;
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  async getProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as UserProfile) : null;
  }
};
