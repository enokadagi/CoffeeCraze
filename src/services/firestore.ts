import { collection, doc, getDoc, getDocs, updateDoc, query, where, orderBy, limit, onSnapshot, Unsubscribe, type DocumentSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Order, Subscription, Plan } from '../types';

export const ProductService = {
  async getAll(): Promise<Product[]> {
    const snapshot = await getDocs(collection(db, 'products'));
    const raw = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const toMillis = (v: unknown): number =>
      v && typeof v === 'object' && 'toDate' in v && typeof (v as { toDate: () => Date }).toDate === 'function'
        ? (v as { toDate: () => Date }).toDate().getTime() : 0;
    raw.sort((a, b) => toMillis((b as Record<string, unknown>).createdAt) - toMillis((a as Record<string, unknown>).createdAt));
    const products = raw as Product[];
    return products;
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

function formatOrderDoc(doc: DocumentSnapshot): Order {
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
  // NOTE: orders are created server-side only (POST /api/orders via OrdersApi).
  // Client-side creation was removed in Phase 1 (server-authoritative pricing).

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
  // NOTE: subscriptions are created server-side only (POST /api/subscriptions).

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
