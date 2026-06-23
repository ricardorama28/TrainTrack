import { getDaysInMonth, getFirstDayOfMonth, formatMonthYear, todayStr, parseLocalDate } from '../../lib/dates';
import type { WorkoutLog } from '../../types';

interface MonthCalendarProps {
  year: number;
  month: number; // 0-indexed
  logs: WorkoutLog[];
  onDayClick: (date: string) => void;
}

const TYPE_STYLES: Record<string, string> = {
  workout:      'bg-primary-500 text-white',
  rest:         'bg-blue-400 text-white',
  'active-rest':'bg-teal-400 text-white',
  missed:       'bg-red-400 text-white',
};

const DAY_HEADERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function MonthCalendar({ year, month, logs, onDayClick }: MonthCalendarProps) {
  const days = getDaysInMonth(year, month);
  const logMap = new Map(logs.map(l => [l.date, l]));
  const today = todayStr();

  // firstDayOfMonth: 0=Sun. We want Monday first.
  const firstDay = getFirstDayOfMonth(year, month);
  const mondayFirst = firstDay === 0 ? 6 : firstDay - 1;

  return (
    <div>
      <p className="text-center text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 capitalize">
        {formatMonthYear(new Date(year, month))}
      </p>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Empty cells before first day */}
        {Array.from({ length: mondayFirst }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map(date => {
          const log = logMap.get(date);
          const dayNum = parseLocalDate(date).getDate();
          const isToday = date === today;
          const isFuture = date > today;

          const baseStyle = 'relative flex items-center justify-center rounded-full w-9 h-9 mx-auto text-sm font-medium transition-all cursor-pointer select-none';

          let style = '';
          if (log) {
            style = TYPE_STYLES[log.type] || 'bg-gray-200 dark:bg-gray-600';
          } else if (isToday) {
            style = 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500';
          } else if (isFuture) {
            style = 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700';
          } else {
            style = 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700';
          }

          return (
            <button
              key={date}
              className={`${baseStyle} ${style}`}
              onClick={() => onDayClick(date)}
              aria-label={date}
            >
              {dayNum}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        {[
          { color: 'bg-primary-500', label: 'Entrenado' },
          { color: 'bg-blue-400',    label: 'Descanso' },
          { color: 'bg-teal-400',    label: 'Desc. activo' },
          { color: 'bg-red-400',     label: 'No realizado' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${item.color}`} />
            <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
