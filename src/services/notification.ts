import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getMessaging, getToken, onMessage, isSupported, type Messaging } from 'firebase/messaging';
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

let messagingInstance: Messaging | null = null;
let fcmToken: string | null = null;
let onMessageUnsubscribe: (() => void) | null = null;
let tokenRefreshInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Initialize Firebase Cloud Messaging.
 * Call this once at app startup (e.g., in App.tsx useEffect).
 */
export async function initFCM(): Promise<boolean> {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.log('[FCM] Firebase Messaging is not supported in this browser');
      return false;
    }
    messagingInstance = getMessaging();
    console.log('[FCM] Messaging initialized');
    return true;
  } catch (err) {
    console.warn('[FCM] Failed to initialize messaging:', err);
    return false;
  }
}

/**
 * Get the current FCM token.
 * Only requests permission if the user has NOT already denied it.
 * Stores the token in Firestore under users/{userId}/fcmTokens.
 * IMPORTANT: Do NOT call this in an auto-init flow (e.g. onAuthStateChanged)
 * because browsers block notification prompts not triggered by a user gesture.
 * Instead, call getFCMToken only after the user explicitly opts in via a button click.
 */
export async function getFCMToken(userId: string): Promise<string | null> {
  if (!messagingInstance) {
    const initialized = await initFCM();
    if (!initialized) return null;
  }

  try {
    // Only auto-grant if already permitted — never auto-prompt from a background flow.
    if (!('Notification' in window) || Notification.permission === 'denied') {
      console.log('[FCM] Permission previously denied or unsupported — not prompting.');
      return null;
    }
    if (Notification.permission !== 'granted') {
      // Permission not yet asked or default — cannot prompt without user gesture.
      console.log('[FCM] Permission not yet granted (default). User must click a button to enable.');
      return null;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    const currentToken = await getToken(messagingInstance!, {
      vapidKey: vapidKey || undefined,
    });

    if (currentToken) {
      fcmToken = currentToken;
      // Store token in Firestore
      await setDoc(
        doc(db, 'users', userId),
        {
          fcmTokens: { [currentToken]: true },
          notificationPreferences: { pushEnabled: true },
        },
        { merge: true }
      );
      console.log('[FCM] Token obtained and stored');
      return currentToken;
    } else {
      console.log('[FCM] No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.error('[FCM] Error getting token:', err);
    return null;
  }
}

/**
 * Listen for foreground messages.
 * Returns an unsubscribe function.
 */
export function listenForMessages(onMessageReceived: (payload: any) => void): (() => void) | null {
  if (!messagingInstance) {
    console.warn('[FCM] Messaging not initialized');
    return null;
  }

  try {
    onMessageUnsubscribe = onMessage(messagingInstance, (payload) => {
      console.log('[FCM] Foreground message received:', payload);
      onMessageReceived(payload);

      // Show a local notification if the app is in the foreground
      if (payload.notification) {
        NotificationService.sendLocalNotification(
          payload.notification.title || 'CoffeeCraze',
          {
            body: payload.notification.body || '',
            icon: payload.notification.icon || '/logo192.svg',
            ...payload.data,
          }
        );
      }
    });
    return onMessageUnsubscribe;
  } catch (err) {
    console.error('[FCM] Error setting up message listener:', err);
    return null;
  }
}

/**
 * Refresh the FCM token and persist it.
 * Can be called on auth state change or periodically.
 */
export async function refreshFCMToken(userId: string): Promise<string | null> {
  try {
    const token = await getFCMToken(userId);
    return token;
  } catch (err) {
    console.error('[FCM] Token refresh failed:', err);
    return null;
  }
}

/**
 * Remove a specific FCM token from the user's document.
 */
export async function removeFCMToken(userId: string, token: string): Promise<void> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const tokens = userDoc.data()?.fcmTokens || {};
      delete tokens[token];
      await updateDoc(doc(db, 'users', userId), { fcmTokens: tokens });
    }
  } catch (err) {
    console.error('[FCM] Failed to remove token:', err);
  }
}

/**
 * Start periodic token refresh (e.g., every 24 hours).
 */
export function startTokenRefresh(userId: string, intervalMs = 24 * 60 * 60 * 1000): void {
  stopTokenRefresh();
  tokenRefreshInterval = setInterval(() => {
    refreshFCMToken(userId);
  }, intervalMs);
}

/**
 * Stop periodic token refresh.
 */
export function stopTokenRefresh(): void {
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
    tokenRefreshInterval = null;
  }
}

/**
 * Clean up FCM listeners and intervals.
 */
export function cleanupFCM(): void {
  if (onMessageUnsubscribe) {
    onMessageUnsubscribe();
    onMessageUnsubscribe = null;
  }
  stopTokenRefresh();
}

export const NotificationService = {
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('[Notifications] Not supported in this browser');
      return false;
    }
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') {
      toast.error('Notifications are blocked. Please enable them in your browser settings.');
      return false;
    }
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      toast.success('Notifications enabled');
      return true;
    }
    if (result === 'denied') {
      toast.error('Notification permission was denied');
    }
    return false;
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
    try {
      await setDoc(doc(db, 'users', userId), { notificationPreferences: prefs }, { merge: true });
    } catch (err) {
      console.error('[Notifications] Failed to save preferences:', err);
      toast.error('Failed to save notification preferences: ' + (err as Error)?.message);
      throw err;
    }
  },

  async enablePush(userId: string): Promise<boolean> {
    const granted = await this.requestPermission();
    if (granted) {
      try {
        let token = fcmToken;
        if (!token) {
          token = await getFCMToken(userId);
        }
        if (token) {
          toast.success('Push notifications enabled');
          return true;
        }
        // Even without FCM, we have browser notification permission
        await setDoc(doc(db, 'users', userId), {
          notificationPreferences: { pushEnabled: true },
        }, { merge: true });
        toast.success('Browser notifications enabled');
        return true;
      } catch {
        toast.success('Notifications enabled');
        return true;
      }
    } else {
      toast.error('Notification permission was denied');
    }
    return granted;
  },

  async disablePush(userId: string): Promise<void> {
    try {
      await setDoc(doc(db, 'users', userId), {
        notificationPreferences: { pushEnabled: false },
      }, { merge: true });
      if (fcmToken) {
        await removeFCMToken(userId, fcmToken);
        fcmToken = null;
      }
    } catch (err) {
      console.error('[Notifications] Failed to disable push:', err);
    }
  },
};
