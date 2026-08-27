import { getDaysInMonth, getFirstDayOfMonth, todayStr, parseLocalDate } from '../../lib/dates';
import type { WorkoutLog } from '../../types';

interface MonthCalendarProps {
  year: number;
  month: number; // 0-indexed
  logs: WorkoutLog[];
  onDayClick: (date: string) => void;
}

/** Misma semántica que el resumen semanal: tinta = hecho, sea = descanso,
 *  rojo = fallo. El lima queda para la acción de la pantalla, no para el mapa. */
const TYPE_STYLES: Record<string, string> = {
  workout:      'bg-content text-canvas',
  rest:         'bg-sea-500/15 text-sea-700 dark:text-sea-300',
  'active-rest':'bg-sea-500/8 text-sea-600 dark:text-sea-300/90',
  missed:       'bg-red-500/12 text-red-600 dark:text-red-400',
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
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map(d => (
          <div key={d} className="py-1 text-center text-overline uppercase text-content-subtle">
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
          const dayNum = parseLocalDate(date)?.getDate() ?? Number(date.slice(-2));
          const isToday = date === today;
          const isFuture = date > today;

          const baseStyle = 'relative mx-auto flex h-9 w-9 cursor-pointer select-none items-center justify-center rounded-xl font-mono text-caption transition-colors';

          let style = '';
          if (log) {
            style = TYPE_STYLES[log.type] || 'bg-surface-3 text-content-muted';
          } else if (isToday) {
            style = 'text-content ring-1 ring-content-subtle';
          } else if (isFuture) {
            style = 'text-content-subtle hover:bg-surface-2';
          } else {
            style = 'text-content-muted hover:bg-surface-2';
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
      <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2">
        {[
          { color: 'bg-content',      label: 'Entrenado' },
          { color: 'bg-sea-500/40',   label: 'Descanso' },
          { color: 'bg-sea-500/20',   label: 'Desc. activo' },
          { color: 'bg-red-500/40',   label: 'No realizado' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${item.color}`} />
            <span className="text-caption text-content-muted">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
