import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { suggestNextTarget } from '../../lib/progression';
import { getExercisePerformances, getLastPerformance } from '../../lib/analytics';
import type { WorkoutLog, Routine, Settings, ProgressionSuggestion } from '../../types';

interface NextWorkoutCardProps {
  logs: WorkoutLog[];
  routines: Routine[];
  settings: Settings;
}

/** Pick today's routine, else the next upcoming suggested day, else the first workout. */
function pickRoutine(routines: Routine[]): { routine: Routine; dayOffset: number } | null {
  const workouts = routines.filter(r => r.type === 'workout');
  if (workouts.length === 0) return null;
  const todayDow = new Date().getDay();
  for (let offset = 0; offset < 7; offset++) {
    const day = (todayDow + offset) % 7;
    const match = workouts.find(r => r.suggestedDays?.includes(day));
    if (match) return { routine: match, dayOffset: offset };
  }
  return { routine: workouts[0], dayOffset: 0 };
}

/** Compact, human objective for one exercise. */
function shortObjective(s: ProgressionSuggestion): string {
  switch (s.action) {
    case 'increase-weight':
      return `🎯 subí a ${s.targetWeight} kg`;
    case 'consolidate':
      return `🎯 consolidá ${s.targetWeight} kg`;
    case 'add-reps':
    case 'first-time':
      return s.targetTotalReps != null
        ? `${s.targetWeight != null ? `${s.targetWeight} kg · ` : ''}🎯 ${s.targetTotalReps}+ reps`
        : `${s.targetWeight != null ? `${s.targetWeight} kg` : ''}`;
    default:
      return s.targetWeight != null ? `${s.targetWeight} kg` : 'Repetir';
  }
}

export function NextWorkoutCard({ logs, routines, settings }: NextWorkoutCardProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(null);

  const picked = useMemo(() => pickRoutine(routines), [routines]);

  const rows = useMemo(() => {
    if (!picked) return [];
    return picked.routine.exercises.map(ex => {
      const performances = getExercisePerformances(logs, ex.exerciseId, ex.name);
      const suggestion = suggestNextTarget({ template: ex, performances, settings });
      const last = getLastPerformance(logs, ex.exerciseId, ex.name);
      return { id: ex.id, name: ex.name, suggestion, last };
    });
  }, [picked, logs, settings]);

  if (!picked) return null;

  const whenLabel = picked.dayOffset === 0 ? 'Hoy' : picked.dayOffset === 1 ? 'Mañana' : 'Próximo';

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary-500">Próximo entrenamiento</p>
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{whenLabel} · {picked.routine.name}</h3>
        </div>
        <button
          onClick={() => navigate('/routines')}
          className="text-sm font-semibold text-primary-600 dark:text-primary-400"
        >
          Empezar →
        </button>
      </div>

      <div className="space-y-1.5">
        {rows.map(row => {
          const isOpen = expanded === row.id;
          const lastLabel = row.last
            ? row.last.workingSets.map(s => s.reps ?? s.seconds ?? '—').join('/')
            : null;
          return (
            <div key={row.id} className="rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => setExpanded(isOpen ? null : row.id)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
              >
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{row.name}</span>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 shrink-0">{shortObjective(row.suggestion)}</span>
              </button>
              {isOpen && (
                <div className="px-3 pb-2.5 -mt-0.5 space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {lastLabel && <p>Último: {lastLabel}</p>}
                  {row.suggestion.targetReps && row.suggestion.targetReps.length > 0 && (
                    <p>Referencia: {row.suggestion.targetReps.join('/')}</p>
                  )}
                  <p>{row.suggestion.reason}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
