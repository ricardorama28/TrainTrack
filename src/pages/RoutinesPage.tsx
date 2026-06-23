import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { RoutineCard } from '../components/routines/RoutineCard';
import { RoutineForm } from '../components/routines/RoutineForm';
import { ImportRoutine } from '../components/routines/ImportRoutine';
import { WorkoutSession } from '../components/workout/WorkoutSession';
import type { Routine, ParsedDay, ExerciseTemplate, Exercise, ExerciseCategory, MuscleGroup, WorkoutLog } from '../types';

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Derive a default category from a muscle group for newly created exercises */
function categoryFromMuscle(mg?: MuscleGroup): ExerciseCategory {
  if (mg === 'mobility') return 'mobility';
  if (mg === 'core') return 'core';
  return 'strength';
}

interface RoutinesPageProps {
  routines: Routine[];
  exercises: Exercise[];
  onAdd: (routine: Omit<Routine, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Omit<Routine, 'id' | 'createdAt'>>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  getOrCreateExercise: (name: string, defaults?: Partial<Omit<Exercise, 'id' | 'createdAt' | 'nameLower' | 'name'>>) => Exercise;
  onSaveLog: (log: Omit<WorkoutLog, 'id'>) => void;
}

export function RoutinesPage({ routines, exercises, onAdd, onUpdate, onDelete, onDuplicate, getOrCreateExercise, onSaveLog }: RoutinesPageProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);

  function handleSaveRoutine(data: Omit<Routine, 'id' | 'createdAt'>) {
    if (editingRoutine) {
      onUpdate(editingRoutine.id, data);
    } else {
      onAdd(data);
    }
    setEditingRoutine(null);
  }

  function handleImport(days: ParsedDay[]) {
    for (const day of days) {
      const exercises: ExerciseTemplate[] = day.exercises.map(ex => {
        // Create or reuse the exercise in the global library, then link by id
        const libExercise = getOrCreateExercise(ex.name, {
          muscleGroup: ex.muscleGroup,
          videoUrl: ex.videoUrl,
          technicalNotes: ex.notes,
          category: categoryFromMuscle(ex.muscleGroup),
        });

        return {
          id: newId(),
          exerciseId: libExercise.id,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          restSeconds: ex.restSeconds,
          videoUrl: ex.videoUrl ?? libExercise.videoUrl,
          muscleGroup: ex.muscleGroup ?? libExercise.muscleGroup,
          notes: ex.notes,
        };
      });

      onAdd({
        name: day.name,
        description: day.notes || undefined,
        type: day.type,
        exercises,
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rutinas</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
            📥 Importar
          </Button>
          <Button size="sm" onClick={() => { setEditingRoutine(null); setFormOpen(true); }}>
            + Nueva
          </Button>
        </div>
      </div>

      {routines.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No hay rutinas todavía"
          description="Creá tu primera rutina o importá una desde texto."
          action={
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setImportOpen(true)}>
                📥 Importar rutina
              </Button>
              <Button onClick={() => { setEditingRoutine(null); setFormOpen(true); }}>
                + Crear rutina
              </Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-3">
          {routines.map(routine => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              onStart={() => setActiveRoutine(routine)}
              onEdit={() => { setEditingRoutine(routine); setFormOpen(true); }}
              onDuplicate={() => onDuplicate(routine.id)}
              onDelete={() => {
                if (confirm(`¿Eliminar la rutina "${routine.name}"?`)) onDelete(routine.id);
              }}
            />
          ))}
        </div>
      )}

      <RoutineForm
        key={editingRoutine?.id ?? 'new'}
        open={formOpen}
        routine={editingRoutine ?? undefined}
        onClose={() => { setFormOpen(false); setEditingRoutine(null); }}
        onSave={handleSaveRoutine}
      />

      <ImportRoutine
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
      />

      {activeRoutine && (
        <WorkoutSession
          routine={activeRoutine}
          exercises={exercises}
          onCancel={() => setActiveRoutine(null)}
          onFinish={(log) => { onSaveLog(log); setActiveRoutine(null); }}
        />
      )}
    </div>
  );
}
