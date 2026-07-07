import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  onClick?: () => void;
}

const colorClasses = {
  primary: 'bg-white border-espresso/10 text-espresso hover:border-caramel/30',
  success: 'bg-white border-green-200 text-green-800 hover:border-green-300',
  warning: 'bg-white border-amber-200 text-amber-900 hover:border-amber-300',
  danger: 'bg-white border-red-200 text-red-800 hover:border-red-300',
};

const iconBgClasses = {
  primary: 'bg-espresso/10 text-espresso',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
};

export default function MetricCard({
  label,
  value,
  icon,
  color = 'primary',
  trend,
  onClick,
}: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      onClick={onClick}
      className={cn(
        'p-4 sm:p-5 md:p-6 rounded-2xl border shadow-sm transition-all duration-300 min-h-[120px] sm:min-h-[132px]',
        colorClasses[color],
        onClick && 'cursor-pointer hover:shadow-md'
      )}
    >
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className={cn('p-2.5 sm:p-3 rounded-xl shrink-0', iconBgClasses[color])}>
          {icon}
        </div>
        {trend && (
          <div className={cn(
            'text-xs font-bold px-2 py-1 rounded-full shrink-0',
            trend.direction === 'up'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          )}>
            {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-text-secondary mb-1.5">
        {label}
      </p>
      <p className="text-xl sm:text-2xl md:text-3xl font-display font-black tracking-tight text-espresso break-words">
        {value}
      </p>
    </motion.div>
  );
}
