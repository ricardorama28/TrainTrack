import { useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { ExerciseHistory } from '../components/exercises/ExerciseHistory';
import type { WorkoutLog, Routine } from '../types';

interface ExercisesPageProps {
  logs: WorkoutLog[];
  routines: Routine[];
}

interface ExerciseSummary {
  name: string;
  lastDate: string;
  lastWeight?: number;
  totalSessions: number;
}

export function ExercisesPage({ logs, routines }: ExercisesPageProps) {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const summaries = useMemo((): ExerciseSummary[] => {
    const map = new Map<string, { name: string; dates: string[]; weights: number[] }>();

    // Gather data from workout logs
    for (const log of logs) {
      for (const ex of log.exercises) {
        const key = ex.exerciseName.toLowerCase();
        if (!map.has(key)) {
          map.set(key, { name: ex.exerciseName, dates: [], weights: [] });
        }
        const entry = map.get(key)!;
        entry.dates.push(log.date);
        for (const set of ex.sets) {
          if (set.weight != null) entry.weights.push(set.weight);
        }
      }
    }

    // Also include exercises from routines that haven't been logged yet
    for (const routine of routines) {
      for (const ex of routine.exercises) {
        const key = ex.name.toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            name: ex.name,
            dates: [],
            weights: ex.weight != null ? [ex.weight] : [],
          });
        }
      }
    }

    return Array.from(map.values())
      .map(({ name, dates, weights }) => {
        const sortedDates = [...dates].sort((a, b) => b.localeCompare(a));
        return {
          name,
          lastDate: sortedDates[0] ?? '',
          // Use last recorded weight (most recent)
          lastWeight: weights.length > 0 ? weights[weights.length - 1] : undefined,
          totalSessions: dates.length,
        };
      })
      .sort((a, b) => {
        // Logged exercises first, sorted by date; then unlisted alphabetically
        if (a.lastDate && b.lastDate) return b.lastDate.localeCompare(a.lastDate);
        if (a.lastDate) return -1;
        if (b.lastDate) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [logs, routines]);

  const filtered = summaries.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ejercicios</h1>

      <input
        type="search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar ejercicio..."
        className="input"
      />

      {filtered.length === 0 && (
        <EmptyState
          icon="💪"
          title="Sin ejercicios todavía"
          description="Los ejercicios aparecen acá cuando registrás un entrenamiento o creás una rutina."
        />
      )}

      <div className="space-y-2">
        {filtered.map(ex => (
          <Card key={ex.name} onClick={() => setSelectedExercise(ex.name)} padding>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{ex.name}</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {ex.totalSessions > 0 && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {ex.totalSessions} sesión{ex.totalSessions !== 1 ? 'es' : ''}
                    </span>
                  )}
                  {ex.lastDate && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      Última: {ex.lastDate}
                    </span>
                  )}
                </div>
              </div>
              {ex.lastWeight !== undefined && (
                <Badge variant="green">🏋️ {ex.lastWeight} kg</Badge>
              )}
              <span className="text-gray-400 dark:text-gray-500 text-sm">›</span>
            </div>
          </Card>
        ))}
      </div>

      {selectedExercise && (
        <ExerciseHistory
          exerciseName={selectedExercise}
          logs={logs}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </div>
  );
}
