import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Pause, Play, Edit2, MoreVertical, AlertCircle, ChevronRight
} from 'lucide-react';
import { Subscription } from '../../types';
import { cn } from '../../lib/utils';

interface SubscriptionCardProps {
  subscription: Subscription;
  onManage: (subscriptionId: string) => void;
  onEdit: (subscriptionId: string) => void;
  onPause: (subscriptionId: string) => void;
  onResume: (subscriptionId: string) => void;
}

export default function SubscriptionCard({
  subscription,
  onManage,
  onEdit,
  onPause,
  onResume,
}: SubscriptionCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paused':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return '✓';
      case 'pending':
        return '⏳';
      case 'failed':
        return '✓';
      default:
        return '?';
    }
  };

  const planName = subscription.plan?.items?.[0]?.name?.replace(/_/g, ' ') || 'Custom Plan';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-white border border-espresso/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-caramel/25 transition-all duration-300 group h-full flex flex-col"
    >
      <div className={cn(
        'absolute top-0 right-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-bl-xl border-b border-l',
        getStatusColor(subscription.status)
      )}>
        {subscription.status}
      </div>

      <div className="p-5 sm:p-6 pt-10 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-5 pb-5 border-b border-espresso/8">
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-display font-bold text-espresso mb-1 truncate">
              {planName}
            </h3>
            <p className="text-[10px] sm:text-xs text-text-secondary uppercase tracking-widest font-semibold">
              {subscription.plan?.frequency?.toUpperCase() || subscription.frequency?.toUpperCase()} delivery
            </p>
          </div>

          <div className="relative shrink-0">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-espresso/5 rounded-lg transition-colors text-espresso"
              aria-label="Subscription options"
            >
              <MoreVertical size={18} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-espresso/10 z-50 overflow-hidden"
                >
                  <button
                    onClick={() => { onEdit(subscription.id); setShowMenu(false); }}
                    className="w-full px-4 py-3 text-left text-sm text-espresso hover:bg-espresso/5 flex items-center gap-3 transition-colors"
                  >
                    <Edit2 size={16} /> Edit Plan
                  </button>
                  {subscription.status === 'active' && (
                    <button
                      onClick={() => { onPause(subscription.id); setShowMenu(false); }}
                      className="w-full px-4 py-3 text-left text-sm text-espresso hover:bg-espresso/5 flex items-center gap-3 transition-colors border-t border-espresso/8"
                    >
                      <Pause size={16} /> Pause
                    </button>
                  )}
                  {subscription.status === 'paused' && (
                    <button
                      onClick={() => { onResume(subscription.id); setShowMenu(false); }}
                      className="w-full px-4 py-3 text-left text-sm text-espresso hover:bg-espresso/5 flex items-center gap-3 transition-colors border-t border-espresso/8"
                    >
                      <Play size={16} /> Resume
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
          {[
            { label: 'Next Delivery', value: new Date(subscription.nextDelivery).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) },
            { label: 'Payment', value: `${getPaymentStatusIcon(subscription.currentPaymentStatus)} ${subscription.currentPaymentStatus}` },
            { label: 'Deliveries', value: `${subscription.completedDeliveries ?? 0}/${subscription.totalDeliveries ?? '---'}` },
          ].map((item) => (
            <div key={item.label} className="text-center p-2 sm:p-3 rounded-xl bg-cream/40 border border-espresso/5">
              <p className="text-[9px] sm:text-[10px] text-text-secondary uppercase tracking-wider font-semibold mb-1">
                {item.label}
              </p>
              <p className="text-xs sm:text-sm font-bold text-espresso capitalize truncate">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {subscription.plan?.items && subscription.plan.items.length > 0 && (
          <div className="mb-5 pb-5 border-b border-espresso/8 flex-1">
            <p className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">This cycle</p>
            <div className="space-y-1.5">
              {subscription.plan.items.slice(0, 2).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm gap-2">
                  <span className="text-text-secondary truncate">{item.name?.replace(/_/g, ' ')}</span>
                  <span className="font-semibold text-espresso shrink-0">×{item.quantity}</span>
                </div>
              ))}
              {subscription.plan.items.length > 2 && (
                <p className="text-xs text-text-muted">+{subscription.plan.items.length - 2} more items</p>
              )}
            </div>
          </div>
        )}

        {subscription.currentPaymentStatus === 'failed' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs text-red-800">
              <p className="font-bold mb-0.5">Payment issue</p>
              <p>Please update your payment method.</p>
            </div>
          </div>
        )}

        <button
          onClick={() => onManage(subscription.id)}
          className="w-full py-3 px-4 bg-espresso text-white rounded-xl font-semibold text-sm hover:bg-caramel hover:text-espresso transition-colors flex items-center justify-center gap-2 mt-auto"
        >
          Manage Plan
          <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}
