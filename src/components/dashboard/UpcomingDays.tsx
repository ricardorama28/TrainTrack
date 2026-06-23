import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { getUpcomingDays, formatDateShort, getDayName } from '../../lib/dates';
import type { WorkoutLog, Routine, Settings } from '../../types';

interface UpcomingDaysProps {
  logs: WorkoutLog[];
  routines: Routine[];
  settings: Settings;
}

export function UpcomingDays({ logs, settings }: UpcomingDaysProps) {
  const upcoming = getUpcomingDays(7);
  const logMap = new Map(logs.map(l => [l.date, l]));

  return (
    <Card>
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Próximos días</h3>
      <div className="space-y-2">
        {upcoming.map((date, i) => {
          const log = logMap.get(date);
          const dayNum = new Date(date + 'T00:00:00').getDay();
          const isPlannedRest = settings.restDays.includes(dayNum);
          const label = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : `${getDayName(date)} ${formatDateShort(date)}`;

          let badge: React.ReactNode = null;
          if (log) {
            if (log.type === 'workout') badge = <Badge variant="green">✓ Entrenado{log.routineName ? ` · ${log.routineName}` : ''}</Badge>;
            else if (log.type === 'rest') badge = <Badge variant="blue">💤 Descanso</Badge>;
            else if (log.type === 'active-rest') badge = <Badge variant="teal">🚶 Desc. activo</Badge>;
            else if (log.type === 'missed') badge = <Badge variant="red">✗ No realizado</Badge>;
          } else if (isPlannedRest) {
            badge = <Badge variant="gray">💤 Descanso planeado</Badge>;
          } else {
            badge = <Badge variant="gray">Pendiente</Badge>;
          }

          return (
            <div key={date} className="flex items-center justify-between py-1">
              <span className={`text-sm ${i === 0 ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                {label}
              </span>
              {badge}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
