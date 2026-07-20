import { motion } from 'motion/react';
import { Truck, MapPin, Clock, CheckCircle, AlertCircle, Package } from 'lucide-react';
import { Delivery, DeliveryStatus } from '../../types';
import { cn } from '../../lib/utils';

interface DeliveryCardProps {
  delivery: Delivery;
  onClick?: () => void;
}

export default function DeliveryCard({ delivery, onClick }: DeliveryCardProps) {
  const getStatusConfig = (status: DeliveryStatus) => {
    const configs: Record<DeliveryStatus, { color: string; icon: any; label: string; bg: string }> = {
      [DeliveryStatus.SCHEDULED]: {
        color: 'text-amber-600',
        bg: 'bg-amber-50 border-amber-200',
        icon: Package,
        label: 'Scheduled',
      },
      [DeliveryStatus.IN_TRANSIT]: {
        color: 'text-blue-600',
        bg: 'bg-blue-50 border-blue-200',
        icon: Truck,
        label: 'In Transit',
      },
      [DeliveryStatus.OUT_FOR_DELIVERY]: {
        color: 'text-blue-600',
        bg: 'bg-blue-50 border-blue-200',
        icon: Truck,
        label: 'Out for Delivery',
      },
      [DeliveryStatus.DELIVERED]: {
        color: 'text-green-600',
        bg: 'bg-green-50 border-green-200',
        icon: CheckCircle,
        label: 'Delivered',
      },
      [DeliveryStatus.FAILED]: {
        color: 'text-red-600',
        bg: 'bg-red-50 border-red-200',
        icon: AlertCircle,
        label: 'Failed',
      },
    };
    return configs[status];
  };

  const config = getStatusConfig(delivery.status);
  const StatusIcon = config.icon;

  const isCompleted = delivery.status === DeliveryStatus.DELIVERED;
  const isFailed = delivery.status === DeliveryStatus.FAILED;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        'p-6 rounded-2xl border transition-all duration-300',
        config.bg,
        onClick && 'cursor-pointer hover:shadow-md'
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-3 rounded-xl bg-white', config.color)}>
            <StatusIcon size={20} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
              Delivery Status
            </p>
            <p className={cn('font-bold', config.color)}>
              {config.label}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3 mb-4 pb-4 border-b border-white/30">
        {/* Scheduled Date */}
        <div className="flex items-center gap-3 text-sm">
          <Clock size={16} className="text-text-muted flex-shrink-0" />
          <div>
            <p className="text-xs text-text-muted uppercase font-semibold mb-1">
              Scheduled Date
            </p>
            <p className="font-bold text-espresso">
              {new Date(delivery.scheduledDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
              {delivery.scheduledTimeWindow && ` • ${delivery.scheduledTimeWindow}`}
            </p>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="flex items-start gap-3 text-sm">
          <MapPin size={16} className="text-text-muted flex-shrink-0 mt-1" />
          <div>
            <p className="text-xs text-text-muted uppercase font-semibold mb-1">
              Delivery Location
            </p>
            <p className="font-medium text-espresso text-sm">
              {delivery.address?.street}
              {delivery.address?.building && `, Bldg ${delivery.address.building}`}
              {delivery.address?.floor && `, Fl ${delivery.address.floor}`}
            </p>
            {delivery.address?.instructions && (
              <p className="text-xs text-text-muted italic mt-1">
                {delivery.address.instructions}
              </p>
            )}
          </div>
        </div>

        {/* Driver Info (if assigned) */}
        {delivery.driverName && (
          <div className="flex items-center gap-3 text-sm">
            <Truck size={16} className="text-text-muted flex-shrink-0" />
            <div>
              <p className="text-xs text-text-muted uppercase font-semibold mb-1">
                Driver
              </p>
              <p className="font-medium text-espresso">
                {delivery.driverName}
                {delivery.driverPhone && ` • ${delivery.driverPhone}`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Items Count */}
      <div className="flex items-center gap-2 text-sm">
        <Package size={16} className="text-text-muted" />
        <span className="text-text-muted">{delivery.items.length} item{delivery.items.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Status Badges */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/30">
        {isCompleted && (
          <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
            ✓ Completed
          </span>
        )}
        {isFailed && (
          <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
            ✗ Delivery Failed
          </span>
        )}
        {delivery.attempts > 0 && !isCompleted && (
          <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
            Attempt {delivery.attempts}
          </span>
        )}
      </div>
    </motion.div>
  );
}
