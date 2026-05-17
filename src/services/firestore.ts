import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy, limit, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Order, Subscription, Review, UserProfile } from '../types';

export const ProductService = {
  async getAll(): Promise<Product[]> {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  },

  async getById(id: string): Promise<Product | null> {
    const docRef = doc(db, 'products', id);
    const snap = await getDoc(docRef);
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Product) : null;
  },

  async getFeatured(): Promise<Product[]> {
    const q = query(collection(db, 'products'), where('isFeatured', '==', true), limit(6));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  },

  async getByCategory(category: string): Promise<Product[]> {
    const q = query(collection(db, 'products'), where('category', '==', category));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  }
};

export const OrderService = {
  async create(order: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'orders'), {
      ...order,
      createdAt: serverTimestamp(),
      status: 'pending'
    });
    return docRef.id;
  },

  async getByUserId(userId: string): Promise<Order[]> {
    const q = query(collection(db, 'orders'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString()
    } as Order));
  }
};

export const SubscriptionService = {
  async create(sub: Omit<Subscription, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'subscriptions'), {
      ...sub,
      createdAt: serverTimestamp(),
      status: 'active'
    });
    return docRef.id;
  },

  async getByUserId(userId: string): Promise<Subscription[]> {
    const q = query(collection(db, 'subscriptions'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
  },

  async updateStatus(id: string, status: Subscription['status']): Promise<void> {
    const docRef = doc(db, 'subscriptions', id);
    await updateDoc(docRef, { status });
  }
};

export const ReviewService = {
  async getByProductId(productId: string): Promise<Review[]> {
    const q = query(collection(db, 'reviews'), where('productId', '==', productId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
  },

  async addReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<void> {
    await addDoc(collection(db, 'reviews'), {
      ...review,
      createdAt: serverTimestamp()
    });
    
    // Update product average rating (ideally this should be an atomic operation or cloud function)
    // For now we'll do simple update
  }
};
