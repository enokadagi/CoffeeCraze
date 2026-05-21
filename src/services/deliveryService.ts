import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Delivery, DeliveryStatus, OrderItem, Address } from '../types';

export class DeliveryService {
  /**
   * Create a new delivery record
   */
  static async createDelivery(
    orderId: string,
    userId: string,
    items: OrderItem[],
    address: Address,
    scheduledDate: string,
    scheduledTimeWindow?: string,
    instructions?: string,
    subscriptionId?: string
  ): Promise<string> {
    const delivery: Partial<Delivery> = {
      orderId,
      subscriptionId,
      userId,
      items,
      status: DeliveryStatus.SCHEDULED,
      scheduledDate,
      scheduledTimeWindow,
      address,
      instructions,
      attempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'deliveries'), delivery);
    return docRef.id;
  }

  /**
   * Get delivery by ID
   */
  static async getById(deliveryId: string): Promise<Delivery | null> {
    const docRef = doc(db, 'deliveries', deliveryId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Delivery;
  }

  /**
   * Get deliveries for a user
   */
  static async getByUserId(userId: string): Promise<Delivery[]> {
    const q = query(
      collection(db, 'deliveries'),
      where('userId', '==', userId),
      orderBy('scheduledDate', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Delivery));
  }

  /**
   * Get upcoming deliveries for a user
   */
  static async getUpcomingByUserId(userId: string): Promise<Delivery[]> {
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'deliveries'),
      where('userId', '==', userId),
      where('scheduledDate', '>=', today),
      where('status', 'in', [DeliveryStatus.SCHEDULED, DeliveryStatus.IN_TRANSIT, DeliveryStatus.OUT_FOR_DELIVERY]),
      orderBy('scheduledDate', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Delivery));
  }

  /**
   * Get deliveries by status
   */
  static async getByStatus(status: DeliveryStatus): Promise<Delivery[]> {
    const q = query(
      collection(db, 'deliveries'),
      where('status', '==', status),
      orderBy('scheduledDate', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Delivery));
  }

  /**
   * Get deliveries scheduled for a specific date
   */
  static async getByScheduledDate(date: string): Promise<Delivery[]> {
    const q = query(
      collection(db, 'deliveries'),
      where('scheduledDate', '==', date),
      orderBy('scheduledTimeWindow', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Delivery));
  }

  /**
   * Get deliveries by order ID
   */
  static async getByOrderId(orderId: string): Promise<Delivery[]> {
    const q = query(
      collection(db, 'deliveries'),
      where('orderId', '==', orderId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Delivery));
  }

  /**
   * Get deliveries by subscription ID
   */
  static async getBySubscriptionId(subscriptionId: string): Promise<Delivery[]> {
    const q = query(
      collection(db, 'deliveries'),
      where('subscriptionId', '==', subscriptionId),
      orderBy('scheduledDate', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Delivery));
  }

  /**
   * Update delivery status
   */
  static async updateStatus(
    deliveryId: string,
    status: DeliveryStatus,
    details?: {
      actualDeliveryDate?: string;
      driverName?: string;
      driverPhone?: string;
      proof?: string;
      failureReason?: string;
    }
  ): Promise<void> {
    const docRef = doc(db, 'deliveries', deliveryId);
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (status === DeliveryStatus.IN_TRANSIT) {
      updateData.inTransitAt = new Date().toISOString();
    }

    if (status === DeliveryStatus.OUT_FOR_DELIVERY) {
      updateData.outForDeliveryAt = new Date().toISOString();
      if (details?.driverName) updateData.driverName = details.driverName;
      if (details?.driverPhone) updateData.driverPhone = details.driverPhone;
    }

    if (status === DeliveryStatus.DELIVERED) {
      updateData.actualDeliveryDate = details?.actualDeliveryDate || new Date().toISOString();
      if (details?.proof) updateData.proof = details.proof;
    }

    if (status === DeliveryStatus.FAILED) {
      updateData.attempts = (await this.getById(deliveryId))?.attempts! + 1 || 1;
      if (details?.failureReason) updateData.failureReason = details.failureReason;
    }

    await updateDoc(docRef, updateData);
  }

  /**
   * Reschedule delivery
   */
  static async reschedule(
    deliveryId: string,
    newDate: string,
    newTimeWindow?: string,
    reason?: string
  ): Promise<void> {
    const docRef = doc(db, 'deliveries', deliveryId);
    await updateDoc(docRef, {
      scheduledDate: newDate,
      ...(newTimeWindow && { scheduledTimeWindow: newTimeWindow }),
      updatedAt: new Date().toISOString(),
      rescheduledAt: new Date().toISOString(),
      rescheduleReason: reason,
    });
  }

  /**
   * Add driver assignment
   */
  static async assignDriver(
    deliveryId: string,
    driverName: string,
    driverPhone: string,
    trackingUrl?: string
  ): Promise<void> {
    const docRef = doc(db, 'deliveries', deliveryId);
    await updateDoc(docRef, {
      driverName,
      driverPhone,
      ...(trackingUrl && { trackingUrl }),
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Get todays pending deliveries (for admin dashboard)
   */
  static async getTodaysPendingDeliveries(): Promise<Delivery[]> {
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'deliveries'),
      where('scheduledDate', '==', today),
      where('status', 'in', [DeliveryStatus.SCHEDULED, DeliveryStatus.IN_TRANSIT, DeliveryStatus.OUT_FOR_DELIVERY]),
      orderBy('scheduledTimeWindow', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Delivery));
  }

  /**
   * Get failed deliveries (for retry)
   */
  static async getFailedDeliveries(): Promise<Delivery[]> {
    const q = query(
      collection(db, 'deliveries'),
      where('status', '==', DeliveryStatus.FAILED),
      orderBy('updatedAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Delivery));
  }

  /**
   * Get delivery rate (successful vs total)
   */
  static async getDeliveryStats(timeframeInDays: number = 30): Promise<{
    total: number;
    delivered: number;
    failed: number;
    rate: number;
  }> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - timeframeInDays);
    const fromDateStr = fromDate.toISOString().split('T')[0];

    const q = query(
      collection(db, 'deliveries'),
      where('scheduledDate', '>=', fromDateStr)
    );
    const snap = await getDocs(q);
    const deliveries = snap.docs.map(doc => doc.data() as Delivery);

    const total = deliveries.length;
    const delivered = deliveries.filter(d => d.status === DeliveryStatus.DELIVERED).length;
    const failed = deliveries.filter(d => d.status === DeliveryStatus.FAILED).length;
    const rate = total > 0 ? (delivered / total) * 100 : 0;

    return { total, delivered, failed, rate };
  }

  /**
   * Export deliveries for reporting
   */
  static async exportDeliveries(startDate: string, endDate: string): Promise<Delivery[]> {
    const q = query(
      collection(db, 'deliveries'),
      where('scheduledDate', '>=', startDate),
      where('scheduledDate', '<=', endDate),
      orderBy('scheduledDate', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Delivery));
  }
}
