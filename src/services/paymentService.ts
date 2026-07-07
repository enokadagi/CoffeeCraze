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
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Payment, PaymentLedger, PaymentStatus } from '../types';

export class PaymentService {
  /**
   * Create a new payment record
   */
  static async createPayment(
    userId: string,
    amount: number,
    amountLbp: number,
    orderId?: string,
    subscriptionId?: string,
    dueDate?: string,
    method: 'card' | 'bank_transfer' | 'cash_on_delivery' = 'cash_on_delivery'
  ): Promise<string> {
    const payment: Partial<Payment> = {
      userId,
      orderId,
      subscriptionId,
      amount,
      amountLbp,
      currency: 'USD',
      exchangeRate: amountLbp / amount,
      status: PaymentStatus.PENDING,
      method,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      retryCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'payments'), payment);
    return docRef.id;
  }

  /**
   * Record payment as paid
   */
  static async recordPayment(
    paymentId: string,
    transactionId: string,
    reference?: string
  ): Promise<void> {
    const docRef = doc(db, 'payments', paymentId);
    await updateDoc(docRef, {
      status: PaymentStatus.PAID,
      transactionId,
      reference,
      paidDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Mark payment as failed
   */
  static async recordFailure(
    paymentId: string,
    reason: string
  ): Promise<void> {
    const payment = await this.getPaymentById(paymentId);
    if (!payment) throw new Error('Payment not found');

    const retryCount = (payment.retryCount || 0) + 1;
    const nextRetryDate = this.calculateNextRetryDate(retryCount);

    const docRef = doc(db, 'payments', paymentId);
    await updateDoc(docRef, {
      status: retryCount >= 3 ? PaymentStatus.OVERDUE : PaymentStatus.FAILED,
      failureReason: reason,
      retryCount,
      nextRetryDate: retryCount < 3 ? nextRetryDate : undefined,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Get payment by ID
   */
  static async getPaymentById(paymentId: string): Promise<Payment | null> {
    const docRef = doc(db, 'payments', paymentId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Payment;
  }

  /**
   * Get all payments for a user
   */
  static async getPaymentsByUserId(userId: string): Promise<Payment[]> {
    const q = query(
      collection(db, 'payments'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
  }

  /**
   * Get pending payments for a user
   */
  static async getPendingPaymentsByUserId(userId: string): Promise<Payment[]> {
    const q = query(
      collection(db, 'payments'),
      where('userId', '==', userId),
      where('status', 'in', [PaymentStatus.PENDING, PaymentStatus.FAILED, PaymentStatus.OVERDUE])
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
  }

  /**
   * Get overdue payments
   */
  static async getOverduePayments(): Promise<Payment[]> {
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'payments'),
      where('status', 'in', [PaymentStatus.OVERDUE, PaymentStatus.FAILED]),
      where('dueDate', '<=', today)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
  }

  /**
   * Get or create payment ledger for user
   */
  static async getLedger(userId: string): Promise<PaymentLedger> {
    // Try to get existing ledger
    const q = query(
      collection(db, 'paymentLedgers'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as PaymentLedger;
    }

    // Create new ledger if it doesn't exist
    const ledger: Partial<PaymentLedger> = {
      userId,
      totalDue: 0,
      totalDueLbp: 0,
      totalPaid: 0,
      totalPaidLbp: 0,
      overdue: 0,
      overdueLbp: 0,
      pending: 0,
      pendingLbp: 0,
      paymentHistory: [],
      status: 'current',
    };

    const docRef = await addDoc(collection(db, 'paymentLedgers'), ledger);
    return { id: docRef.id, ...ledger } as PaymentLedger;
  }

  /**
   * Update payment ledger (called when payment status changes)
   */
  static async updateLedger(userId: string): Promise<void> {
    const ledger = await this.getLedger(userId);
    const payments = await this.getPaymentsByUserId(userId);

    let totalDue = 0;
    let totalDueLbp = 0;
    let totalPaid = 0;
    let totalPaidLbp = 0;
    let overdue = 0;
    let overdueLbp = 0;
    let pending = 0;
    let pendingLbp = 0;
    const today = new Date().toISOString().split('T')[0];

    payments.forEach(payment => {
      if (payment.status === PaymentStatus.PAID) {
        totalPaid += payment.amount;
        totalPaidLbp += payment.amountLbp;
      } else {
        totalDue += payment.amount;
        totalDueLbp += payment.amountLbp;

        if (payment.dueDate <= today) {
          overdue += payment.amount;
          overdueLbp += payment.amountLbp;
        } else {
          pending += payment.amount;
          pendingLbp += payment.amountLbp;
        }
      }
    });

    const status = overdue > 0 ? 'overdue' : totalDue > 0 ? 'pending' : 'current';

    const docRef = doc(db, 'paymentLedgers', ledger.id!);
    await updateDoc(docRef, {
      totalDue,
      totalDueLbp,
      totalPaid,
      totalPaidLbp,
      overdue,
      overdueLbp,
      pending,
      pendingLbp,
      paymentHistory: payments,
      lastPaymentDate: payments.find(p => p.status === PaymentStatus.PAID)?.paidDate,
      nextDueDate: payments.find(p => p.status === PaymentStatus.PENDING)?.dueDate,
      status,
    });
  }

  /**
   * Get payments by order ID
   */
  static async getPaymentsByOrderId(orderId: string): Promise<Payment[]> {
    const q = query(
      collection(db, 'payments'),
      where('orderId', '==', orderId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
  }

  /**
   * Get payments by subscription ID
   */
  static async getPaymentsBySubscriptionId(subscriptionId: string): Promise<Payment[]> {
    const q = query(
      collection(db, 'payments'),
      where('subscriptionId', '==', subscriptionId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
  }

  /**
   * Calculate next retry date based on retry count
   */
  private static calculateNextRetryDate(retryCount: number): string {
    const date = new Date();
    const days = retryCount === 1 ? 3 : retryCount === 2 ? 7 : 14;
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  /**
   * Batch update payments (admin operation)
   */
  static async batchUpdate(
    paymentIds: string[],
    updates: Partial<Payment>
  ): Promise<void> {
    const batch = writeBatch(db);

    for (const id of paymentIds) {
      const docRef = doc(db, 'payments', id);
      batch.update(docRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    }

    await batch.commit();
  }

  /**
   * Generate invoice PDF URL (requires third-party PDF service integration)
   */
  static async generateInvoice(paymentId: string): Promise<string> {
    throw new Error('Invoice generation not yet configured. Integrate a PDF service (e.g. Cloud Functions + PDFKit) before going live.');
  }
}
