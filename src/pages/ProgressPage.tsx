import { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { Card, SectionLabel } from '../components/ui/Card';
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
    <div>
      <header className="mb-12">
        <h1 className="text-display text-content">Progreso</h1>
        <p className="mt-1 text-caption text-content-muted">Análisis de tu entrenamiento</p>
      </header>

      {!hasData ? (
        <EmptyState icon={<BarChart3 />} title="Todavía no hay datos" description="Registrá algunos entrenamientos para ver tu progreso, PRs y distribución muscular." />
      ) : (
        <div className="space-y-6">
          <ProgressHighlights logs={logs} exercises={exercises} settings={settings} label="Destacados" />

          <Card>
            <SectionLabel>Distribución del entrenamiento</SectionLabel>
            <p className="mt-1.5 text-caption text-content-muted">
              Series de trabajo por grupo muscular · esta semana
            </p>
            {weekly.length > 0 ? (
              <MuscleVolumeChart data={weekly} />
            ) : (
              <p className="py-6 text-center text-caption text-content-muted">Sin series registradas esta semana.</p>
            )}
          </Card>

          <Card>
            <SectionLabel>Frecuencia por músculo</SectionLabel>
            <p className="mt-1.5 mb-4 text-caption text-content-muted">
              Días de entrenamiento por semana (promedio, últimas 4)
            </p>
            {/* Sin filete entre filas: en dos columnas los cortes no se alinean
                y lo que se lee es una rejilla rota, no una tabla. */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {(Object.keys(frequency) as MuscleGroup[])
                .sort((a, b) => (frequency[b] ?? 0) - (frequency[a] ?? 0))
                .map(mg => (
                  <div key={mg} className="grid grid-cols-[1fr_auto] items-baseline gap-3">
                    <span className="truncate text-body text-content">{MUSCLE_LABELS[mg]}</span>
                    <span className="font-mono text-metric text-content">
                      {(frequency[mg] ?? 0).toFixed(1)}×
                    </span>
                  </div>
                ))}
            </div>
          </Card>

          <Card>
            <SectionLabel>Tendencia de volumen</SectionLabel>
            <p className="mt-1.5 text-caption text-content-muted">Series de trabajo por semana · apoyo</p>
            <WeeklyVolumeChart data={byWeek} metric="sets" />
          </Card>
        </div>
      )}
    </div>
  );
}
