/**
 * Order lifecycle state machine — server + rules enforce the same transitions.
 * This table is the single source of truth; keep firestore.rules in sync.
 */

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'preparing',
  'ready',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ['pending', 'collected', 'failed', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Allowed status transitions. `from` -> `to`. */
export const ORDER_TRANSITIONS: Array<[OrderStatus, OrderStatus]> = [
  ['pending', 'confirmed'],
  ['pending', 'cancelled'],
  ['confirmed', 'processing'],
  ['confirmed', 'cancelled'],
  ['processing', 'preparing'],
  ['processing', 'cancelled'],
  ['preparing', 'ready'],
  ['preparing', 'cancelled'],
  ['ready', 'shipped'],
  ['ready', 'out_for_delivery'],
  ['ready', 'cancelled'],
  ['shipped', 'out_for_delivery'],
  ['out_for_delivery', 'delivered'],
  ['out_for_delivery', 'cancelled'],
];

export function isValidTransition(from: string, to: string): boolean {
  return ORDER_TRANSITIONS.some(([f, t]) => f === from && t === to);
}

export function isTerminal(status: string): boolean {
  return status === 'delivered' || status === 'cancelled';
}

/** Payment may move from pending to collected/failed/refunded; never back. */
export function isValidPaymentTransition(from: string, to: string): boolean {
  const validTo: Record<string, string[]> = {
    pending: ['collected', 'failed', 'refunded'],
    collected: ['refunded'],
    failed: ['collected', 'refunded'],
    refunded: [],
  };
  return (validTo[from] ?? []).includes(to);
}

/** Subscription status transitions (customer + staff). */
export const SUBSCRIPTION_TRANSITIONS: Array<[string, string]> = [
  ['active', 'paused'],
  ['active', 'cancelled'],
  ['paused', 'active'],
  ['paused', 'cancelled'],
];

export function isValidSubscriptionTransition(from: string, to: string): boolean {
  return SUBSCRIPTION_TRANSITIONS.some(([f, t]) => f === from && t === to);
}

/**
 * Least-privilege order-status authorization (F1).
 * Single source of truth for WHO may perform WHICH transitions —
 * `firestore.rules` mirrors this matrix.
 */

/** Top operational roles: every state-machine transition. */
export const ORDER_OPS_TOP = ['super_admin', 'owner', 'admin', 'manager'] as const;

/** Customer/order support roles: all non-financial transitions except final delivery. */
export const ORDER_SUPPORT = [
  'super_admin', 'owner', 'admin', 'manager', 'customer_service', 'support',
] as const;

/** Fulfillment roles: staging transitions only (never cancel/deliver, never finance). */
export const FULFILLMENT_WORKERS = [
  'super_admin', 'owner', 'admin', 'manager', 'inventory', 'warehouse', 'barista', 'supplier_manager',
] as const;

/** Roles trusted to record money events (COD collection, refunds, payment status). */
export const FINANCIAL_ROLES = [
  'super_admin', 'owner', 'admin', 'manager', 'accounting',
] as const;

/** Admin roles that may assign drivers. */
export const DRIVER_ASSIGNMENT_ROLES = ['super_admin', 'owner', 'admin'] as const;

const FULFILLMENT_TARGETS: ReadonlySet<string> = new Set([
  'processing', 'preparing', 'ready', 'shipped', 'out_for_delivery',
]);

function roleIn(role: string | null | undefined, allowed: readonly string[]): boolean {
  return role != null && (allowed as readonly string[]).includes(role);
}

/**
 * Whether `role` may move an order through `from -> to`.
 * Falls back to strict deny for unknown/privileged-but-unrelated roles;
 * `accounting` is intentionally absent (financial operations only),
 * as are `product_manager`, `marketing`, `analyst`, `wholesale_manager`,
 * `customer`, `driver` (driver has its own delivery gate).
 */
export function canOrderTransitionByRole(
  role: string | null | undefined,
  from: string,
  to: string,
): boolean {
  if (!isValidTransition(from, to)) return false;
  if (roleIn(role, ORDER_OPS_TOP)) return true;
  if (roleIn(role, ORDER_SUPPORT)) return to !== 'delivered';
  if (roleIn(role, FULFILLMENT_WORKERS)) return FULFILLMENT_TARGETS.has(to);
  return false;
}

/** Payment/COD events are reserved for financial roles. */
export function canRecordPayment(role: string | null | undefined): boolean {
  return roleIn(role, FINANCIAL_ROLES);
}

/** Driver may only mark an order delivered once it is out_for_delivery (F2). */
export function canDriverDeliver(currentStatus: string, isAssignedDriver: boolean): boolean {
  return isAssignedDriver && currentStatus === 'out_for_delivery';
}

/** Driver may only be (re)assigned by admin roles. */
export function canAssignDriver(role: string | null | undefined): boolean {
  return roleIn(role, DRIVER_ASSIGNMENT_ROLES);
}
