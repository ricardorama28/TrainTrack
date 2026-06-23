import { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { RestTimer } from './RestTimer';
import { todayStr } from '../../lib/dates';
import type { Routine, WorkoutLog, FeelingType, MuscleGroup, SetLog, ExerciseLog } from '../../types';

interface WorkoutSessionProps {
  routine: Routine;
  defaultRestSeconds?: number;
  onFinish: (log: Omit<WorkoutLog, 'id'>) => void;
  onCancel: () => void;
}

interface SessionSet {
  weight?: number;
  reps?: number;
  completed: boolean;
}

interface SessionExercise {
  exerciseId?: string;
  name: string;
  muscleGroup?: MuscleGroup;
  targetReps?: string;
  targetWeight?: number;
  restSeconds?: number;
  notes?: string;
  videoUrl?: string;
  sets: SessionSet[];
}

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  glutes: 'Glúteos', legs: 'Piernas', back: 'Espalda', chest: 'Pecho',
  shoulders: 'Hombros', arms: 'Brazos', core: 'Core', 'full-body': 'Full Body',
  mobility: 'Movilidad', other: 'Otro',
};

const FEELINGS: { value: FeelingType; label: string; icon: string }[] = [
  { value: 'easy', label: 'Fácil', icon: '😊' },
  { value: 'normal', label: 'Normal', icon: '😐' },
  { value: 'hard', label: 'Difícil', icon: '😤' },
  { value: 'very-hard', label: 'Muy difícil', icon: '🥵' },
];

/** Extract a leading integer from a reps string ("10-12" → 10, "30 seg" → 30) */
function parseRepsNumber(reps?: string): number | undefined {
  if (!reps) return undefined;
  const m = /\d+/.exec(reps);
  return m ? parseInt(m[0]) : undefined;
}

function buildSession(routine: Routine): SessionExercise[] {
  return routine.exercises.map(ex => {
    const count = ex.sets && ex.sets > 0 ? ex.sets : 1;
    const repsNum = parseRepsNumber(ex.reps);
    return {
      exerciseId: ex.exerciseId,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      targetReps: ex.reps,
      targetWeight: ex.weight,
      restSeconds: ex.restSeconds,
      notes: ex.notes,
      videoUrl: ex.videoUrl,
      sets: Array.from({ length: count }, () => ({
        weight: ex.weight,
        reps: repsNum,
        completed: false,
      })),
    };
  });
}

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function WorkoutSession({ routine, defaultRestSeconds = 60, onFinish, onCancel }: WorkoutSessionProps) {
  const [session, setSession] = useState<SessionExercise[]>(() => buildSession(routine));
  const [current, setCurrent] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [resting, setResting] = useState<number | null>(null);
  const [phase, setPhase] = useState<'active' | 'finishing'>('active');

  // Finishing form state
  const [feeling, setFeeling] = useState<FeelingType | ''>('');
  const [notes, setNotes] = useState('');

  // Elapsed timer
  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const ex = session[current];

  const totalSets = useMemo(() => session.reduce((n, e) => n + e.sets.length, 0), [session]);
  const doneSets = useMemo(
    () => session.reduce((n, e) => n + e.sets.filter(s => s.completed).length, 0),
    [session],
  );
  const progress = totalSets > 0 ? doneSets / totalSets : 0;

  function updateSet(exIdx: number, setIdx: number, updates: Partial<SessionSet>) {
    setSession(prev =>
      prev.map((e, i) => {
        if (i !== exIdx) return e;
        return { ...e, sets: e.sets.map((s, j) => (j === setIdx ? { ...s, ...updates } : s)) };
      }),
    );
  }

  function toggleSet(setIdx: number) {
    const wasCompleted = ex.sets[setIdx].completed;
    updateSet(current, setIdx, { completed: !wasCompleted });
    // Starting rest when a set is marked done
    if (!wasCompleted) {
      setResting(ex.restSeconds ?? defaultRestSeconds);
    }
  }

  function addSet() {
    const last = ex.sets[ex.sets.length - 1];
    setSession(prev =>
      prev.map((e, i) =>
        i === current
          ? { ...e, sets: [...e.sets, { weight: last?.weight, reps: last?.reps, completed: false }] }
          : e,
      ),
    );
  }

  function removeSet(setIdx: number) {
    setSession(prev =>
      prev.map((e, i) => (i === current ? { ...e, sets: e.sets.filter((_, j) => j !== setIdx) } : e)),
    );
  }

  function buildLog(): Omit<WorkoutLog, 'id'> {
    const exercises: ExerciseLog[] = session.map(e => ({
      exerciseId: e.exerciseId ?? '',
      exerciseName: e.name,
      sets: e.sets.map((s): SetLog => ({
        reps: s.reps,
        weight: s.weight,
        completed: s.completed,
      })),
      notes: e.notes,
    }));
    return {
      date: todayStr(),
      type: routine.type === 'active-rest' ? 'active-rest' : 'workout',
      routineId: routine.id,
      routineName: routine.name,
      duration: Math.max(1, Math.round((Date.now() - startedAt) / 60000)),
      feeling: feeling || undefined,
      notes: notes || undefined,
      exercises,
    };
  }

  // ── Finishing screen ─────────────────────────────────────────────────────────
  if (phase === 'finishing') {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 overflow-y-auto">
        <div className="max-w-lg mx-auto p-5 space-y-6">
          <div className="text-center pt-4">
            <div className="text-5xl mb-2">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">¡Entrenamiento completo!</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {routine.name} · {formatElapsed(Date.now() - startedAt)} · {doneSets}/{totalSets} series
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">¿Cómo te sentiste?</label>
            <div className="flex gap-2">
              {FEELINGS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFeeling(f.value)}
                  className={`flex-1 flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${
                    feeling === f.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl">{f.icon}</span>
                  <span className="text-[10px] text-gray-600 dark:text-gray-300 font-medium">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Observaciones del entrenamiento..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm resize-none"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setPhase('active')} className="flex-1">
              ← Volver
            </Button>
            <Button onClick={() => onFinish(buildLog())} className="flex-1">
              Guardar entrenamiento
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active session ───────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white truncate">{routine.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">⏱ {formatElapsed(elapsed)}</p>
          </div>
          <button
            onClick={() => {
              if (confirm('¿Abandonar el entrenamiento? Se perderá el progreso no guardado.')) onCancel();
            }}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            aria-label="Abandonar"
          >
            ✕
          </button>
        </div>
        {/* Progress bar */}
        <div className="mt-2.5">
          <div className="flex justify-between text-[11px] text-gray-400 dark:text-gray-500 mb-1">
            <span>Ejercicio {current + 1} de {session.length}</span>
            <span>{doneSets}/{totalSets} series</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {ex && (
          <div className="max-w-lg mx-auto space-y-4">
            {/* Exercise header */}
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{ex.name}</h2>
                {ex.muscleGroup && <Badge variant="purple">{MUSCLE_LABELS[ex.muscleGroup]}</Badge>}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                {ex.targetReps && <span>🎯 {ex.sets.length}×{ex.targetReps}</span>}
                {ex.targetWeight != null && <span>🏋️ {ex.targetWeight} kg</span>}
                {ex.videoUrl && (
                  <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400">
                    🎬 Video
                  </a>
                )}
              </div>
              {ex.notes && (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 mt-2">
                  {ex.notes}
                </p>
              )}
            </div>

            {/* Sets */}
            <div className="space-y-2">
              <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 px-1 text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                <span>Set</span>
                <span>Peso (kg)</span>
                <span>Reps</span>
                <span />
              </div>
              {ex.sets.map((set, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 items-center rounded-xl p-2 border-2 transition-colors ${
                    set.completed
                      ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
                >
                  <span className="text-center text-sm font-semibold text-gray-600 dark:text-gray-300">{i + 1}</span>
                  <input
                    type="number"
                    step="0.5"
                    inputMode="decimal"
                    value={set.weight ?? ''}
                    onChange={e => updateSet(current, i, { weight: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="—"
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm text-center"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    value={set.reps ?? ''}
                    onChange={e => updateSet(current, i, { reps: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="—"
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm text-center"
                  />
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => toggleSet(i)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition active:scale-90 ${
                        set.completed
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      title={set.completed ? 'Marcar como pendiente' : 'Completar serie'}
                    >
                      ✓
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={addSet}
                  className="flex-1 py-2 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  + Agregar serie
                </button>
                {ex.sets.length > 1 && (
                  <button
                    onClick={() => removeSet(ex.sets.length - 1)}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    − Quitar
                  </button>
                )}
              </div>
            </div>

            {/* Rest timer launcher */}
            <button
              onClick={() => setResting(ex.restSeconds ?? defaultRestSeconds)}
              className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              ⏱ Iniciar descanso ({ex.restSeconds ?? defaultRestSeconds}s)
            </button>
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setCurrent(c => Math.max(0, c - 1))}
            disabled={current === 0}
          >
            ←
          </Button>
          {current < session.length - 1 ? (
            <Button onClick={() => setCurrent(c => c + 1)} fullWidth>
              Siguiente ejercicio →
            </Button>
          ) : (
            <Button onClick={() => setPhase('finishing')} fullWidth>
              🏁 Finalizar entrenamiento
            </Button>
          )}
          {current < session.length - 1 && (
            <Button variant="ghost" onClick={() => setPhase('finishing')} className="text-gray-500">
              Finalizar
            </Button>
          )}
        </div>
      </div>

      {/* Rest timer overlay */}
      {resting != null && (
        <RestTimer
          seconds={resting}
          onDone={() => setResting(null)}
          onSkip={() => setResting(null)}
        />
      )}
    </div>
  );
}
