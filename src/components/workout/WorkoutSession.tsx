import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Timer, Target, Dumbbell, Clapperboard, Search, StickyNote, Pin, Check, X,
  ArrowLeft, ArrowRight, ArrowDown, Repeat, Flag, Trophy, Play,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { IntensityMeter } from '../ui/IntensityMeter';
import { RestTimer } from './RestTimer';
import { HoldTimer } from './HoldTimer';
import { todayStr } from '../../lib/dates';
import { storage } from '../../lib/storage';
import { MUSCLE_LABELS } from '../../lib/labels';
import { buildSessionExercises, buildWorkoutLog, lastWorkingSetIndex } from '../../lib/session';
import type {
  Routine, WorkoutLog, FeelingType, SessionSet, SessionExercise, ActiveSession, Exercise,
} from '../../types';

interface WorkoutSessionProps {
  /** A routine to start fresh. Ignored when `resume` is provided. */
  routine?: Routine;
  /** An in-progress session to restore. */
  resume?: ActiveSession;
  exercises?: Exercise[];
  /** Full workout history, used to compute each exercise's "objetivo de hoy". */
  logs?: WorkoutLog[];
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

export function WorkoutSession({ routine, resume, exercises, logs = [], defaultRestSeconds = 60, onFinish, onCancel }: WorkoutSessionProps) {
  const init = resume ?? null;

  const routineId = init?.routineId ?? routine?.id;
  const routineName = init?.routineName ?? routine?.name ?? 'Entrenamiento';
  const routineType: 'workout' | 'active-rest' =
    init?.type ?? (routine?.type === 'active-rest' ? 'active-rest' : 'workout');

  // A resumed session keeps its persisted state (incl. its plannedTarget snapshot);
  // a fresh session computes each exercise's "objetivo de hoy" from history.
  const [session, setSession] = useState<SessionExercise[]>(
    () => init?.session ?? buildSessionExercises(routine!, exercises, logs, storage.getSettings()),
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
          ? { ...e, sets: [...e.sets, { weight: last?.weight, reps: last?.reps, seconds: undefined, completed: false, type: 'working', rir: undefined }] }
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
    return buildWorkoutLog(session, {
      date: todayStr(),
      type: routineType,
      routineId,
      routineName,
      duration: Math.max(1, Math.round((Date.now() - startedAt) / 60000)),
      feeling: feeling || undefined,
      notes: notes || undefined,
    });
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
      <div className="fixed inset-0 z-50 bg-ink-950 overflow-y-auto">
        <div className="max-w-lg mx-auto p-5 space-y-6">
          <div className="text-center pt-8">
            <div className="flex justify-center mb-3"><Trophy size={56} className="text-primary-400" /></div>
            <h2 className="text-display text-white">¡Listo!</h2>
            <p className="mt-2 font-mono text-gray-400">
              {routineName} · {formatElapsed(Date.now() - startedAt)} · {doneSets}/{totalSets} series
            </p>
          </div>

          <div>
            <label className="mb-3 block text-overline uppercase text-gray-400">Esfuerzo de la sesión</label>
            <IntensityMeter value={feeling} onChange={setFeeling} dark />
          </div>

          <div>
            <label className="mb-2 block text-overline uppercase text-gray-400">Notas</label>
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
              <ArrowLeft size={16} /> Volver
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
    <div className="fixed inset-0 z-50 bg-ink-950 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-ink-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-body-strong text-white">{routineName}</p>
            <p className="inline-flex items-center gap-1 font-mono text-caption text-gray-500"><Timer size={12} /> {formatElapsed(elapsed)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSetOrder(o => (o === 'sequential' ? 'circuit' : 'sequential'))}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 transition"
              title="Cambiar orden de series"
            >
              {setOrder === 'sequential' ? <><ArrowDown size={13} /> Seguidas</> : <><Repeat size={13} /> Circuito</>}
            </button>
            <button
              onClick={abandon}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-700 text-gray-400 hover:text-white transition"
              aria-label="Abandonar"
            >
              <X size={18} />
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
                  <span className="inline-flex items-center gap-1 font-mono text-metric text-gray-200"><Target size={14} /> {ex.sets.length}×{ex.targetSeconds ?? 30}s</span>
                ) : ex.targetReps && (
                  <span className="inline-flex items-center gap-1 font-mono text-metric text-gray-200"><Target size={14} /> {ex.sets.length}×{ex.targetReps}</span>
                )}
                {ex.targetWeight != null && (
                  <span className="inline-flex items-center gap-1 font-mono text-metric text-gray-200"><Dumbbell size={14} /> {ex.targetWeight} kg</span>
                )}
                {ex.referenceUrl ? (
                  <a
                    href={ex.referenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-accent-400 hover:text-accent-300 font-medium transition"
                  >
                    <Clapperboard size={14} /> Ver referencia
                  </a>
                ) : (
                  <a
                    href={ytSearchUrl(ex.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-gray-400 hover:text-gray-200 font-medium transition"
                  >
                    <Search size={14} /> Buscar en YouTube
                  </a>
                )}
              </div>
              {ex.primaryMuscles && ex.primaryMuscles.length > 0 && (
                <p className="inline-flex items-center gap-1 text-xs text-gray-500"><Dumbbell size={12} /> {ex.primaryMuscles.join(' · ')}</p>
              )}
              {ex.description && (
                <p className="text-sm text-gray-300 bg-gray-800/60 rounded-xl px-4 py-2.5 border border-gray-700/50">
                  {ex.description}
                </p>
              )}
              {ex.notes && (
                <p className="inline-flex items-start gap-1.5 text-sm text-gray-400 italic">
                  <StickyNote size={14} className="mt-0.5 shrink-0" /> {ex.notes}
                </p>
              )}
            </div>

            {/* Objetivo de hoy (progression suggestion) */}
            {ex.plannedTarget && ex.plannedTarget.action !== 'repeat' && (
              <div className="rounded-2xl border border-primary-500/40 bg-primary-500/8 px-4 py-3 space-y-1">
                <p className="inline-flex flex-wrap items-center gap-x-1 font-mono text-metric text-primary-300">
                  <Target size={15} className="shrink-0" /> Objetivo de hoy:{' '}
                  {ex.plannedTarget.targetWeight != null && <span>{ex.plannedTarget.targetWeight} kg</span>}
                  {ex.plannedTarget.targetReps && ex.plannedTarget.targetReps.length > 0 && (
                    <span> · ref {ex.plannedTarget.targetReps.join('/')}</span>
                  )}
                  {ex.plannedTarget.targetTotalReps != null && (
                    <span> · ≥{ex.plannedTarget.targetTotalReps} reps</span>
                  )}
                  {ex.plannedTarget.rir != null && ex.plannedTarget.action !== 'increase-weight' && (
                    <span> @ RIR≥{ex.plannedTarget.rir}</span>
                  )}
                </p>
                <p className="text-xs text-gray-400">{ex.plannedTarget.reason}</p>
                {ex.progressionNotes && (
                  <p className="inline-flex items-start gap-1.5 text-xs text-accent-300/90"><Pin size={13} className="mt-0.5 shrink-0" /> {ex.progressionNotes}</p>
                )}
                {ex.plannedTarget.confidence !== 'high' && (
                  <p className="text-[11px] text-gray-500">Estimación con menos datos (sin RIR histórico).</p>
                )}
              </div>
            )}

            {/* Sets */}
            <div className="space-y-2">
              <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 px-1 text-overline uppercase text-gray-500">
                <span>Set</span>
                <span>Peso (kg)</span>
                <span>{timeBased ? 'Seg' : 'Reps'}</span>
                <span />
              </div>
              {ex.sets.map((set, i) => {
                const isActive = i === activeSetIdx;
                const isWarmup = set.type === 'warmup';
                const showRir = !timeBased && !isWarmup && i === lastWorkingSetIndex(ex.sets);
                return (
                  <div key={i} className="space-y-1.5">
                    <div
                      className={`grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 items-center rounded-2xl p-2.5 border-2 transition-all ${
                        isWarmup ? 'opacity-60 ' : ''
                      }${
                        set.completed
                          ? 'border-primary-500/60 bg-primary-500/8'
                          : isActive
                            ? 'border-accent-500/70 bg-accent-500/8 ring-1 ring-accent-500/40'
                            : 'border-gray-700 bg-gray-800/50'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`text-sm font-bold ${set.completed ? 'text-primary-400' : isActive ? 'text-accent-400' : 'text-gray-400'}`}>{i + 1}</span>
                        <button
                          onClick={() => updateSet(exIdx, i, { type: isWarmup ? 'working' : 'warmup', rir: isWarmup ? set.rir : undefined })}
                          className={`text-[10px] font-bold leading-none px-1 py-0.5 rounded ${isWarmup ? 'bg-accent-500/80 text-white' : 'text-gray-600 hover:text-gray-300'}`}
                          title={isWarmup ? 'Serie de calentamiento' : 'Marcar como calentamiento'}
                        >
                          C
                        </button>
                      </div>
                      <input
                        type="number"
                        step="0.5"
                        inputMode="decimal"
                        value={set.weight ?? ''}
                        onChange={e => updateSet(exIdx, i, { weight: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="—"
                        className="w-full px-2 py-2 rounded-xl border border-gray-700 bg-ink-900 text-white font-mono text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-600"
                      />
                      {timeBased ? (
                        <input
                          type="number"
                          inputMode="numeric"
                          value={set.seconds ?? ''}
                          onChange={e => updateSet(exIdx, i, { seconds: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder={ex.targetSeconds ? String(ex.targetSeconds) : '—'}
                          className="w-full px-2 py-2 rounded-xl border border-gray-700 bg-ink-900 text-white font-mono text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-600"
                        />
                      ) : (
                        <input
                          type="number"
                          inputMode="numeric"
                          value={set.reps ?? ''}
                          onChange={e => updateSet(exIdx, i, { reps: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="—"
                          className="w-full px-2 py-2 rounded-xl border border-gray-700 bg-ink-900 text-white font-mono text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-600"
                        />
                      )}
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => toggleSet(i)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition active:scale-90 ${
                            set.completed
                              ? 'bg-primary-500 text-ink-950 shadow-md shadow-primary-500/30'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
                          }`}
                          title={set.completed ? 'Marcar como pendiente' : 'Completar serie'}
                        >
                          <Check size={18} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                    {showRir && (
                      <div className="flex items-center gap-2 pl-2 text-xs text-gray-400">
                        <span className="font-semibold">RIR última serie</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          value={set.rir ?? ''}
                          onChange={e => updateSet(exIdx, i, { rir: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="—"
                          className="w-16 px-2 py-1 rounded-lg border border-gray-700 bg-ink-900 text-white font-mono text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-600"
                        />
                        <span className="text-gray-600">reps en reserva</span>
                      </div>
                    )}
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
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-accent-500 hover:bg-accent-600 text-white text-base font-semibold active:scale-95 transition tabular-nums"
              >
                <Play size={18} className="fill-current" /> Iniciar serie · {ex.targetSeconds ?? 30}s
              </button>
            ) : (
              <button
                onClick={() => startRest(ex.restSeconds ?? defaultRestSeconds)}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold border border-gray-700 hover:border-gray-600 transition tabular-nums"
              >
                <Timer size={16} /> Iniciar descanso ({ex.restSeconds ?? defaultRestSeconds}s)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="flex-shrink-0 bg-ink-900 border-t border-gray-800 px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setCurrentStep(s => Math.max(0, Math.min(s, steps.length - 1) - 1))}
            disabled={safeStep === 0}
            aria-label="Serie anterior"
          >
            <ArrowLeft size={16} />
          </Button>
          {safeStep < steps.length - 1 ? (
            <Button variant="accent" onClick={() => setCurrentStep(safeStep + 1)} fullWidth>
              Siguiente serie <ArrowRight size={16} />
            </Button>
          ) : (
            <Button onClick={() => setPhase('finishing')} fullWidth>
              <Flag size={16} /> Finalizar entrenamiento
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
