import { describe, it, expect } from 'vitest';
import { OrderService } from '../../services/firestore';
import { OrderStatus, PaymentStatus, type OrderItem } from '../../types';

const validOrder = {
  userId: 'user-1',
  items: [{ productId: 'p1', name: 'Coffee Beans', quantity: 2, price: 15, image: '' }],
  total: 30,
  totalUsd: 30,
  subtotal: 30,
  shipping: 0,
  paymentStatus: PaymentStatus.PENDING,
  paymentMethod: 'cash_on_delivery' as const,
  paymentTiming: 'deferred' as const,
  shippingAddress: { city: 'Beirut', street: 'Main St' },
  status: OrderStatus.PENDING,
};

describe('OrderService.create', () => {
  it('creates an order with valid data', async () => {
    const id = await OrderService.create(validOrder);
    expect(id).toBe('mock-id');
  });

  it('rejects order without userId', async () => {
    await expect(OrderService.create({ ...validOrder, userId: '' }))
      .rejects.toThrow('userId is required');
  });

  it('rejects order with empty items', async () => {
    await expect(OrderService.create({ ...validOrder, items: [] }))
      .rejects.toThrow('must have at least one item');
  });

  it('rejects order with negative total', async () => {
    await expect(OrderService.create({ ...validOrder, total: -1 }))
      .rejects.toThrow('Invalid order total');
  });

  it('rejects order with NaN total', async () => {
    await expect(OrderService.create({ ...validOrder, total: NaN }))
      .rejects.toThrow('Invalid order total');
  });

  it('rejects order with missing productId on item', async () => {
    const badItems = [{ name: 'No ID', quantity: 1, price: 10 }] as unknown as OrderItem[];
    await expect(OrderService.create({ ...validOrder, items: badItems }))
      .rejects.toThrow('productId and name');
  });

  it('strips undefined fields via cleanUndefined', async () => {
    await expect(OrderService.create({
      ...validOrder,
      optionalField: undefined,
    } as unknown as Parameters<typeof OrderService.create>[0])).resolves.toBe('mock-id');
  });
});
