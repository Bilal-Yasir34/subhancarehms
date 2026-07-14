import type { ReactNode } from 'react';
import { cn } from '../../utils';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'accent' | 'secondary';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  pulse?: boolean;
  children: ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  primary: 'bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300 ring-1 ring-primary-200/60 dark:ring-primary-500/20',
  success: 'bg-secondary-50 text-secondary-700 dark:bg-secondary-500/15 dark:text-secondary-300 ring-1 ring-secondary-200/60 dark:ring-secondary-500/20',
  warning: 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300 ring-1 ring-warning-200/60 dark:ring-warning-500/20',
  danger: 'bg-danger-50 text-danger-700 dark:bg-danger-500/15 dark:text-danger-300 ring-1 ring-danger-200/60 dark:ring-danger-500/20',
  neutral: 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300 ring-1 ring-ink-200 dark:ring-ink-700',
  accent: 'bg-accent-50 text-accent-700 dark:bg-accent-500/15 dark:text-accent-300 ring-1 ring-accent-200/60 dark:ring-accent-500/20',
  secondary: 'bg-primary-50 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300 ring-1 ring-primary-200/60 dark:ring-primary-500/20',
};

const dotColors: Record<BadgeVariant, string> = {
  primary: 'bg-primary-500',
  success: 'bg-secondary-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  neutral: 'bg-ink-400',
  accent: 'bg-accent-500',
  secondary: 'bg-primary-400',
};

export function Badge({ variant = 'neutral', size = 'sm', dot, pulse, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        variants[variant],
        className,
      )}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', dotColors[variant])} />}
          <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', dotColors[variant])} />
        </span>
      )}
      {children}
    </span>
  );
}

// Status badge helpers
const statusMap: Record<string, { variant: BadgeVariant; label: string }> = {
  admitted: { variant: 'primary', label: 'Admitted' },
  outpatient: { variant: 'accent', label: 'Outpatient' },
  discharged: { variant: 'neutral', label: 'Discharged' },
  emergency: { variant: 'danger', label: 'Emergency' },
  available: { variant: 'success', label: 'Available' },
  busy: { variant: 'warning', label: 'Busy' },
  'off-duty': { variant: 'neutral', label: 'Off Duty' },
  'on-leave': { variant: 'warning', label: 'On Leave' },
  scheduled: { variant: 'primary', label: 'Scheduled' },
  completed: { variant: 'success', label: 'Completed' },
  cancelled: { variant: 'danger', label: 'Cancelled' },
  'no-show': { variant: 'neutral', label: 'No Show' },
  'in-progress': { variant: 'warning', label: 'In Progress' },
  paid: { variant: 'success', label: 'Paid' },
  pending: { variant: 'warning', label: 'Pending' },
  overdue: { variant: 'danger', label: 'Overdue' },
  'partially-paid': { variant: 'accent', label: 'Partial' },
};

export function StatusBadge({ status, pulse }: { status: string; pulse?: boolean }) {
  const cfg = statusMap[status] ?? { variant: 'neutral' as BadgeVariant, label: status };
  return (
    <Badge variant={cfg.variant} dot pulse={pulse && (status === 'emergency' || status === 'in-progress' || status === 'busy')}>
      {cfg.label}
    </Badge>
  );
}
