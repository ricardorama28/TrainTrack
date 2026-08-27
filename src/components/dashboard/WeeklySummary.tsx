import { Check, Moon, Footprints, X } from 'lucide-react';
import { Card, SectionLabel } from '../ui/Card';
import { getWeekDays, getDayName, todayStr } from '../../lib/dates';
import type { WorkoutLog, Settings } from '../../types';

interface WeeklySummaryProps {
  logs: WorkoutLog[];
  settings: Settings;
}

/**
 * "Entrenado" se pinta en tinta sólida, no en lima: el presupuesto de color
 * deja un solo fondo lima por pantalla y en el Dashboard se lo lleva "Empezar".
 * El contraste tinta/superficie distingue el día cumplido igual de bien.
 */
const TYPE_STYLES: Record<string, string> = {
  workout:       'bg-content text-canvas',
  rest:          'bg-sea-500/15 text-sea-700 dark:text-sea-300',
  'active-rest': 'bg-sea-500/8 text-sea-600 dark:text-sea-300/90',
  missed:        'bg-red-500/12 text-red-600 dark:text-red-400',
};

export function WeeklySummary({ logs, settings }: WeeklySummaryProps) {
  const weekDays = getWeekDays(new Date());
  const today = todayStr();
  const logMap = new Map(logs.map(l => [l.date, l]));

  const workoutCount = weekDays.filter(d => logMap.get(d)?.type === 'workout').length;
  const goal = settings.weeklyGoal;

  return (
    <Card>
      <SectionLabel
        action={
          <span className="font-mono text-metric-lg text-content">
            {workoutCount}
            <span className="text-content-subtle">/{goal}</span>
          </span>
        }
      >
        Esta semana
      </SectionLabel>

      {/* Medidor segmentado: se lee cuántas sesiones faltan, no un porcentaje. */}
      <div className="mt-4 flex gap-1" aria-label={`${workoutCount} de ${goal} entrenamientos`}>
        {Array.from({ length: Math.max(goal, workoutCount) }, (_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full origin-left animate-meter ${
              i < workoutCount ? 'bg-content' : 'bg-surface-3'
            }`}
            style={{ animationDelay: `${i * 55}ms` }}
          />
        ))}
      </div>

      {/* Semana */}
      <div className="mt-4 flex justify-between gap-1.5">
        {weekDays.map(date => {
          const log = logMap.get(date);
          const isToday = date === today;
          const style = log ? TYPE_STYLES[log.type] : 'bg-surface-3 text-content-subtle';

          return (
            <div key={date} className="flex flex-1 flex-col items-center gap-1.5">
              <span
                className={`text-overline uppercase ${isToday ? 'text-content' : 'text-content-subtle'}`}
              >
                {getDayName(date)}
              </span>
              <div
                className={`grid aspect-square w-full max-w-[38px] place-items-center rounded-xl ${style} ${
                  isToday ? 'ring-1 ring-content-subtle ring-offset-2 ring-offset-surface' : ''
                }`}
              >
                {log?.type === 'workout' && <Check size={14} strokeWidth={3} />}
                {log?.type === 'rest' && <Moon size={13} />}
                {log?.type === 'active-rest' && <Footprints size={13} />}
                {log?.type === 'missed' && <X size={14} strokeWidth={3} />}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
