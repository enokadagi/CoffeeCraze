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
  primary: 'bg-gradient-to-br from-espresso/5 to-espresso/2 border-espresso/10 text-espresso',
  success: 'bg-gradient-to-br from-green-50 to-green-25 border-green-200 text-green-700',
  warning: 'bg-gradient-to-br from-amber-50 to-amber-25 border-amber-200 text-amber-700',
  danger: 'bg-gradient-to-br from-red-50 to-red-25 border-red-200 text-red-700',
};

const iconBgClasses = {
  primary: 'bg-espresso/10',
  success: 'bg-green-100',
  warning: 'bg-amber-100',
  danger: 'bg-red-100',
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
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={cn(
        'p-6 rounded-2xl border transition-all duration-300',
        colorClasses[color],
        onClick && 'cursor-pointer hover:shadow-lg'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('p-3 rounded-xl', iconBgClasses[color])}>
          {icon}
        </div>
        {trend && (
          <div className={cn(
            'text-xs font-bold px-2 py-1 rounded-full',
            trend.direction === 'up'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          )}>
            {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-coffee-400 mb-2">
        {label}
      </p>
      <p className="text-3xl font-display font-black italic tracking-tight">
        {value}
      </p>
    </motion.div>
  );
}
