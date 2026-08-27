import { useState } from 'react';
import { Download, Plus, Dumbbell, ClipboardList } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { RoutineCard } from '../components/routines/RoutineCard';
import { RoutineForm } from '../components/routines/RoutineForm';
import { ImportRoutine } from '../components/routines/ImportRoutine';
import { WorkoutSession } from '../components/workout/WorkoutSession';
import { parseRepRange } from '../lib/progression';
import { storage } from '../lib/storage';
import type { Routine, ParsedDay, ExerciseTemplate, Exercise, ExerciseCategory, MuscleGroup, WorkoutLog, ActiveSession } from '../types';

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
  onMove: (id: string, direction: 'up' | 'down') => void;
  getOrCreateExercise: (name: string, defaults?: Partial<Omit<Exercise, 'id' | 'createdAt' | 'nameLower' | 'name'>>, options?: { enrich?: boolean }) => Exercise;
  onSaveLog: (log: Omit<WorkoutLog, 'id'>) => void;
  autoEnrich: boolean;
  logs: WorkoutLog[];
}

export function RoutinesPage({ routines, exercises, onAdd, onUpdate, onDelete, onDuplicate, onMove, getOrCreateExercise, onSaveLog, autoEnrich, logs }: RoutinesPageProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [resumeSession, setResumeSession] = useState<ActiveSession | null>(() => storage.getActiveSession());
  const [resumeOpen, setResumeOpen] = useState(false);

  function closeSession() {
    setActiveRoutine(null);
    setResumeOpen(false);
    setResumeSession(null);
  }

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
        // Create or reuse the exercise in the global library, then link by id.
        // metricKind is an exercise-nature attribute → only applied to newly
        // created library entries (getOrCreate returns existing ones unchanged).
        const libExercise = getOrCreateExercise(ex.name, {
          muscleGroup: ex.muscleGroup,
          metricKind: ex.metricKind,
          videoUrl: ex.videoUrl,
          technicalNotes: ex.notes,
          category: categoryFromMuscle(ex.muscleGroup),
        }, { enrich: autoEnrich });

        // Derive an explicit rep range from `reps` (e.g. "8-12") when not given,
        // so double progression works out of the box. Only when it's a real range.
        const derived = ex.targetRepMin == null && ex.targetRepMax == null
          ? parseRepRange(ex.reps)
          : undefined;
        const targetRepMin = ex.targetRepMin ?? (derived && derived.min < derived.max ? derived.min : undefined);
        const targetRepMax = ex.targetRepMax ?? (derived && derived.min < derived.max ? derived.max : undefined);

        return {
          id: newId(),
          exerciseId: libExercise.id,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          restSeconds: ex.restSeconds,
          videoUrl: ex.videoUrl ?? libExercise.referenceUrl ?? libExercise.videoUrl,
          muscleGroup: ex.muscleGroup ?? libExercise.muscleGroup,
          notes: ex.notes,
          // Progression (prescription) carried from the import
          progressionMethod: ex.progressionMethod,
          targetRepMin,
          targetRepMax,
          targetRir: ex.targetRir,
          weightIncrement: ex.weightIncrement,
          priority: ex.priority,
          progressionNotes: ex.progressionNotes,
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
    <div className="space-y-6">
      <div className="mb-12 flex items-center justify-between gap-4">
        <h1 className="text-display text-content">Rutinas</h1>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
            <Download size={15} /> Importar
          </Button>
          <Button size="sm" onClick={() => { setEditingRoutine(null); setFormOpen(true); }}>
            <Plus size={15} /> Nueva
          </Button>
        </div>
      </div>

      {resumeSession && !resumeOpen && !activeRoutine && (
        <div className="flex items-center gap-4 rounded-card bg-ink-900 px-5 py-4">
          <Dumbbell size={20} className="shrink-0 text-white/70" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-strong text-white">Entrenamiento en curso</p>
            <p className="truncate text-caption text-white/50">{resumeSession.routineName}</p>
          </div>
          <Button size="sm" onClick={() => setResumeOpen(true)}>Retomar</Button>
          <button
            onClick={() => { storage.clearActiveSession(); setResumeSession(null); }}
            className="px-1 text-caption text-white/40 transition-colors hover:text-white"
          >
            Descartar
          </button>
        </div>
      )}

      {routines.length === 0 ? (
        <EmptyState
          icon={<ClipboardList />}
          title="No hay rutinas todavía"
          description="Creá tu primera rutina o importá una desde texto."
          action={
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setImportOpen(true)}>
                <Download size={16} /> Importar rutina
              </Button>
              <Button onClick={() => { setEditingRoutine(null); setFormOpen(true); }}>
                + Crear rutina
              </Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-3">
          {routines.map((routine, index) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              onStart={() => setActiveRoutine(routine)}
              onEdit={() => { setEditingRoutine(routine); setFormOpen(true); }}
              onDuplicate={() => onDuplicate(routine.id)}
              onDelete={() => {
                if (confirm(`¿Eliminar la rutina "${routine.name}"?`)) onDelete(routine.id);
              }}
              onMoveUp={() => onMove(routine.id, 'up')}
              onMoveDown={() => onMove(routine.id, 'down')}
              canMoveUp={index > 0}
              canMoveDown={index < routines.length - 1}
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

      {activeRoutine ? (
        <WorkoutSession
          routine={activeRoutine}
          exercises={exercises}
          logs={logs}
          onCancel={closeSession}
          onFinish={(log) => { onSaveLog(log); closeSession(); }}
        />
      ) : resumeOpen && resumeSession ? (
        <WorkoutSession
          resume={resumeSession}
          exercises={exercises}
          logs={logs}
          onCancel={closeSession}
          onFinish={(log) => { onSaveLog(log); closeSession(); }}
        />
      ) : null}
    </div>
  );
}
