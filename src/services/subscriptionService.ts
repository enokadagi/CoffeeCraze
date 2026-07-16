import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Subscription, 
  SubscriptionStatus, 
  PaymentStatus, 
  PlanItem,
  Address
} from '../types';

export class SubscriptionService {
  /**
   * Create a new subscription
   */
  static async create(
    userId: string,
    planId: string,
    items: PlanItem[],
    deliveryAddress: Address,
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly',
    paymentType: 'prepaid' | 'monthly' | 'deferred',
    startDate?: string
  ): Promise<string> {
    const nextDelivery = startDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const subscription: Partial<Subscription> = {
      userId,
      planId,
      status: SubscriptionStatus.ACTIVE,
      plan: {
        planId,
        items,
        frequency,
        nextDeliveryDate: nextDelivery,
      },
      startDate: new Date().toISOString(),
      nextDelivery,
      deliveryAddress,
      paymentSchedule: [],
      currentPaymentStatus: PaymentStatus.PENDING,
      skippedDeliveries: [],
      deliveryHistory: [],
      totalDeliveries: 0,
      completedDeliveries: 0,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'subscriptions'), subscription);
    return docRef.id;
  }

  /**
   * Get all subscriptions for a user
   */
  static async getByUserId(userId: string): Promise<Subscription[]> {
    const q = query(
      collection(db, 'subscriptions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
  }

  /**
   * Get active subscriptions for a user
   */
  static async getActiveByUserId(userId: string): Promise<Subscription[]> {
    const q = query(
      collection(db, 'subscriptions'),
      where('userId', '==', userId),
      where('status', '==', SubscriptionStatus.ACTIVE),
      orderBy('nextDelivery', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
  }

  /**
   * Get a single subscription by ID
   */
  static async getById(subscriptionId: string): Promise<Subscription | null> {
    const docRef = doc(db, 'subscriptions', subscriptionId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Subscription;
  }

  /**
   * Update subscription status
   */
  static async updateStatus(
    subscriptionId: string,
    status: SubscriptionStatus,
    reason?: string
  ): Promise<void> {
    const docRef = doc(db, 'subscriptions', subscriptionId);
    const updateData: any = { 
      status,
      updatedAt: new Date().toISOString(),
    };
    if (status === SubscriptionStatus.CANCELLED) {
      updateData.cancelledAt = new Date().toISOString();
      updateData.cancellationReason = reason;
    }
    if (status === SubscriptionStatus.PAUSED) {
      updateData.pausedUntil = reason; // Pass resume date as reason
    }
    await updateDoc(docRef, updateData);
  }

  /**
   * Pause subscription until date
   */
  static async pause(subscriptionId: string, until: string): Promise<void> {
    await this.updateStatus(subscriptionId, SubscriptionStatus.PAUSED, until);
  }

  /**
   * Resume paused subscription
   */
  static async resume(subscriptionId: string): Promise<void> {
    const docRef = doc(db, 'subscriptions', subscriptionId);
    await updateDoc(docRef, {
      status: SubscriptionStatus.ACTIVE,
      pausedUntil: null,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Skip next delivery
   */
  static async skipDelivery(subscriptionId: string): Promise<void> {
    const subscription = await this.getById(subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    const skipped = subscription.skippedDeliveries || [];
    skipped.push(subscription.nextDelivery);

    // Calculate next delivery
    const nextDelivery = this.getNextDeliveryDate(
      subscription.nextDelivery,
      subscription.plan.frequency
    );

    const docRef = doc(db, 'subscriptions', subscriptionId);
    await updateDoc(docRef, {
      skippedDeliveries: skipped,
      nextDelivery,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Update delivery address
   */
  static async updateDeliveryAddress(
    subscriptionId: string,
    address: Address
  ): Promise<void> {
    const docRef = doc(db, 'subscriptions', subscriptionId);
    await updateDoc(docRef, {
      deliveryAddress: address,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Update subscription items/plan
   */
  static async updateItems(
    subscriptionId: string,
    items: PlanItem[]
  ): Promise<void> {
    const subscription = await this.getById(subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    const docRef = doc(db, 'subscriptions', subscriptionId);
    await updateDoc(docRef, {
      'plan.items': items,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Update delivery frequency
   */
  static async updateFrequency(
    subscriptionId: string,
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  ): Promise<void> {
    const subscription = await this.getById(subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    const docRef = doc(db, 'subscriptions', subscriptionId);
    await updateDoc(docRef, {
      'plan.frequency': frequency,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Mark delivery as completed
   */
  static async completeDelivery(subscriptionId: string): Promise<void> {
    const subscription = await this.getById(subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    const history = subscription.deliveryHistory || [];
    history.push(subscription.nextDelivery);

    const nextDelivery = this.getNextDeliveryDate(
      subscription.nextDelivery,
      subscription.plan.frequency
    );

    const docRef = doc(db, 'subscriptions', subscriptionId);
    await updateDoc(docRef, {
      deliveryHistory: history,
      nextDelivery,
      completedDeliveries: (subscription.completedDeliveries || 0) + 1,
      totalDeliveries: (subscription.totalDeliveries || 0) + 1,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Get upcoming deliveries (next 7 days)
   */
  static async getUpcomingDeliveries(): Promise<Subscription[]> {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const startStr = now.toISOString().split('T')[0];
    const endStr = sevenDaysLater.toISOString().split('T')[0];

    const q = query(
      collection(db, 'subscriptions'),
      where('status', '==', SubscriptionStatus.ACTIVE),
      where('nextDelivery', '>=', startStr),
      where('nextDelivery', '<=', endStr),
      orderBy('nextDelivery', 'asc')
    );

    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
  }

  /**
   * Get overdue payment subscriptions
   */
  static async getOverduePayments(): Promise<Subscription[]> {
    const q = query(
      collection(db, 'subscriptions'),
      where('status', '==', SubscriptionStatus.ACTIVE),
      where('currentPaymentStatus', 'in', [PaymentStatus.FAILED, PaymentStatus.OVERDUE])
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
  }

  /**
   * Calculate next delivery date
   */
  private static getNextDeliveryDate(currentDate: string, frequency: string): string {
    const date = new Date(currentDate);
    const days = frequency === 'daily' ? 1 : frequency === 'weekly' ? 7 : frequency === 'biweekly' ? 14 : 30;
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  /**
   * Batch update subscriptions (admin operation)
   */
  static async batchUpdate(
    subscriptionIds: string[],
    updates: Partial<Subscription>
  ): Promise<void> {
    const batch = writeBatch(db);
    
    for (const id of subscriptionIds) {
      const docRef = doc(db, 'subscriptions', id);
      batch.update(docRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    }

    await batch.commit();
  }

  /**
   * Delete subscription (admin only)
   */
  static async delete(subscriptionId: string): Promise<void> {
    const docRef = doc(db, 'subscriptions', subscriptionId);
    await deleteDoc(docRef);
  }
}
