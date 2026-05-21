import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Pause, Play, Edit2, Calendar, Truck, CreditCard, 
  ChevronRight, MoreVertical, X, AlertCircle
} from 'lucide-react';
import { Subscription } from '../../types';
import { cn } from '../../lib/utils';
import { formatLBP, formatUSD } from '../../utils/exchange';

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
        return 'bg-green-100 text-green-700 border-green-200';
      case 'paused':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return '✓';
      case 'pending':
        return '⏱';
      case 'failed':
        return '✕';
      default:
        return '?';
    }
  };

  const isUpcoming = new Date(subscription.nextDelivery) > new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-white rounded-2xl border border-espresso/5 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
    >
      {/* Status Badge */}
      <div className={cn(
        'absolute top-0 right-0 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-bl-xl border-b border-l',
        getStatusColor(subscription.status)
      )}>
        {subscription.status}
      </div>

      {/* Content */}
      <div className="p-6 pt-12">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 pb-6 border-b border-espresso/5">
          <div>
            <h3 className="text-lg font-display font-bold text-espresso italic mb-1">
              {subscription.plan?.items?.[0]?.name || 'Custom Plan'}
            </h3>
            <p className="text-xs text-coffee-300 uppercase tracking-widest font-semibold">
              {subscription.plan?.frequency?.toUpperCase()} DELIVERY
            </p>
          </div>

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-espresso/5 rounded-lg transition-colors"
            >
              <MoreVertical size={18} className="text-coffee-400" />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-espresso/5 z-50 overflow-hidden"
                >
                  <button
                    onClick={() => {
                      onEdit(subscription.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-espresso/5 flex items-center gap-3 transition-colors"
                  >
                    <Edit2 size={16} />
                    Edit Plan
                  </button>
                  {subscription.status === 'active' && (
                    <button
                      onClick={() => {
                        onPause(subscription.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-espresso/5 flex items-center gap-3 transition-colors border-t border-espresso/5"
                    >
                      <Pause size={16} />
                      Pause Subscription
                    </button>
                  )}
                  {subscription.status === 'paused' && (
                    <button
                      onClick={() => {
                        onResume(subscription.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-espresso/5 flex items-center gap-3 transition-colors border-t border-espresso/5"
                    >
                      <Play size={16} />
                      Resume Subscription
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-xs text-coffee-300 uppercase tracking-widest font-semibold mb-1">
              Next Delivery
            </p>
            <p className="text-sm font-bold text-espresso">
              {new Date(subscription.nextDelivery).toLocaleDateString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-coffee-300 uppercase tracking-widest font-semibold mb-1">
              Payment Status
            </p>
            <div className="inline-flex items-center gap-1">
              <span className="text-lg">{getPaymentStatusIcon(subscription.currentPaymentStatus)}</span>
              <span className="text-xs font-bold capitalize">{subscription.currentPaymentStatus}</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-coffee-300 uppercase tracking-widest font-semibold mb-1">
              Deliveries
            </p>
            <p className="text-sm font-bold text-espresso">
              {subscription.completedDeliveries}/{subscription.totalDeliveries}
            </p>
          </div>
        </div>

        {/* Items Preview */}
        <div className="mb-6 pb-6 border-b border-espresso/5">
          <p className="text-xs text-coffee-300 uppercase tracking-widest font-semibold mb-3">
            This Month
          </p>
          <div className="space-y-2">
            {subscription.plan?.items?.slice(0, 2).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-coffee-400">{item.name}</span>
                <span className="font-semibold text-espresso">×{item.quantity}</span>
              </div>
            ))}
            {subscription.plan?.items && subscription.plan.items.length > 2 && (
              <p className="text-xs text-coffee-300 italic">
                +{subscription.plan.items.length - 2} more
              </p>
            )}
          </div>
        </div>

        {/* Payment Due Alert */}
        {subscription.currentPaymentStatus === 'failed' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-700">
              <p className="font-bold mb-1">Payment Issue</p>
              <p className="text-red-600">Please update your payment method</p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => onManage(subscription.id)}
          className="w-full py-3 px-4 bg-espresso text-white rounded-lg font-semibold text-sm hover:bg-espresso/90 transition-colors flex items-center justify-center gap-2 group"
        >
          Manage Plan
          <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}
