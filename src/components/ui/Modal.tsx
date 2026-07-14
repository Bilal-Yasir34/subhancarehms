import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlay?: boolean;
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ open, onClose, title, description, children, footer, size = 'md', closeOnOverlay = true }: ModalProps) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
            onClick={closeOnOverlay ? onClose : undefined}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className={cn(
              'relative w-full glass-strong rounded-2xl shadow-float max-h-[90vh] flex flex-col',
              sizes[size],
            )}
          >
            {(title || description) && (
              <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-ink-200/70 dark:border-ink-800">
                <div>
                  {title && <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-100">{title}</h2>}
                  {description && <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{description}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-600 dark:hover:bg-ink-800 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-ink-200/70 dark:border-ink-800">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// Confirmation dialog
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger', loading,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="text-center py-2">
        <div
          className={cn(
            'mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full',
            variant === 'danger' && 'bg-danger-50 dark:bg-danger-500/15',
            variant === 'warning' && 'bg-warning-50 dark:bg-warning-500/15',
            variant === 'primary' && 'bg-primary-50 dark:bg-primary-500/15',
          )}
        >
          {variant === 'danger' && <X className="h-7 w-7 text-danger-500" />}
        </div>
        <h3 className="text-lg font-semibold text-ink-900 dark:text-ink-100">{title}</h3>
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{message}</p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-ink-300 text-ink-700 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800 transition-colors text-sm font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'flex-1 h-10 rounded-lg text-white text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50',
              variant === 'danger' && 'bg-danger-600 hover:bg-danger-700',
              variant === 'warning' && 'bg-warning-500 hover:bg-warning-600',
              variant === 'primary' && 'bg-primary-600 hover:bg-primary-700',
            )}
          >
            {loading ? 'Please wait…' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
