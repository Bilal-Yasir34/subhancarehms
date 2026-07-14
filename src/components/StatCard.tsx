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
  primary: { bg: 'bg-primary-50 dark:bg-primary-500/15', text: 'text-primary-600 dark:text-primary-400', glow: 'from-primary-500/10' },
  success: { bg: 'bg-secondary-50 dark:bg-secondary-500/15', text: 'text-secondary-600 dark:text-secondary-400', glow: 'from-secondary-500/10' },
  warning: { bg: 'bg-warning-50 dark:bg-warning-500/15', text: 'text-warning-600 dark:text-warning-400', glow: 'from-warning-500/10' },
  danger: { bg: 'bg-danger-50 dark:bg-danger-500/15', text: 'text-danger-600 dark:text-danger-400', glow: 'from-danger-500/10' },
  accent: { bg: 'bg-accent-50 dark:bg-accent-500/15', text: 'text-accent-600 dark:text-accent-400', glow: 'from-accent-500/10' },
};

export function StatCard({ label, value, prefix = '', suffix = '', decimals = 0, icon, accent, trend, index = 0, loading = false }: StatCardProps) {
  const [started, setStarted] = useState(false);
  const count = useCountUp(value, 1400, started);
  const a = accents[accent];

  const formatted = count.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 300, damping: 24 }}
      onAnimationComplete={() => setStarted(true)}
    >
      <Card hover className="relative overflow-hidden group p-5">
        <div className={cn('absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br to-transparent blur-2xl opacity-60 transition-opacity group-hover:opacity-100', a.glow)} />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-ink-500 dark:text-ink-400">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-ink-900 dark:text-ink-50">
              {loading ? '—' : `${prefix}${formatted}${suffix}`}
            </p>
          </div>
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', a.bg, a.text)}>
            {icon}
          </div>
        </div>
        {trend && (
          <div className="relative mt-3 flex items-center gap-1.5 text-xs">
            <span className={cn('inline-flex items-center gap-0.5 font-medium', trend.up ? 'text-secondary-600 dark:text-secondary-400' : 'text-danger-600 dark:text-danger-400')}>
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
