import { getInitials, cn } from '../../utils';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  ring?: boolean;
  status?: string;
  className?: string;
}

const sizes = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const statusColors: Record<string, string> = {
  available: 'bg-secondary-500',
  busy: 'bg-warning-500',
  'off-duty': 'bg-ink-400',
  'on-leave': 'bg-warning-500',
  admitted: 'bg-primary-500',
  emergency: 'bg-danger-500',
};

export function Avatar({ src, name, size = 'md', ring, status, className }: AvatarProps) {
  const initials = getInitials(name);
  return (
    <div className={cn('relative inline-flex shrink-0 rounded-full', className)}>
      <div
        className={cn(
          'rounded-full overflow-hidden flex items-center justify-center font-medium bg-gradient-to-br from-primary-100 to-accent-100 text-primary-700 dark:from-ink-700 dark:to-ink-800 dark:text-ink-200',
          sizes[size],
          ring && 'ring-2 ring-white dark:ring-ink-900 shadow-sm',
        )}
      >
        {src ? (
          <img src={src} alt={name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span>{initials}</span>
        )}
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
