import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

export type NotificationType = 'order_updates' | 'subscription_reminders' | 'promotions';

export interface NotificationPreferences {
  pushEnabled: boolean;
  orderUpdates: boolean;
  subscriptionReminders: boolean;
  promotions: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  pushEnabled: false,
  orderUpdates: true,
  subscriptionReminders: true,
  promotions: false,
};

export const NotificationService = {
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('[Notifications] Not supported in this browser');
      return false;
    }
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  },

  sendLocalNotification(title: string, options?: NotificationOptions) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      new Notification(title, {
        icon: '/logo192.svg',
        badge: '/logo192.svg',
        ...options,
      });
    } catch (err) {
      console.warn('[Notifications] Failed to send:', err);
    }
  },

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const docSnap = await getDoc(doc(db, 'users', userId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.notificationPreferences) {
          return { ...DEFAULT_NOTIFICATION_PREFS, ...data.notificationPreferences };
        }
      }
    } catch (err) {
      console.warn('[Notifications] Failed to fetch preferences:', err);
    }
    return DEFAULT_NOTIFICATION_PREFS;
  },

  async savePreferences(userId: string, prefs: NotificationPreferences): Promise<void> {
    await updateDoc(doc(db, 'users', userId), { notificationPreferences: prefs });
  },

  async enablePush(userId: string): Promise<boolean> {
    const granted = await this.requestPermission();
    if (granted) {
      await updateDoc(doc(db, 'users', userId), {
        'notificationPreferences.pushEnabled': true,
      });
      toast.success('Push notifications enabled');
    } else {
      toast.error('Notification permission was denied');
    }
    return granted;
  },

  async disablePush(userId: string): Promise<void> {
    await updateDoc(doc(db, 'users', userId), {
      'notificationPreferences.pushEnabled': false,
    });
  },
};
