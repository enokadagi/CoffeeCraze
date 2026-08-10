import { describe, it, expect } from 'vitest';
import {
  ORDER_TRANSITIONS,
  ORDER_STATUSES,
  isValidTransition,
  isTerminal,
  isValidPaymentTransition,
  isValidSubscriptionTransition,
  canOrderTransitionByRole,
  canRecordPayment,
  canDriverDeliver,
  canAssignDriver,
} from './stateMachine';

describe('ORDER_TRANSITIONS', () => {
  it('only references declared statuses and declares no self-transitions', () => {
    for (const [from, to] of ORDER_TRANSITIONS) {
      expect(ORDER_STATUSES).toContain(from);
      expect(ORDER_STATUSES).toContain(to);
      expect(from).not.toBe(to);
    }
  });

  it('matches the canonical progression exactly', () => {
    expect(ORDER_TRANSITIONS).toEqual([
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
    ]);
  });
});

describe('isValidTransition', () => {
  it('accepts happy-path progression', () => {
    expect(isValidTransition('pending', 'confirmed')).toBe(true);
    expect(isValidTransition('confirmed', 'processing')).toBe(true);
    expect(isValidTransition('processing', 'preparing')).toBe(true);
    expect(isValidTransition('preparing', 'ready')).toBe(true);
    expect(isValidTransition('ready', 'shipped')).toBe(true);
    expect(isValidTransition('ready', 'out_for_delivery')).toBe(true);
    expect(isValidTransition('out_for_delivery', 'delivered')).toBe(true);
  });

  it('accepts cancellation from every pre-terminal state except shipped', () => {
    const cancelable = ['pending', 'confirmed', 'processing', 'preparing', 'ready', 'out_for_delivery'];
    for (const from of cancelable) {
      expect(isValidTransition(from, 'cancelled')).toBe(true);
    }
    expect(isValidTransition('shipped', 'cancelled')).toBe(false);
  });

  it('rejects skips, reversals, and unknown states', () => {
    expect(isValidTransition('pending', 'delivered')).toBe(false);
    expect(isValidTransition('delivered', 'pending')).toBe(false);
    expect(isValidTransition('delivered', 'ready')).toBe(false);
    expect(isValidTransition('cancelled', 'confirmed')).toBe(false);
    expect(isValidTransition('delivered', 'cancelled')).toBe(false);
    expect(isValidTransition('pending', 'whatever')).toBe(false);
    expect(isValidTransition('mystery', 'pending')).toBe(false);
  });
});

describe('isTerminal', () => {
  it('delivered and cancelled are terminal', () => {
    expect(isTerminal('delivered')).toBe(true);
    expect(isTerminal('cancelled')).toBe(true);
    expect(isTerminal('ready')).toBe(false);
    expect(isTerminal('pending')).toBe(false);
  });
});

describe('isValidPaymentTransition', () => {
  it('pending -> collected is the COD settlement path', () => {
    expect(isValidPaymentTransition('pending', 'collected')).toBe(true);
  });
  it('collected is only reversible via refund', () => {
    expect(isValidPaymentTransition('collected', 'refunded')).toBe(true);
    expect(isValidPaymentTransition('collected', 'pending')).toBe(false);
    expect(isValidPaymentTransition('collected', 'failed')).toBe(false);
  });
  it('failed can be retried to collected or refunded', () => {
    expect(isValidPaymentTransition('failed', 'collected')).toBe(true);
    expect(isValidPaymentTransition('failed', 'refunded')).toBe(true);
    expect(isValidPaymentTransition('failed', 'pending')).toBe(false);
  });
  it('pending can fail or refund (pre-paid cancellations)', () => {
    expect(isValidPaymentTransition('pending', 'failed')).toBe(true);
    expect(isValidPaymentTransition('pending', 'refunded')).toBe(true);
  });
  it('refunded is terminal', () => {
    expect(isValidPaymentTransition('refunded', 'pending')).toBe(false);
    expect(isValidPaymentTransition('refunded', 'collected')).toBe(false);
  });
  it('rejects unknown states and legacy statuses', () => {
    expect(isValidPaymentTransition('pending', 'paid')).toBe(false);
    expect(isValidPaymentTransition('whatever', 'collected')).toBe(false);
  });
});

describe('isValidSubscriptionTransition', () => {
  it('active can pause or cancel', () => {
    expect(isValidSubscriptionTransition('active', 'paused')).toBe(true);
    expect(isValidSubscriptionTransition('active', 'cancelled')).toBe(true);
    expect(isValidSubscriptionTransition('active', 'active')).toBe(false);
  });
  it('paused can resume or cancel', () => {
    expect(isValidSubscriptionTransition('paused', 'active')).toBe(true);
    expect(isValidSubscriptionTransition('paused', 'cancelled')).toBe(true);
  });
  it('cancelled is terminal', () => {
    expect(isValidSubscriptionTransition('cancelled', 'active')).toBe(false);
    expect(isValidSubscriptionTransition('cancelled', 'paused')).toBe(false);
  });
  it('rejects unknown states', () => {
    expect(isValidSubscriptionTransition('active', 'whatever')).toBe(false);
    expect(isValidSubscriptionTransition('whatever', 'paused')).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* F1 — least-privilege order-status role matrix                       */
/* ------------------------------------------------------------------ */

describe('canOrderTransitionByRole (F1)', () => {
  const top = ['super_admin', 'owner', 'admin', 'manager'];
  const support = ['customer_service', 'support'];
  const fulfillment = ['inventory', 'warehouse', 'barista', 'supplier_manager'];
  const noOrderAuthority = ['accounting', 'product_manager', 'marketing', 'analyst', 'wholesale_manager', 'wholesale', 'customer', 'driver', ''];

const stagingTransitions = [
    ['confirmed', 'processing'],
    ['processing', 'preparing'],
    ['preparing', 'ready'],
    ['ready', 'shipped'],
    ['ready', 'out_for_delivery'],
    ['shipped', 'out_for_delivery'],
  ] as const;

  it('fulfillment roles may only stage orders — never confirm, cancel, or deliver', () => {
    for (const role of fulfillment) {
      for (const [from, to] of stagingTransitions) {
        expect(canOrderTransitionByRole(role, from, to), `${role} ${from}->${to}`).toBe(true);
      }
      expect(canOrderTransitionByRole(role, 'pending', 'confirmed')).toBe(false);
      expect(canOrderTransitionByRole(role, 'pending', 'cancelled')).toBe(false);
      expect(canOrderTransitionByRole(role, 'ready', 'cancelled')).toBe(false);
      expect(canOrderTransitionByRole(role, 'out_for_delivery', 'cancelled')).toBe(false);
      expect(canOrderTransitionByRole(role, 'out_for_delivery', 'delivered')).toBe(false);
    }
  });

  it('support roles may perform non-financial transitions but never final delivery', () => {
    for (const role of support) {
      for (const [from, to] of ORDER_TRANSITIONS) {
        const expected = to !== 'delivered';
        expect(canOrderTransitionByRole(role, from, to), `${role} ${from}->${to}`).toBe(expected);
      }
      expect(canOrderTransitionByRole(role, 'out_for_delivery', 'delivered')).toBe(false);
      expect(canOrderTransitionByRole(role, 'pending', 'cancelled')).toBe(true);
    }
  });

  it('fulfillment roles may only stage orders — never cancel, never deliver', () => {
    for (const role of fulfillment) {
      for (const [from, to] of stagingTransitions) {
        expect(canOrderTransitionByRole(role, from, to), `${role} ${from}->${to}`).toBe(true);
      }
      expect(canOrderTransitionByRole(role, 'pending', 'cancelled')).toBe(false);
      expect(canOrderTransitionByRole(role, 'ready', 'cancelled')).toBe(false);
      expect(canOrderTransitionByRole(role, 'out_for_delivery', 'cancelled')).toBe(false);
      expect(canOrderTransitionByRole(role, 'out_for_delivery', 'delivered')).toBe(false);
    }
  });

  it('accounting has NO order-status authority (financial operations only)', () => {
    for (const [from, to] of ORDER_TRANSITIONS) {
      expect(canOrderTransitionByRole('accounting', from, to)).toBe(false);
    }
  });

  it('product_manager, marketing, analyst, wholesale_manager get no order-status authority', () => {
    for (const role of ['product_manager', 'marketing', 'analyst', 'wholesale_manager']) {
      for (const [from, to] of ORDER_TRANSITIONS) {
        expect(canOrderTransitionByRole(role, from, to), `${role} ${from}->${to}`).toBe(false);
      }
    }
  });

  it('customers and drivers cannot use the staff path at all', () => {
    for (const [from, to] of ORDER_TRANSITIONS) {
      expect(canOrderTransitionByRole('customer', from, to)).toBe(false);
      expect(canOrderTransitionByRole('driver', from, to)).toBe(false);
    }
  });

  it('rejects unknown roles and invalid transitions for every role', () => {
    for (const role of [...top, ...support, ...fulfillment, ...noOrderAuthority]) {
      expect(canOrderTransitionByRole(role, 'delivered', 'pending')).toBe(false);
      expect(canOrderTransitionByRole(role, 'pending', 'delivered')).toBe(false);
      expect(canOrderTransitionByRole(role, 'pending', 'mystery')).toBe(false);
    }
    expect(canOrderTransitionByRole(null, 'pending', 'confirmed')).toBe(false);
    expect(canOrderTransitionByRole(undefined, 'pending', 'confirmed')).toBe(false);
  });
});

describe('canRecordPayment (F1 financial gate)', () => {
  it('only financial roles may record payment/COD events', () => {
    for (const role of ['super_admin', 'owner', 'admin', 'manager', 'accounting']) {
      expect(canRecordPayment(role)).toBe(true);
    }
    for (const role of ['customer_service', 'inventory', 'warehouse', 'barista', 'supplier_manager', 'product_manager', 'marketing', 'analyst', 'wholesale_manager', 'customer', 'driver']) {
      expect(canRecordPayment(role)).toBe(false);
    }
    expect(canRecordPayment(null)).toBe(false);
  });
});

describe('canAssignDriver', () => {
  it('driver assignment is admin-only', () => {
    for (const role of ['super_admin', 'owner', 'admin']) expect(canAssignDriver(role)).toBe(true);
    for (const role of ['manager', 'accounting', 'customer_service', 'inventory', 'wholesale_manager', 'customer']) expect(canAssignDriver(role)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* F2 — driver delivery gate                                           */
/* ------------------------------------------------------------------ */

describe('canDriverDeliver (F2)', () => {
  it('allowed only when the order is out_for_delivery', () => {
    expect(canDriverDeliver('out_for_delivery', true)).toBe(true);
  });
  it('denied from every other state', () => {
    for (const state of ['pending', 'confirmed', 'processing', 'preparing', 'ready', 'shipped', 'delivered', 'cancelled']) {
      expect(canDriverDeliver(state, true), `driver delivering from ${state}`).toBe(false);
    }
  });
  it('denied for unassigned drivers', () => {
    expect(canDriverDeliver('out_for_delivery', false)).toBe(false);
  });
});
