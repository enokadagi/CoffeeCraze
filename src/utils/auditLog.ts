import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function logAdminAction(
  userId: string,
  userEmail: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: Record<string, unknown>
) {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      userId,
      userEmail,
      action,
      targetType,
      targetId,
      details: details || {},
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
