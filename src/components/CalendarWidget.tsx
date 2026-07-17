import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, formatDate } from '../utils';

interface CalendarWidgetProps {
  events?: { date: string; label: string; color?: string }[];
  onSelect?: (date: Date) => void;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function CalendarWidget({ events = [], onSelect }: CalendarWidgetProps) {
  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(new Date());

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const eventMap = new Map(events.map((e) => [new Date(e.date).toDateString(), e]));

  const goPrev = () => setCurrent(new Date(year, month - 1, 1));
  const goNext = () => setCurrent(new Date(year, month + 1, 1));

  const selectDate = (day: number) => {
    const d = new Date(year, month, day);
    setSelected(d);
    onSelect?.(d);
  };

  const selectedEvents = selected ? events.filter((e) => new Date(e.date).toDateString() === selected.toDateString()) : [];

  return (
    <div className="card-base rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-ink-900 dark:text-ink-100">
          {MONTHS[month]} {year}
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={goPrev} className="p-1.5 rounded-lg text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors" aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={goNext} className="p-1.5 rounded-lg text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors" aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center text-[11px] font-semibold text-ink-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const d = new Date(year, month, day);
          const isToday = d.toDateString() === today.toDateString();
          const isSelected = selected?.toDateString() === d.toDateString();
          const hasEvent = eventMap.has(d.toDateString());
          return (
            <button
              key={i}
              onClick={() => selectDate(day)}
              className={cn(
                'relative aspect-square flex items-center justify-center rounded-lg text-sm transition-all',
                isSelected
                  ? 'bg-primary-600 text-white font-semibold shadow-sm shadow-primary-600/30'
                  : isToday
                    ? 'bg-primary-50 text-primary-700 font-semibold dark:bg-primary-500/15 dark:text-primary-300'
                    : 'text-ink-600 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800',
              )}
            >
              {day}
              {hasEvent && !isSelected && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-secondary-500" />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-ink-200/70 dark:border-ink-800 space-y-2 overflow-hidden"
          >
            <p className="text-xs font-medium text-ink-500 dark:text-ink-400">{formatDate(selected!)}</p>
            {selectedEvents.map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full" style={{ background: e.color ?? '#2563eb' }} />
                <span className="text-ink-700 dark:text-ink-300">{e.label}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
