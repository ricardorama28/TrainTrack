import { useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { MuscleVolumeChart } from '../components/charts/MuscleVolumeChart';
import { WeeklyVolumeChart } from '../components/charts/WeeklyVolumeChart';
import { ProgressHighlights } from '../components/dashboard/ProgressHighlights';
import { MUSCLE_LABELS } from '../lib/labels';
import { weeklyMuscleVolume, volumeByWeek, muscleFrequency } from '../lib/volume';
import type { WorkoutLog, Exercise, Settings, MuscleGroup } from '../types';

interface ProgressPageProps {
  logs: WorkoutLog[];
  exercises: Exercise[];
  settings: Settings;
}

export function ProgressPage({ logs, exercises, settings }: ProgressPageProps) {
  const weekly = useMemo(() => weeklyMuscleVolume(logs, exercises), [logs, exercises]);
  const byWeek = useMemo(() => volumeByWeek(logs, exercises, 4), [logs, exercises]);
  const frequency = useMemo(() => muscleFrequency(logs, exercises, 4), [logs, exercises]);

  const hasData = logs.some(l => l.exercises.some(e => e.sets.length > 0));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Progreso</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Análisis de tu entrenamiento</p>
      </div>

      {!hasData ? (
        <EmptyState icon="📊" title="Todavía no hay datos" description="Registrá algunos entrenamientos para ver tu progreso, PRs y distribución muscular." />
      ) : (
        <>
          <ProgressHighlights logs={logs} exercises={exercises} settings={settings} />

          <Card>
            <div className="mb-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary-500">Distribución del entrenamiento</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Series de trabajo por grupo muscular · esta semana</p>
            </div>
            {weekly.length > 0 ? (
              <MuscleVolumeChart data={weekly} />
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">Sin series registradas esta semana.</p>
            )}
          </Card>

          <Card>
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary-500 mb-2">Frecuencia por músculo</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Días de entrenamiento por semana (promedio, últimas 4)</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {(Object.keys(frequency) as MuscleGroup[])
                .sort((a, b) => (frequency[b] ?? 0) - (frequency[a] ?? 0))
                .map(mg => (
                  <div key={mg} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-200">{MUSCLE_LABELS[mg]}</span>
                    <span className="font-semibold text-gray-900 dark:text-white tabular-nums">{(frequency[mg] ?? 0).toFixed(1)}×</span>
                  </div>
                ))}
            </div>
          </Card>

          <Card>
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary-500 mb-1">Tendencia de volumen</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Series de trabajo por semana · apoyo</p>
            <WeeklyVolumeChart data={byWeek} metric="sets" />
          </Card>
        </>
      )}
    </div>
  );
}
