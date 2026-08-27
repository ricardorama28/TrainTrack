import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, ArrowRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { suggestNextTarget } from '../../lib/progression';
import { getExercisePerformances, getLastPerformance } from '../../lib/analytics';
import { pickNextRoutine } from '../../lib/nextWorkout';
import type { WorkoutLog, Routine, Settings, ProgressionSuggestion } from '../../types';

interface NextWorkoutCardProps {
  logs: WorkoutLog[];
  routines: Routine[];
  settings: Settings;
}

/** Compact, human objective for one exercise (no emoji; a Target icon precedes it). */
function shortObjective(s: ProgressionSuggestion): string {
  switch (s.action) {
    case 'increase-weight':
      return `subí a ${s.targetWeight} kg`;
    case 'consolidate':
      return `consolidá ${s.targetWeight} kg`;
    case 'add-reps':
    case 'first-time':
      return s.targetTotalReps != null
        ? `${s.targetWeight != null ? `${s.targetWeight} kg · ` : ''}${s.targetTotalReps}+ reps`
        : `${s.targetWeight != null ? `${s.targetWeight} kg` : ''}`;
    default:
      return s.targetWeight != null ? `${s.targetWeight} kg` : 'Repetir';
  }
}

/** Whether the objective merits the target icon (a real prescription, not plain repeat). */
function hasTarget(s: ProgressionSuggestion): boolean {
  return s.action !== 'repeat';
}

export function NextWorkoutCard({ logs, routines, settings }: NextWorkoutCardProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(null);

  const picked = useMemo(() => pickNextRoutine(routines, logs), [routines, logs]);

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
    <Card tone="hero">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-overline uppercase text-content-subtle">Próximo entrenamiento</p>
          <h3 className="mt-1.5 font-display text-2xl font-bold leading-tight tracking-tight text-content">
            {whenLabel}
            <span className="text-content-subtle"> · </span>
            <span className="text-primary-600 dark:text-primary-400">{picked.routine.name}</span>
          </h3>
        </div>
        <Button size="sm" className="shrink-0" onClick={() => navigate('/routines')}>
          Empezar <ArrowRight size={15} strokeWidth={2.5} />
        </Button>
      </div>

      <div className="space-y-1">
        {rows.map(row => {
          const isOpen = expanded === row.id;
          const lastLabel = row.last
            ? row.last.workingSets.map(s => s.reps ?? s.seconds ?? '—').join('/')
            : null;
          return (
            <div
              key={row.id}
              className={`rounded-xl transition-colors duration-200 ${isOpen ? 'bg-surface-2' : 'hover:bg-surface-2/60'}`}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : row.id)}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left"
              >
                <span className="truncate text-sm font-medium text-content">{row.name}</span>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold tabular-nums text-content-muted">
                  {hasTarget(row.suggestion) && <Target size={12} className="text-primary-500" />}
                  {shortObjective(row.suggestion)}
                </span>
              </button>
              {isOpen && (
                <div className="animate-fade-in space-y-1 px-3 pb-3 -mt-0.5 text-xs leading-relaxed text-content-muted">
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
