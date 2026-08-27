import { Check, Moon, Footprints, X } from 'lucide-react';
import { Card, SectionLabel } from '../ui/Card';
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
      <SectionLabel>Próximos días</SectionLabel>
      <div className="mt-2 divide-y divide-hairline">
        {upcoming.map((date, i) => {
          const log = logMap.get(date);
          const dayNum = new Date(date + 'T00:00:00').getDay();
          const isPlannedRest = settings.restDays.includes(dayNum);
          const label = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : `${getDayName(date)} ${formatDateShort(date)}`;

          let badge: React.ReactNode = null;
          if (log) {
            if (log.type === 'workout') badge = <Badge variant="green"><Check size={12} strokeWidth={2.5} /> Entrenado{log.routineName ? ` · ${log.routineName}` : ''}</Badge>;
            else if (log.type === 'rest') badge = <Badge variant="blue"><Moon size={12} /> Descanso</Badge>;
            else if (log.type === 'active-rest') badge = <Badge variant="teal"><Footprints size={12} /> Desc. activo</Badge>;
            else if (log.type === 'missed') badge = <Badge variant="red"><X size={12} strokeWidth={2.5} /> No realizado</Badge>;
          } else if (isPlannedRest) {
            badge = <Badge variant="gray"><Moon size={12} /> Descanso planeado</Badge>;
          } else {
            badge = <Badge variant="gray">Pendiente</Badge>;
          }

          return (
            <div key={date} className="flex items-center justify-between gap-3 py-2.5 first:pt-1 last:pb-0">
              <span className={`text-sm ${i === 0 ? 'font-semibold text-content' : 'text-content-muted'}`}>
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
