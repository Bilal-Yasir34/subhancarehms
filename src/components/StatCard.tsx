import { type ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card } from './ui';
import { useCountUp } from '../hooks/useCountUp';
import { cn } from '../utils';

interface StatCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon: ReactNode;
  accent: 'primary' | 'success' | 'warning' | 'danger' | 'accent';
  trend?: { value: number; up: boolean };
  index?: number;
  loading?: boolean;
}

const accents = {
  primary: {
    bg:    'bg-primary-50 dark:bg-primary-500/15',
    text:  'text-primary-600 dark:text-primary-400',
    glow:  'from-primary-400/20 to-transparent',
    ring:  'ring-primary-500/20',
    value: 'text-primary-700 dark:text-primary-300',
    bar:   'bg-primary-500',
  },
  success: {
    bg:    'bg-secondary-50 dark:bg-secondary-500/15',
    text:  'text-secondary-600 dark:text-secondary-400',
    glow:  'from-secondary-400/20 to-transparent',
    ring:  'ring-secondary-500/20',
    value: 'text-secondary-700 dark:text-secondary-300',
    bar:   'bg-secondary-500',
  },
  warning: {
    bg:    'bg-warning-50 dark:bg-warning-500/15',
    text:  'text-warning-600 dark:text-warning-400',
    glow:  'from-warning-400/20 to-transparent',
    ring:  'ring-warning-500/20',
    value: 'text-warning-700 dark:text-warning-300',
    bar:   'bg-warning-500',
  },
  danger: {
    bg:    'bg-danger-50 dark:bg-danger-500/15',
    text:  'text-danger-600 dark:text-danger-400',
    glow:  'from-danger-400/20 to-transparent',
    ring:  'ring-danger-500/20',
    value: 'text-danger-700 dark:text-danger-300',
    bar:   'bg-danger-500',
  },
  accent: {
    bg:    'bg-accent-50 dark:bg-accent-500/15',
    text:  'text-accent-600 dark:text-accent-400',
    glow:  'from-accent-400/20 to-transparent',
    ring:  'ring-accent-500/20',
    value: 'text-accent-700 dark:text-accent-300',
    bar:   'bg-accent-500',
  },
};

export function StatCard({
  label, value, prefix = '', suffix = '', decimals = 0,
  icon, accent, trend, index = 0, loading = false,
}: StatCardProps) {
  const [started, setStarted] = useState(false);
  const count = useCountUp(value, 1200, started);
  const a = accents[accent];

  const formatted = count.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.09, type: 'spring', stiffness: 280, damping: 22 }}
      onAnimationComplete={() => setStarted(true)}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
    >
      <Card className={cn('relative overflow-hidden group cursor-default p-5 transition-all duration-300', `hover:ring-2 ${a.ring}`)}>
        {/* Animated background glow blob */}
        <motion.div
          className={cn('absolute -top-10 -right-10 h-36 w-36 rounded-full bg-gradient-to-br blur-3xl', a.glow)}
          animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: index * 0.5 }}
        />

        {/* Shimmer sweep on hover */}
        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-2xl">
          <div className="absolute inset-0 animate-shimmer" />
        </div>

        {/* Accent bar at top */}
        <div className={cn('absolute top-0 left-0 right-0 h-0.5', a.bar)} />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500 truncate">{label}</p>
            <p className={cn('mt-2.5 text-3xl font-bold tracking-tight transition-all', a.value)}>
              {loading ? (
                <span className="inline-block h-9 w-24 skeleton rounded-lg" />
              ) : (
                <motion.span
                  key={value}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {prefix}{formatted}{suffix}
                </motion.span>
              )}
            </p>
          </div>

          {/* Icon bubble */}
          <motion.div
            className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm', a.bg, a.text)}
            whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
            transition={{ duration: 0.4 }}
          >
            {icon}
          </motion.div>
        </div>

        {trend && (
          <div className="relative mt-3 flex items-center gap-1.5 text-xs">
            <span className={cn(
              'inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded-md',
              trend.up
                ? 'bg-secondary-50 text-secondary-700 dark:bg-secondary-500/15 dark:text-secondary-300'
                : 'bg-danger-50 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300',
            )}>
              {trend.up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {trend.value}%
            </span>
            <span className="text-ink-400 dark:text-ink-500">vs last month</span>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
