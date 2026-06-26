import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { formatDateShort } from '../../lib/dates';
import type { WorkoutLog } from '../../types';

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

  return (
    <Modal open={true} onClose={onClose} title={exerciseName}>
      <div className="space-y-4">
        {lastWeight !== undefined && (
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3 flex items-center gap-3">
            <span className="text-2xl">🏋️</span>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Último peso registrado</p>
              <p className="text-xl font-bold text-primary-600 dark:text-primary-400">{lastWeight} kg</p>
            </div>
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
