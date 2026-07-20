import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy, limit, addDoc, serverTimestamp, Timestamp, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Order, Subscription, Review, UserProfile, Plan } from '../types';

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

function formatOrderDoc(doc: any): Order {
  const data = doc.data();
  const createdAt = data.createdAt;
  return {
    id: doc.id,
    ...data,
    createdAt: (createdAt && typeof createdAt.toDate === 'function')
      ? createdAt.toDate().toISOString()
      : (typeof createdAt === 'string' ? createdAt : new Date().toISOString()),
  } as Order;
}

export const OrderService = {
  async create(order: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'orders'), {
      ...order,
      createdAt: serverTimestamp(),
      status: 'pending'
    });
    return docRef.id;
  },

  async getById(id: string): Promise<Order | null> {
    const docRef = doc(db, 'orders', id);
    const snap = await getDoc(docRef);
    return snap.exists() ? formatOrderDoc(snap) : null;
  },

  async getByUserId(userId: string): Promise<Order[]> {
    const q = query(collection(db, 'orders'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(formatOrderDoc);
  },

  subscribeToOrder(id: string, onData: (order: Order | null) => void, onError?: (err: Error) => void): Unsubscribe {
    return onSnapshot(
      doc(db, 'orders', id),
      (snap) => onData(snap.exists() ? formatOrderDoc(snap) : null),
      (err) => onError?.(err)
    );
  },

  subscribeToUserOrders(userId: string, onData: (orders: Order[]) => void, onError?: (err: Error) => void): Unsubscribe {
    const q = query(collection(db, 'orders'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => onData(snapshot.docs.map(formatOrderDoc)),
      (err) => onError?.(err)
    );
  },

  subscribeToAllOrders(onData: (orders: Order[]) => void, onError?: (err: Error) => void): Unsubscribe {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => onData(snapshot.docs.map(formatOrderDoc)),
      (err) => onError?.(err)
    );
  },

  subscribeToDriverOrders(driverId: string, onData: (orders: Order[]) => void, onError?: (err: Error) => void): Unsubscribe {
    const q = query(collection(db, 'orders'), where('driverId', '==', driverId));
    return onSnapshot(
      q,
      (snapshot) => onData(snapshot.docs.map(formatOrderDoc)),
      (err) => onError?.(err)
    );
  }
};

export const PlanService = {
  async getAll(): Promise<Plan[]> {
    const q = query(collection(db, 'plans'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));
  },

  async getById(id: string): Promise<Plan | null> {
    const docRef = doc(db, 'plans', id);
    const snap = await getDoc(docRef);
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Plan) : null;
  }
};

export const SubscriptionService = {
  async create(sub: Record<string, any>): Promise<string> {
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
  },

  subscribeToUserSubscriptions(userId: string, onData: (subs: Subscription[]) => void, onError?: (err: Error) => void): Unsubscribe {
    const q = query(collection(db, 'subscriptions'), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => onData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription))),
      (err) => onError?.(err)
    );
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
