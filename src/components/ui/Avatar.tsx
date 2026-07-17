import { User } from 'lucide-react';
import { cn } from '../../utils';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  ring?: boolean;
  status?: string;
  className?: string;
}

const sizes = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const iconSizes = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

const statusColors: Record<string, string> = {
  available: 'bg-secondary-500',
  busy: 'bg-warning-500',
  'off-duty': 'bg-ink-400',
  'on-leave': 'bg-warning-500',
  admitted: 'bg-primary-500',
  emergency: 'bg-danger-500',
};

export function Avatar({ src: _src, name, size = 'md', ring, status, className }: AvatarProps) {
  return (
    <div className={cn('relative inline-flex shrink-0 rounded-full', className)} title={name}>
      <div
        className={cn(
          'rounded-full overflow-hidden flex items-center justify-center font-medium bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
          sizes[size],
          ring && 'ring-2 ring-white dark:ring-ink-900 shadow-sm',
        )}
      >
        <User className={iconSizes[size]} />
      </div>
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-ink-900',
            size === 'xs' || size === 'sm' ? 'h-2 w-2' : 'h-3 w-3',
            statusColors[status] ?? 'bg-ink-400',
          )}
        />
      )}
    </div>
  );
}
