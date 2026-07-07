import express from 'express';
import { db } from '../../lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { sendWholesaleInquiryEmail } from '../services/emailService';
import { sanitizeInput } from './sanitize';

const router = express.Router();

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
function rateLimit(key: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

router.post('/wholesale-inquiry', async (req, res) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (!rateLimit(ip, 10, 60000)) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    const {
      businessName,
      businessType,
      estimatedVolume,
      location,
      contactPerson,
      website,
      userId,
      userEmail,
    } = req.body ?? {};

    if (!businessName || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const sanitized = {
      businessName: sanitizeInput(businessName),
      businessType: sanitizeInput(businessType ?? 'Coffee Shop'),
      estimatedVolume: sanitizeInput(estimatedVolume ?? '10-25kg / month'),
      location: sanitizeInput(location),
      contactPerson: sanitizeInput(contactPerson ?? ''),
      website: sanitizeInput(website ?? ''),
    };

    // Save to Firestore for admin tracking (preserve existing collection).
    const docRef = await addDoc(collection(db, 'wholesale_accounts'), {
      ...sanitized,
      userId: userId ?? null,
      userEmail: userEmail ?? null,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    // Send internal email.
    await sendWholesaleInquiryEmail({
      to: 'coffeecraze@nilelink.app',
      ...sanitized,
      userId,
      userEmail,
      docId: docRef.id,
    });

    return res.status(200).json({ ok: true, id: docRef.id });
  } catch (e: any) {
    console.error('wholesale-inquiry error', e);
    return res.status(500).json({ error: 'Failed to submit inquiry' });
  }
});

export default router;

