import { motion } from 'motion/react';
import { ChevronRight, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import { Order } from '../../types';
import { cn } from '../../lib/utils';
import { formatLBP } from '../../utils/exchange';
import { Link } from 'react-router-dom';

interface OrderHistoryProps {
  orders: Order[];
  loading?: boolean;
}

export default function OrderHistory({ orders, loading }: OrderHistoryProps) {
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: 'text-amber-600', icon: Package, label: 'Pending' },
      confirmed: { color: 'text-blue-600', icon: Truck, label: 'Confirmed' },
      processing: { color: 'text-blue-600', icon: Truck, label: 'Processing' },
      shipped: { color: 'text-blue-600', icon: Truck, label: 'Shipped' },
      delivered: { color: 'text-green-600', icon: CheckCircle, label: 'Delivered' },
      cancelled: { color: 'text-red-600', icon: XCircle, label: 'Cancelled' },
    };
    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-espresso/5 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 px-6">
        <Package size={48} className="mx-auto text-coffee-200 mb-4" />
        <p className="text-text-muted text-sm italic">No orders yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order, idx) => {
        const config = getStatusConfig(order.status);
        const StatusIcon = config.icon;

        return (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Link
              to={`/order/${order.id}`}
              className="block p-4 bg-white border border-espresso/5 rounded-xl hover:shadow-md hover:border-espresso/10 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-espresso/5 rounded-lg flex-shrink-0">
                    <Package size={18} className="text-espresso" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-espresso text-sm truncate">
                        Order #{order.id?.slice(-8) || 'N/A'}
                      </p>
                      <div className={cn('flex items-center gap-1 text-xs font-bold', config.color)}>
                        <StatusIcon size={12} />
                        {config.label}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      <span>{order.items.length} items</span>
                      <span>•</span>
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-espresso text-sm mb-1">
                    {formatLBP(order.totalLbp || order.total)}
                  </p>
                  <p className={cn('text-xs font-semibold', order.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600')}>
                    {order.paymentStatus === 'paid' ? '✓ Paid' : 'Pending'}
                  </p>
                </div>

                <ChevronRight size={18} className="text-text-muted group-hover:text-espresso transition-colors flex-shrink-0" />
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
