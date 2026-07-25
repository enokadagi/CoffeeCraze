import { collection, doc, getDoc, getDocs, updateDoc, query, where, orderBy, limit, addDoc, serverTimestamp, onSnapshot, Unsubscribe, type DocumentSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Order, Subscription, Plan } from '../types';
import { cleanUndefined } from '../lib/utils';

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
  async create(order: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
    if (!order.userId) throw new Error('userId is required');
    if (!order.items?.length) throw new Error('Order must have at least one item');
    if (typeof order.total !== 'number' || !Number.isFinite(order.total) || order.total < 0) throw new Error('Invalid order total');
    if (order.items.some(i => !i.productId || !i.name)) throw new Error('Each item must have productId and name');
    const docRef = await addDoc(collection(db, 'orders'), cleanUndefined({
      ...order,
      createdAt: serverTimestamp(),
      status: 'pending'
    }));
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
  async create(sub: Record<string, unknown>): Promise<string> {
    const docRef = await addDoc(collection(db, 'subscriptions'), cleanUndefined({
      ...sub,
      createdAt: serverTimestamp(),
      status: 'active'
    }));
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
