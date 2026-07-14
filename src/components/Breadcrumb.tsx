import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface Crumb {
  label: string;
  path?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <div key={i} className="flex items-center gap-1.5">
            {item.path && !isLast ? (
              <Link to={item.path} className="text-ink-500 hover:text-primary-600 dark:text-ink-400 dark:hover:text-primary-400 transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'font-medium text-ink-800 dark:text-ink-200' : 'text-ink-500 dark:text-ink-400'}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight className="h-3.5 w-3.5 text-ink-300 dark:text-ink-600" />}
          </div>
        );
      })}
    </nav>
  );
}
