import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'success' | 'warning';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary: [
    'bg-primary-600 text-white',
    'hover:bg-primary-700',
    'shadow-md shadow-primary-600/25',
    'hover:shadow-lg hover:shadow-primary-600/30',
    'active:bg-primary-800',
    'relative overflow-hidden',
    // shimmer stripe
    'after:absolute after:inset-0 after:translate-x-[-100%] after:bg-gradient-to-r after:from-transparent after:via-white/15 after:to-transparent',
    'hover:after:translate-x-[100%] after:transition-transform after:duration-500',
  ].join(' '),
  secondary: 'bg-ink-100 text-ink-700 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-200 dark:hover:bg-ink-700',
  ghost: 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800',
  danger: [
    'bg-danger-600 text-white',
    'hover:bg-danger-700',
    'shadow-md shadow-danger-600/25',
    'hover:shadow-lg hover:shadow-danger-600/30',
    'active:bg-danger-800',
    'relative overflow-hidden',
    'after:absolute after:inset-0 after:translate-x-[-100%] after:bg-gradient-to-r after:from-transparent after:via-white/15 after:to-transparent',
    'hover:after:translate-x-[100%] after:transition-transform after:duration-500',
  ].join(' '),
  outline: 'border border-ink-300 text-ink-700 hover:bg-ink-50 hover:border-ink-400 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800 dark:hover:border-ink-600',
  success: [
    'bg-secondary-600 text-white',
    'hover:bg-secondary-700',
    'shadow-md shadow-secondary-600/25',
    'active:bg-secondary-800',
    'relative overflow-hidden',
    'after:absolute after:inset-0 after:translate-x-[-100%] after:bg-gradient-to-r after:from-transparent after:via-white/15 after:to-transparent',
    'hover:after:translate-x-[100%] after:transition-transform after:duration-500',
  ].join(' '),
  warning: [
    'bg-warning-500 text-white',
    'hover:bg-warning-600',
    'shadow-md shadow-warning-500/25',
    'active:bg-warning-700',
    'relative overflow-hidden',
    'after:absolute after:inset-0 after:translate-x-[-100%] after:bg-gradient-to-r after:from-transparent after:via-white/15 after:to-transparent',
    'hover:after:translate-x-[100%] after:transition-transform after:duration-500',
  ].join(' '),
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
  icon: 'h-10 w-10 p-0 rounded-xl',
};

const MotionButton = motion(
  forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>((props, ref) => (
    <button ref={ref} {...props} />
  ))
);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', loading, leftIcon, rightIcon, fullWidth, className, children, disabled, ...props },
    ref,
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buttonProps: any = props;

    return (
      <MotionButton
        ref={ref}
        disabled={disabled || loading}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-200 select-none whitespace-nowrap',
          'focus-visible:ring-2 focus-visible:ring-primary-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-ink-950',
          'disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className,
        )}
        {...buttonProps}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : leftIcon}
        {children}
        {!loading && rightIcon}
      </MotionButton>
    );
  },
);
Button.displayName = 'Button';
