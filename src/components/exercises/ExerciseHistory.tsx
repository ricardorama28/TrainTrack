import { useMemo } from 'react';
import { ArrowUp, ArrowDown, Minus, Trophy, AlertTriangle, Dumbbell, type LucideIcon } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { formatDateShort } from '../../lib/dates';
import { storage } from '../../lib/storage';
import { ExerciseProgressChart } from '../charts/ExerciseProgressChart';
import {
  getExercisePerformances, computePRs, detectTrend, detectStalled, getCurrentLoadBlock,
} from '../../lib/analytics';
import type { WorkoutLog, Trend } from '../../types';

interface ExerciseHistoryProps {
  exerciseName: string;
  logs: WorkoutLog[];
  onClose: () => void;
}

interface HistoryEntry {
  date: string;
  sets: { reps?: number; seconds?: number; weight?: number; completed: boolean }[];
  notes?: string;
}

/** Build the label for a set badge: reps, time, and/or weight. */
function setLabel(set: { reps?: number; seconds?: number; weight?: number }): string {
  const parts: string[] = [];
  if (set.seconds != null) parts.push(`${set.seconds} s`);
  else if (set.reps != null) parts.push(`${set.reps} reps`);
  if (set.weight != null) parts.push(`${set.weight} kg`);
  return parts.join(' · ') || '—';
}

const TREND_META: Record<Trend, { Icon: LucideIcon; label: string; variant: 'green' | 'gray' | 'red' }> = {
  up: { Icon: ArrowUp, label: 'Progresando', variant: 'green' },
  flat: { Icon: Minus, label: 'Estable', variant: 'gray' },
  down: { Icon: ArrowDown, label: 'Bajando', variant: 'red' },
};

export function ExerciseHistory({ exerciseName, logs, onClose }: ExerciseHistoryProps) {
  // Find all logs that contain this exercise
  const entries: HistoryEntry[] = logs
    .flatMap(log =>
      log.exercises
        .filter(ex => ex.exerciseName.toLowerCase() === exerciseName.toLowerCase())
        .map(ex => ({ date: log.date, sets: ex.sets, notes: ex.notes }))
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 20); // last 20 entries

  const lastWeight = entries.flatMap(e => e.sets).find(s => s.weight != null)?.weight;

  const analysis = useMemo(() => {
    const perfs = getExercisePerformances(logs, undefined, exerciseName);
    if (perfs.length === 0) return null;
    const prs = computePRs(perfs);
    const trend = detectTrend(perfs);
    const currentWeight = perfs[perfs.length - 1].topWeight;
    const block = getCurrentLoadBlock(perfs, currentWeight);
    const threshold = storage.getSettings().stalledSessionThreshold ?? 3;
    const stalled = detectStalled(block, threshold);
    return { perfs, prs, trend, stalled };
  }, [logs, exerciseName]);

  return (
    <Modal open={true} onClose={onClose} title={exerciseName}>
      <div className="space-y-4">
        {lastWeight !== undefined && (
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3 flex items-center gap-3">
            <Dumbbell size={24} className="text-primary-600 dark:text-primary-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Último peso registrado</p>
              <p className="text-xl font-display font-bold text-primary-600 dark:text-primary-400 tabular-nums">{lastWeight} kg</p>
            </div>
          </div>
        )}

        {analysis && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(() => {
                const T = TREND_META[analysis.trend];
                return <Badge variant={T.variant}><T.Icon size={12} strokeWidth={2.5} /> {T.label}</Badge>;
              })()}
              {analysis.stalled.stalled && (
                <Badge variant="red">
                  <AlertTriangle size={12} /> {analysis.stalled.reason === 'ceiling-failure'
                    ? `${analysis.stalled.sessionsWithoutProgress} sesiones al techo sin reserva`
                    : `Sin progreso hace ${analysis.stalled.sessionsWithoutProgress} sesiones`}
                </Badge>
              )}
            </div>

            {(analysis.prs.maxWeight || analysis.prs.maxTotalRepsAtWeight) && (
              <div className="flex flex-wrap gap-2 text-xs">
                {analysis.prs.maxWeight && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300 px-2 py-1 font-semibold tabular-nums">
                    <Trophy size={13} /> Carga máx {analysis.prs.maxWeight.value} kg
                  </span>
                )}
                {analysis.prs.maxTotalRepsAtWeight && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300 px-2 py-1 font-semibold tabular-nums">
                    <Trophy size={13} /> {analysis.prs.maxTotalRepsAtWeight.value} reps
                    {analysis.prs.maxTotalRepsAtWeight.weight ? ` @ ${analysis.prs.maxTotalRepsAtWeight.weight} kg` : ''}
                  </span>
                )}
              </div>
            )}

            <ExerciseProgressChart performances={analysis.perfs} />
          </div>
        )}

        {entries.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            No hay historial registrado para este ejercicio.
          </p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, i) => (
              <div key={i} className="border border-gray-100 dark:border-gray-700 rounded-xl p-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {formatDateShort(entry.date)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {entry.sets.map((set, j) => (
                    <Badge key={j} variant={set.completed ? 'green' : 'gray'}>
                      {setLabel(set)}
                    </Badge>
                  ))}
                </div>
                {entry.notes && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 italic">{entry.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
