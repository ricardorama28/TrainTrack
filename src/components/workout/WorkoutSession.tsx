import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { RestTimer } from './RestTimer';
import { HoldTimer } from './HoldTimer';
import { todayStr } from '../../lib/dates';
import { storage } from '../../lib/storage';
import type {
  Routine, WorkoutLog, FeelingType, MuscleGroup, SetLog, ExerciseLog, Exercise,
  ExerciseTemplate, SessionSet, SessionExercise, ActiveSession,
} from '../../types';

interface WorkoutSessionProps {
  /** A routine to start fresh. Ignored when `resume` is provided. */
  routine?: Routine;
  /** An in-progress session to restore. */
  resume?: ActiveSession;
  exercises?: Exercise[];
  defaultRestSeconds?: number;
  onFinish: (log: Omit<WorkoutLog, 'id'>) => void;
  onCancel: () => void;
}

/** A single step in the guided flow: one set of one exercise. */
interface Step {
  exIdx: number;
  setIdx: number;
}

/** YouTube search deep-link fallback when no reference is available. */
function ytSearchUrl(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' ejercicio técnica')}`;
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

/** Whether an exercise is measured by time rather than reps. */
function isTimeBased(ex: ExerciseTemplate): boolean {
  if (ex.unit) return ex.unit === 'seconds';
  return /seg|segundo|min|'|"/i.test(ex.reps ?? ''); // legacy detection
}

/** Parse a duration string into seconds ("30 seg" → 30, "1 min" → 60). */
function parseDuration(reps?: string): number | undefined {
  if (!reps) return undefined;
  const m = /(\d+)\s*(min|m|seg|segundos?|s|')?/i.exec(reps);
  if (!m) return undefined;
  const n = parseInt(m[1]);
  const unit = (m[2] ?? '').toLowerCase();
  if (unit === 'min' || unit === 'm' || unit === "'") return n * 60;
  return n;
}

function buildSession(routine: Routine, exercises?: Exercise[]): SessionExercise[] {
  return routine.exercises.map(ex => {
    const lib = ex.exerciseId ? exercises?.find(e => e.id === ex.exerciseId) : undefined;
    const count = ex.sets && ex.sets > 0 ? ex.sets : 1;
    const timeBased = isTimeBased(ex);
    const repsNum = timeBased ? undefined : parseRepsNumber(ex.reps);
    const targetSeconds = timeBased ? (parseDuration(ex.reps) ?? 30) : undefined;
    return {
      exerciseId: ex.exerciseId,
      name: ex.name,
      muscleGroup: ex.muscleGroup ?? lib?.muscleGroup,
      unit: timeBased ? 'seconds' : 'reps',
      targetReps: ex.reps,
      targetWeight: ex.weight,
      targetSeconds,
      restSeconds: ex.restSeconds,
      notes: ex.notes ?? lib?.technicalNotes,
      description: lib?.description,
      primaryMuscles: lib?.primaryMuscles,
      referenceUrl: ex.videoUrl ?? lib?.referenceUrl ?? lib?.videoUrl,
      sets: Array.from({ length: count }, () => ({
        weight: ex.weight,
        reps: repsNum,
        seconds: undefined,
        completed: false,
      })),
    };
  });
}

/** Flatten the session into an ordered list of (exercise, set) steps. */
function buildSteps(session: SessionExercise[], setOrder: 'sequential' | 'circuit'): Step[] {
  const steps: Step[] = [];
  if (setOrder === 'circuit') {
    const maxSets = session.reduce((m, e) => Math.max(m, e.sets.length), 0);
    for (let r = 0; r < maxSets; r++) {
      session.forEach((e, exIdx) => {
        if (r < e.sets.length) steps.push({ exIdx, setIdx: r });
      });
    }
  } else {
    session.forEach((e, exIdx) => e.sets.forEach((_, setIdx) => steps.push({ exIdx, setIdx })));
  }
  return steps;
}

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function WorkoutSession({ routine, resume, exercises, defaultRestSeconds = 60, onFinish, onCancel }: WorkoutSessionProps) {
  const init = resume ?? null;

  const routineId = init?.routineId ?? routine?.id;
  const routineName = init?.routineName ?? routine?.name ?? 'Entrenamiento';
  const routineType: 'workout' | 'active-rest' =
    init?.type ?? (routine?.type === 'active-rest' ? 'active-rest' : 'workout');

  const [session, setSession] = useState<SessionExercise[]>(
    () => init?.session ?? buildSession(routine!, exercises),
  );
  const [setOrder, setSetOrder] = useState<'sequential' | 'circuit'>(
    () => init?.setOrder ?? routine?.setOrder ?? 'sequential',
  );
  // If a rest was running when we left, restore it (or, if it already elapsed
  // while away, move on to the next step since the set was already marked done).
  const resumedRestActive = init?.restEndsAt != null && init.restEndsAt > Date.now();
  const [currentStep, setCurrentStep] = useState(() => {
    if (init?.restEndsAt != null && init.restEndsAt <= Date.now()) return init.currentStep + 1;
    return init?.currentStep ?? 0;
  });
  const [startedAt] = useState(() => init?.startedAt ?? Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [restEndsAt, setRestEndsAt] = useState<number | null>(
    () => (resumedRestActive ? init!.restEndsAt! : null),
  );
  const [restTotal, setRestTotal] = useState(() => init?.restTotal ?? defaultRestSeconds);
  const [holding, setHolding] = useState(false);
  const [phase, setPhase] = useState<'active' | 'finishing'>('active');

  // Finishing form state
  const [feeling, setFeeling] = useState<FeelingType | ''>('');
  const [notes, setNotes] = useState('');

  const steps = useMemo(() => buildSteps(session, setOrder), [session, setOrder]);
  const safeStep = steps.length > 0 ? Math.min(currentStep, steps.length - 1) : 0;
  const step = steps[safeStep];
  const exIdx = step?.exIdx ?? 0;
  const activeSetIdx = step?.setIdx ?? 0;
  const ex = session[exIdx];
  const activeSet = ex?.sets[activeSetIdx];

  // Elapsed timer
  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  // Persist the in-progress session so a reload / app-switch / phone-lock can resume it.
  useEffect(() => {
    const blob: ActiveSession = {
      routineId,
      routineName,
      type: routineType,
      setOrder,
      startedAt,
      session,
      currentStep: safeStep,
      restEndsAt: restEndsAt ?? undefined,
      restTotal,
      savedAt: Date.now(),
    };
    storage.setActiveSession(blob);
  }, [session, safeStep, setOrder, restEndsAt, restTotal, startedAt, routineId, routineName, routineType]);

  const totalSets = useMemo(() => session.reduce((n, e) => n + e.sets.length, 0), [session]);
  const doneSets = useMemo(
    () => session.reduce((n, e) => n + e.sets.filter(s => s.completed).length, 0),
    [session],
  );
  const progress = totalSets > 0 ? doneSets / totalSets : 0;

  // Stable refs so timer callbacks don't churn the timer effects each render.
  const stepRef = useRef(safeStep);
  stepRef.current = safeStep;
  const stepsLenRef = useRef(steps.length);
  stepsLenRef.current = steps.length;

  const advance = useCallback(() => {
    const cur = stepRef.current;
    if (cur + 1 >= stepsLenRef.current) setPhase('finishing');
    else setCurrentStep(cur + 1);
  }, []);

  const endRest = useCallback(() => {
    setRestEndsAt(null);
    advance();
  }, [advance]);

  const adjustRest = useCallback((delta: number) => {
    setRestEndsAt(e => (e == null ? e : e + delta * 1000));
    setRestTotal(t => Math.max(1, t + delta));
  }, []);

  function startRest(seconds: number) {
    setRestTotal(seconds);
    setRestEndsAt(Date.now() + seconds * 1000);
  }

  function updateSet(exiIdx: number, setIdx: number, updates: Partial<SessionSet>) {
    setSession(prev =>
      prev.map((e, i) => {
        if (i !== exiIdx) return e;
        return { ...e, sets: e.sets.map((s, j) => (j === setIdx ? { ...s, ...updates } : s)) };
      }),
    );
  }

  /** After the active set is completed: rest then auto-advance, or finish. */
  function afterActiveCompleted() {
    if (safeStep + 1 >= steps.length) {
      setPhase('finishing');
    } else {
      startRest(ex.restSeconds ?? defaultRestSeconds);
    }
  }

  function toggleSet(setIdx: number) {
    const was = ex.sets[setIdx].completed;
    updateSet(exIdx, setIdx, { completed: !was });
    if (!was && setIdx === activeSetIdx) afterActiveCompleted();
  }

  function onHoldComplete(seconds: number) {
    setHolding(false);
    updateSet(exIdx, activeSetIdx, { seconds, completed: true });
    afterActiveCompleted();
  }

  function onHoldStop(elapsedSeconds: number) {
    setHolding(false);
    // Record what was held but leave the set open so it can be ticked manually.
    updateSet(exIdx, activeSetIdx, { seconds: elapsedSeconds });
  }

  function addSet() {
    const last = ex.sets[ex.sets.length - 1];
    setSession(prev =>
      prev.map((e, i) =>
        i === exIdx
          ? { ...e, sets: [...e.sets, { weight: last?.weight, reps: last?.reps, seconds: undefined, completed: false }] }
          : e,
      ),
    );
  }

  function removeSet(setIdx: number) {
    setSession(prev =>
      prev.map((e, i) => (i === exIdx ? { ...e, sets: e.sets.filter((_, j) => j !== setIdx) } : e)),
    );
  }

  function buildLog(): Omit<WorkoutLog, 'id'> {
    const exercises: ExerciseLog[] = session.map(e => ({
      exerciseId: e.exerciseId ?? '',
      exerciseName: e.name,
      sets: e.sets.map((s): SetLog => ({
        reps: e.unit === 'seconds' ? undefined : s.reps,
        seconds: e.unit === 'seconds' ? s.seconds : undefined,
        weight: s.weight,
        completed: s.completed,
      })),
      notes: e.notes,
    }));
    return {
      date: todayStr(),
      type: routineType,
      routineId,
      routineName,
      duration: Math.max(1, Math.round((Date.now() - startedAt) / 60000)),
      feeling: feeling || undefined,
      notes: notes || undefined,
      exercises,
    };
  }

  function handleFinish() {
    storage.clearActiveSession();
    onFinish(buildLog());
  }

  function abandon() {
    if (confirm('¿Abandonar el entrenamiento? Se perderá el progreso no guardado.')) {
      storage.clearActiveSession();
      onCancel();
    }
  }

  const timeBased = ex?.unit === 'seconds';

  // ── Finishing screen ─────────────────────────────────────────────────────────
  if (phase === 'finishing') {
    return (
      <div className="fixed inset-0 z-50 bg-gray-950 overflow-y-auto">
        <div className="max-w-lg mx-auto p-5 space-y-6">
          <div className="text-center pt-8">
            <div className="text-6xl mb-3">🎉</div>
            <h2 className="text-3xl font-bold text-white">¡Listo!</h2>
            <p className="text-gray-400 mt-2">
              {routineName} · {formatElapsed(Date.now() - startedAt)} · {doneSets}/{totalSets} series
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
            <Button onClick={handleFinish} className="flex-1">
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
            <p className="font-bold text-white truncate">{routineName}</p>
            <p className="text-xs text-gray-500 tabular-nums">⏱ {formatElapsed(elapsed)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSetOrder(o => (o === 'sequential' ? 'circuit' : 'sequential'))}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 transition"
              title="Cambiar orden de series"
            >
              {setOrder === 'sequential' ? '↓ Seguidas' : '⟳ Circuito'}
            </button>
            <button
              onClick={abandon}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-700 text-gray-400 hover:text-white transition"
              aria-label="Abandonar"
            >
              ✕
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-gray-500 mb-1.5">
            <span>Ejercicio {exIdx + 1} de {session.length} · Serie {activeSetIdx + 1}/{ex?.sets.length ?? 0}</span>
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
              <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                {timeBased ? (
                  <span className="font-semibold text-gray-300">🎯 {ex.sets.length}×{ex.targetSeconds ?? 30}s</span>
                ) : ex.targetReps && (
                  <span className="font-semibold text-gray-300">🎯 {ex.sets.length}×{ex.targetReps}</span>
                )}
                {ex.targetWeight != null && (
                  <span>🏋️ {ex.targetWeight} kg</span>
                )}
                {ex.referenceUrl ? (
                  <a
                    href={ex.referenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-accent-400 hover:text-accent-300 font-medium transition"
                  >
                    🎬 Ver referencia
                  </a>
                ) : (
                  <a
                    href={ytSearchUrl(ex.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-gray-400 hover:text-gray-200 font-medium transition"
                  >
                    🔎 Buscar en YouTube
                  </a>
                )}
              </div>
              {ex.primaryMuscles && ex.primaryMuscles.length > 0 && (
                <p className="text-xs text-gray-500">💪 {ex.primaryMuscles.join(' · ')}</p>
              )}
              {ex.description && (
                <p className="text-sm text-gray-300 bg-gray-800/60 rounded-xl px-4 py-2.5 border border-gray-700/50">
                  {ex.description}
                </p>
              )}
              {ex.notes && (
                <p className="text-sm text-gray-400 italic">
                  📝 {ex.notes}
                </p>
              )}
            </div>

            {/* Sets */}
            <div className="space-y-2">
              <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 px-1 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                <span>Set</span>
                <span>Peso (kg)</span>
                <span>{timeBased ? 'Seg' : 'Reps'}</span>
                <span />
              </div>
              {ex.sets.map((set, i) => {
                const isActive = i === activeSetIdx;
                return (
                  <div
                    key={i}
                    className={`grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 items-center rounded-2xl p-2.5 border-2 transition-all ${
                      set.completed
                        ? 'border-primary-500/60 bg-primary-500/8'
                        : isActive
                          ? 'border-accent-500/70 bg-accent-500/8 ring-1 ring-accent-500/40'
                          : 'border-gray-700 bg-gray-800/50'
                    }`}
                  >
                    <span className={`text-center text-sm font-bold ${set.completed ? 'text-primary-400' : isActive ? 'text-accent-400' : 'text-gray-400'}`}>{i + 1}</span>
                    <input
                      type="number"
                      step="0.5"
                      inputMode="decimal"
                      value={set.weight ?? ''}
                      onChange={e => updateSet(exIdx, i, { weight: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="—"
                      className="w-full px-2 py-2 rounded-xl border border-gray-700 bg-gray-900 text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-600"
                    />
                    {timeBased ? (
                      <input
                        type="number"
                        inputMode="numeric"
                        value={set.seconds ?? ''}
                        onChange={e => updateSet(exIdx, i, { seconds: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder={ex.targetSeconds ? String(ex.targetSeconds) : '—'}
                        className="w-full px-2 py-2 rounded-xl border border-gray-700 bg-gray-900 text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-600"
                      />
                    ) : (
                      <input
                        type="number"
                        inputMode="numeric"
                        value={set.reps ?? ''}
                        onChange={e => updateSet(exIdx, i, { reps: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="—"
                        className="w-full px-2 py-2 rounded-xl border border-gray-700 bg-gray-900 text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-600"
                      />
                    )}
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
                );
              })}

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

            {/* Primary action: start hold (time-based) or start rest */}
            {timeBased && activeSet && !activeSet.completed ? (
              <button
                onClick={() => setHolding(true)}
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-base font-bold active:scale-95 transition shadow-lg shadow-amber-500/25"
              >
                ▶ Iniciar serie · {ex.targetSeconds ?? 30}s
              </button>
            ) : (
              <button
                onClick={() => startRest(ex.restSeconds ?? defaultRestSeconds)}
                className="w-full py-3 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold border border-gray-700 hover:border-gray-600 transition"
              >
                ⏱ Iniciar descanso ({ex.restSeconds ?? defaultRestSeconds}s)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="flex-shrink-0 bg-gray-900 border-t border-gray-800 px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setCurrentStep(s => Math.max(0, Math.min(s, steps.length - 1) - 1))}
            disabled={safeStep === 0}
          >
            ←
          </Button>
          {safeStep < steps.length - 1 ? (
            <Button variant="accent" onClick={() => setCurrentStep(safeStep + 1)} fullWidth>
              Siguiente serie →
            </Button>
          ) : (
            <Button onClick={() => setPhase('finishing')} fullWidth>
              🏁 Finalizar entrenamiento
            </Button>
          )}
          {safeStep < steps.length - 1 && (
            <Button variant="ghost" onClick={() => setPhase('finishing')} className="text-gray-500 text-xs">
              Fin
            </Button>
          )}
        </div>
      </div>

      {/* Hold timer overlay (time-based exercises) */}
      {holding && ex && (
        <HoldTimer
          seconds={ex.targetSeconds ?? 30}
          onComplete={onHoldComplete}
          onStop={onHoldStop}
        />
      )}

      {/* Rest timer overlay */}
      {restEndsAt != null && (
        <RestTimer
          endsAt={restEndsAt}
          total={restTotal}
          onDone={endRest}
          onSkip={endRest}
          onAdjust={adjustRest}
        />
      )}
    </div>
  );
}
