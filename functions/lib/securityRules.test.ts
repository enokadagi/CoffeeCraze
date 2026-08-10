import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * Regression guards on the DEPLOYED security rules source (firestore.rules,
 * storage.rules). These assert textual invariants so that future edits cannot
 * silently weaken the F1/F2/F3 protections. They are intentionally brittle:
 * any change to the guarded strings forces a deliberate review.
 */

const firestoreRules = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
const storageRules = readFileSync(resolve(process.cwd(), 'storage.rules'), 'utf8');

function section(name: string): string {
  const start = firestoreRules.indexOf(`function ${name}`);
  const next = firestoreRules.indexOf('function ', start + 1);
  if (start < 0) throw new Error(`rules function ${name} not found`);
  return firestoreRules.slice(start, next > start ? next : undefined);
}

function matchBlock(path: string): string {
  const start = firestoreRules.indexOf(`match /${path}`);
  if (start < 0) throw new Error(`match /${path} not found`);
  return firestoreRules.slice(start);
}

/* ------------------------------------------------------------------ */
/* F3 — customers cannot write business/accounting values              */
/* ------------------------------------------------------------------ */

describe('F3 — owner profile update keeps business values server-side', () => {
  const ownerUpdate = section('isOwnerProfileUpdate');
  const scope = matchBlock('users/{userId}');

  it('loyaltyPoints and totalSpent are NOT owner-updatable', () => {
    expect(ownerUpdate).not.toContain('loyaltyPoints');
    expect(ownerUpdate).not.toContain('totalSpent');
  });

  it('role, permissions and status are immutable on owner update', () => {
    expect(ownerUpdate).toContain("incoming().get('role', null) == existing().get('role', null)");
    expect(ownerUpdate).toContain("incoming().get('permissions', []) == existing().get('permissions', [])");
    expect(ownerUpdate).toContain("incoming().get('status', null) == existing().get('status', null)");
  });

  it('non-owner updates require admin (no client role changes)', () => {
    expect(scope).toContain("allow update: if isAdmin() || (request.auth.uid == userId && isOwnerProfileUpdate());");
  });

  it('orders/payments/subscriptions/coupons create and delete are server-closed to clients', () => {
    expect(firestoreRules).toContain("match /orders/{orderId}");
    expect(firestoreRules).toContain("allow create: if false;");
    expect(firestoreRules).toContain("allow delete: if false;");
    expect(firestoreRules).toContain("match /payments/{paymentId}");
    expect(firestoreRules).toContain("match /paymentLedgers/{ledgerId}");
    expect(firestoreRules).toContain("match /subscriptions/{subId}");
    expect(firestoreRules).toContain("match /coupons/{couponId}");
  });
});

/* ------------------------------------------------------------------ */
/* F2 — driver delivery gate                                           */
/* ------------------------------------------------------------------ */

describe('F2 — driver updates require the order to be out_for_delivery', () => {
  const driverUpdate = section('isDriverOrderUpdate');

  it('driver rule exists and pins existing status to out_for_delivery', () => {
    expect(driverUpdate).toContain("existing().get('status', '') == 'out_for_delivery'");
    expect(driverUpdate).toContain("existing().get('driverId', '') == request.auth.uid");
  });

  it('driver can only ever set status to delivered', () => {
    expect(driverUpdate).toContain("incoming().status == 'delivered'");
  });

  it('driver COD amount must equal the authoritative order total', () => {
    expect(driverUpdate).toContain("incoming().codAmountCollected == existing().get('totalLbp', existing().get('total', 0))");
  });
});

/* ------------------------------------------------------------------ */
/* F1 — least-privilege staff order-status matrix                      */
/* ------------------------------------------------------------------ */

describe('F1 — staff order status is role-authorized, not blanket isStaff', () => {
  const staffUpdate = section('isStaffOrderUpdate');

  it('isStaffOrderUpdate no longer grants all staff every status transition', () => {
    expect(staffUpdate).not.toContain('isStaff()');
    expect(staffUpdate).toContain('isOrderTransitionAuthorized(existing().status, incoming().status)');
  });

  it('role sets match the stateMachine source of truth', () => {
    expect(firestoreRules).toContain("isSignedIn() && getUserRole() in ['super_admin', 'owner', 'admin', 'manager']");
    expect(firestoreRules).toContain("'customer_service', 'support']");
    expect(firestoreRules).toContain("'inventory', 'warehouse', 'barista', 'supplier_manager']");
  });

  it('support cannot mark delivered; fulfillment cannot cancel or deliver', () => {
    expect(firestoreRules).toContain("(isOrderSupport() && to != 'delivered')");
    expect(firestoreRules).toContain("(isFulfillmentWorker() && to in ['processing', 'preparing', 'ready', 'shipped', 'out_for_delivery'])");
  });

  it('payment and COD fields remain financial-role-only', () => {
    expect(staffUpdate).toContain("isAdminOrAccounting() && isValidPaymentTransition(existing().get('paymentStatus', 'pending'), incoming().paymentStatus)");
    expect(staffUpdate).toContain("(!('codAmountCollected' in incoming()) || isAdminOrAccounting())");
    expect(staffUpdate).toContain("(!('driverId' in incoming()) || isAdmin())");
  });

  it('customers can never self-elevate to staff/admin roles or seed business values on create', () => {
    expect(matchBlock('users/{userId}')).toContain(
      "allow create: if isSignedIn() && request.auth.uid == userId" +
      "\n        && (!('role' in incoming()) || incoming().role == 'customer')" +
      "\n        && !('permissions' in incoming()) && !('status' in incoming())" +
      "\n        && (!('loyaltyPoints' in incoming()) || incoming().loyaltyPoints == 0)" +
      "\n        && (!('totalSpent' in incoming()) || incoming().totalSpent == 0);"
    );
  });
});

/* ------------------------------------------------------------------ */
/* Storage                                                            */
/* ------------------------------------------------------------------ */

describe('storage.rules — no client money surface', () => {
  it('default is read-only; all writes are role-gated and image-validated', () => {
    expect(storageRules).toContain("allow read: if true;");
    expect(storageRules).toContain("allow write: if false;");
    expect(storageRules).toContain("isValidImageUpload()");
    expect(storageRules).toContain("firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role");
  });

  it('staff/owner/admin write gates exist per bucket family', () => {
    expect(storageRules).toContain("match /products/{allPaths=**}");
    expect(storageRules).toContain("match /site/{allPaths=**}");
    expect(storageRules).toContain("match /uploads/{userId}/{allPaths=**}");
    expect(storageRules).toContain("allow read: if isSignedIn() && request.auth.uid == userId;");
  });
});