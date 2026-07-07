import { Order, OrderStatus } from '../../types';
import { CheckCircle, Circle, Truck, Package, Clock, XCircle, MapPin, CreditCard } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

interface Props {
  order: Order;
}

const STATUS_ORDER: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Order Received',
  confirmed: 'Confirmed',
  processing: 'Preparing',
  shipped: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrderTrackingTimeline({ order }: Props) {
  const steps = STATUS_ORDER;
  const currentIdx = STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="flex gap-1.5">
        {steps.map((s, i) => {
          const isActive = !isCancelled && currentIdx >= i;
          return (
            <div
              key={s}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-700',
                isActive ? 'bg-espresso' : 'bg-cream'
              )}
              style={{ transitionDelay: `${i * 120}ms` }}
            />
          );
        })}
      </div>

      {/* ETA */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">
          {order.deliveryDate ? (
            <>
              Estimated delivery:{' '}
              <span className="font-bold text-espresso">
                {new Date(order.deliveryDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              {order.deliveryTime && (
                <span className="text-text-muted ml-1">({order.deliveryTime})</span>
              )}
            </>
          ) : (
            'Delivery date TBD'
          )}
        </span>
        <span className="text-text-muted">
          Last update:{' '}
          {order.updatedAt
            ? new Date(order.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })
            : new Date(order.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
        </span>
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {steps.map((s, i) => {
          const status: 'completed' | 'current' | 'pending' = isCancelled
            ? 'pending'
            : currentIdx > i
              ? 'completed'
              : currentIdx === i
                ? 'current'
                : 'pending';

          return (
            <div key={s} className="flex gap-4 relative pb-8 last:pb-0">
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'absolute left-[15px] top-8 w-0.5 h-[calc(100%-8px)]',
                    status === 'completed' ? 'bg-espresso' : 'bg-cream'
                  )}
                />
              )}
              <div className="relative z-10">
                {status === 'completed' ? (
                  <div className="w-8 h-8 rounded-full bg-espresso text-white flex items-center justify-center shadow-sm">
                    <CheckCircle size={14} />
                  </div>
                ) : status === 'current' ? (
                  <div className="w-8 h-8 rounded-full border-2 border-espresso bg-white text-espresso flex items-center justify-center shadow-sm ring-4 ring-coffee-50">
                    <Circle size={12} />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full border border-coffee-200 bg-white text-text-muted flex items-center justify-center">
                    <Circle size={12} />
                  </div>
                )}
              </div>
              <div className="flex-1 pt-1">
                <p
                  className={cn(
                    'text-sm font-semibold',
                    status === 'pending' ? 'text-text-muted' : 'text-espresso'
                  )}
                >
                  {STATUS_LABELS[s]}
                </p>
                <p className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wider">
                  {status === 'completed' && order.updatedAt
                    ? new Date(order.updatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                      })
                    : status === 'current'
                      ? 'In progress'
                      : 'Pending'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="flex items-start gap-3 p-4 bg-cream/50 rounded-2xl border border-border/50">
          <MapPin size={16} className="text-caramel shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-espresso">
              {order.shippingAddress?.name || 'Delivery Address'}
            </p>
            <p className="text-[10px] text-text-muted mt-0.5">
              {order.shippingAddress?.address}, {order.shippingAddress?.city}
              {order.shippingAddress?.region ? `, ${order.shippingAddress.region}` : ''}
            </p>
            {order.gateCode && (
              <p className="text-[10px] text-text-muted mt-0.5">Gate code: {order.gateCode}</p>
            )}
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 bg-cream/50 rounded-2xl border border-border/50">
          <CreditCard size={16} className="text-caramel shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-espresso capitalize">
              {order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : order.paymentMethod}
            </p>
            <p className="text-[10px] text-text-muted mt-0.5 capitalize">
              Payment: {order.paymentStatus}
            </p>
            {order.trackingId && (
              <p className="text-[10px] text-caramel mt-0.5">Tracking: {order.trackingId}</p>
            )}
          </div>
        </div>
      </div>

      {/* Order items summary */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
          Items ({order.items.length})
        </p>
        {order.items.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 bg-white rounded-xl border border-border-light"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-cream shrink-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-espresso truncate">{item.name}</p>
                <p className="text-[10px] text-text-muted">Qty: {item.quantity}</p>
              </div>
            </div>
            <p className="text-sm font-semibold text-espresso shrink-0 ml-2">
              ${(item.price * item.quantity).toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
