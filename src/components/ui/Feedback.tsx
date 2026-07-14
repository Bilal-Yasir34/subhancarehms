import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils';

export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const dim = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn('animate-spin rounded-full border-2 border-ink-200 border-t-primary-600 dark:border-ink-700 dark:border-t-primary-500', dim)} />
    </div>
  );
}

export function FullPageSpinner() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-ink-50 dark:bg-ink-950">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-primary-100 dark:border-primary-500/20" />
        <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-transparent border-t-primary-600 animate-spin" />
      </div>
      <p className="text-sm text-ink-500 font-medium">Loading…</p>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  rounded?: string;
}

export function Skeleton({ className, rounded = 'rounded-lg' }: SkeletonProps) {
  return (
    <div className={cn('relative overflow-hidden bg-ink-100 dark:bg-ink-800', rounded, className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent" />
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('card-base rounded-xl p-5 space-y-3', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10" rounded="rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col items-center justify-center text-center py-16 px-6', className)}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-100 dark:bg-ink-800 text-ink-400">
        {icon ?? <Inbox className="h-8 w-8" />}
      </div>
      <h3 className="text-base font-semibold text-ink-900 dark:text-ink-100">{title}</h3>
      {description && <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ message = 'Something went wrong', onRetry, className }: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col items-center justify-center text-center py-16 px-6', className)}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-50 dark:bg-danger-500/15 text-danger-500">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h3 className="text-base font-semibold text-ink-900 dark:text-ink-100">Oops!</h3>
      <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400 max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={onRetry}>
          Try again
        </Button>
      )}
    </motion.div>
  );
}
