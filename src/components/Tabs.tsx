import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils';

interface TabsProps {
  tabs: { label: string; value: string; icon?: ReactNode; count?: number }[];
  value: string;
  onChange: (v: string) => void;
  variant?: 'underline' | 'pills';
  className?: string;
}

export function Tabs({ tabs, value, onChange, variant = 'underline', className }: TabsProps) {
  if (variant === 'pills') {
    return (
      <div className={cn('inline-flex items-center gap-1 p-1 rounded-xl bg-ink-100 dark:bg-ink-800/60', className)}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors',
              value === tab.value ? 'text-primary-700 dark:text-primary-300' : 'text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200',
            )}
          >
            {value === tab.value && (
              <motion.div layoutId="tab-pill" className="absolute inset-0 bg-white dark:bg-ink-700 rounded-lg shadow-sm" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
            )}
            <span className="relative flex items-center gap-2">
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-ink-200/70 dark:bg-ink-600 text-ink-600 dark:text-ink-300">{tab.count}</span>
              )}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1 border-b border-ink-200 dark:border-ink-800 overflow-x-auto no-scrollbar', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
            value === tab.value ? 'text-primary-600 dark:text-primary-400' : 'text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200',
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-ink-200/70 dark:bg-ink-600 text-ink-600 dark:text-ink-300">{tab.count}</span>
          )}
          {value === tab.value && (
            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}
