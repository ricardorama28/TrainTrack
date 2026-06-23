import { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { RestTimer } from './RestTimer';
import { todayStr } from '../../lib/dates';
import type { Routine, WorkoutLog, FeelingType, MuscleGroup, SetLog, ExerciseLog, Exercise } from '../../types';

interface WorkoutSessionProps {
  routine: Routine;
  exercises?: Exercise[];
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

function buildSession(routine: Routine, exercises?: Exercise[]): SessionExercise[] {
  return routine.exercises.map(ex => {
    const libExercise = ex.exerciseId ? exercises?.find(e => e.id === ex.exerciseId) : undefined;
    const count = ex.sets && ex.sets > 0 ? ex.sets : 1;
    const repsNum = parseRepsNumber(ex.reps);
    return {
      exerciseId: ex.exerciseId,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      targetReps: ex.reps,
      targetWeight: ex.weight,
      restSeconds: ex.restSeconds,
      notes: ex.notes ?? libExercise?.technicalNotes,
      videoUrl: ex.videoUrl ?? libExercise?.videoUrl,
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

export function WorkoutSession({ routine, exercises, defaultRestSeconds = 60, onFinish, onCancel }: WorkoutSessionProps) {
  const [session, setSession] = useState<SessionExercise[]>(() => buildSession(routine, exercises));
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
      <div className="fixed inset-0 z-50 bg-gray-950 overflow-y-auto">
        <div className="max-w-lg mx-auto p-5 space-y-6">
          <div className="text-center pt-8">
            <div className="text-6xl mb-3">🎉</div>
            <h2 className="text-3xl font-bold text-white">¡Listo!</h2>
            <p className="text-gray-400 mt-2">
              {routine.name} · {formatElapsed(Date.now() - startedAt)} · {doneSets}/{totalSets} series
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">¿Cómo te sentiste?</label>
            <div className="flex gap-2">
              {FEELINGS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFeeling(f.value)}
                  className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                    feeling === f.value
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                  }`}
                >
                  <span className="text-2xl">{f.icon}</span>
                  <span className="text-[10px] text-gray-300 font-semibold">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Notas</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Observaciones del entrenamiento..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-700 bg-gray-800 text-gray-100 text-sm resize-none placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pb-8">
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
    <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-white truncate">{routine.name}</p>
            <p className="text-xs text-gray-500 tabular-nums">⏱ {formatElapsed(elapsed)}</p>
          </div>
          <button
            onClick={() => {
              if (confirm('¿Abandonar el entrenamiento? Se perderá el progreso no guardado.')) onCancel();
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-700 text-gray-400 hover:text-white transition"
            aria-label="Abandonar"
          >
            ✕
          </button>
        </div>
        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-gray-500 mb-1.5">
            <span>Ejercicio {current + 1} de {session.length}</span>
            <span className="text-primary-400 font-semibold">{doneSets}/{totalSets} series</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {ex && (
          <div className="max-w-lg mx-auto space-y-5">
            {/* Exercise header */}
            <div className="space-y-2">
              <div className="flex items-start gap-3 flex-wrap">
                <h2 className="text-3xl font-extrabold text-white leading-tight flex-1">{ex.name}</h2>
                {ex.muscleGroup && (
                  <Badge variant="purple">{MUSCLE_LABELS[ex.muscleGroup]}</Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                {ex.targetReps && (
                  <span className="font-semibold text-gray-300">🎯 {ex.sets.length}×{ex.targetReps}</span>
                )}
                {ex.targetWeight != null && (
                  <span>🏋️ {ex.targetWeight} kg</span>
                )}
                {ex.videoUrl && (
                  <a
                    href={ex.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-accent-400 hover:text-accent-300 font-medium transition"
                  >
                    🎬 Ver video
                  </a>
                )}
              </div>
              {ex.notes && (
                <p className="text-sm text-gray-400 italic bg-gray-800/60 rounded-xl px-4 py-2.5 border border-gray-700/50">
                  {ex.notes}
                </p>
              )}
            </div>

            {/* Sets */}
            <div className="space-y-2">
              <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 px-1 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                <span>Set</span>
                <span>Peso (kg)</span>
                <span>Reps</span>
                <span />
              </div>
              {ex.sets.map((set, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 items-center rounded-2xl p-2.5 border-2 transition-all ${
                    set.completed
                      ? 'border-primary-500/60 bg-primary-500/8'
                      : 'border-gray-700 bg-gray-800/50'
                  }`}
                >
                  <span className={`text-center text-sm font-bold ${set.completed ? 'text-primary-400' : 'text-gray-400'}`}>{i + 1}</span>
                  <input
                    type="number"
                    step="0.5"
                    inputMode="decimal"
                    value={set.weight ?? ''}
                    onChange={e => updateSet(current, i, { weight: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="—"
                    className="w-full px-2 py-2 rounded-xl border border-gray-700 bg-gray-900 text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-600"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    value={set.reps ?? ''}
                    onChange={e => updateSet(current, i, { reps: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="—"
                    className="w-full px-2 py-2 rounded-xl border border-gray-700 bg-gray-900 text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-600"
                  />
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => toggleSet(i)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition active:scale-90 ${
                        set.completed
                          ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
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
                  className="flex-1 py-2.5 rounded-xl border border-dashed border-gray-700 text-sm text-gray-500 hover:text-gray-300 hover:border-gray-600 transition"
                >
                  + Agregar serie
                </button>
                {ex.sets.length > 1 && (
                  <button
                    onClick={() => removeSet(ex.sets.length - 1)}
                    className="px-4 py-2.5 rounded-xl border border-gray-700 text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition"
                  >
                    − Quitar
                  </button>
                )}
              </div>
            </div>

            {/* Rest timer launcher */}
            <button
              onClick={() => setResting(ex.restSeconds ?? defaultRestSeconds)}
              className="w-full py-3 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold border border-gray-700 hover:border-gray-600 transition"
            >
              ⏱ Iniciar descanso ({ex.restSeconds ?? defaultRestSeconds}s)
            </button>
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="flex-shrink-0 bg-gray-900 border-t border-gray-800 px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setCurrent(c => Math.max(0, c - 1))}
            disabled={current === 0}
          >
            ←
          </Button>
          {current < session.length - 1 ? (
            <Button variant="accent" onClick={() => setCurrent(c => c + 1)} fullWidth>
              Siguiente ejercicio →
            </Button>
          ) : (
            <Button onClick={() => setPhase('finishing')} fullWidth>
              🏁 Finalizar entrenamiento
            </Button>
          )}
          {current < session.length - 1 && (
            <Button variant="ghost" onClick={() => setPhase('finishing')} className="text-gray-500 text-xs">
              Fin
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
