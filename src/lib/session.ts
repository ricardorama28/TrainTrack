import type {
  Routine, Exercise, ExerciseTemplate, SessionExercise, SessionSet,
  ExerciseLog, SetLog, WorkoutLog, WorkoutType, Settings, ProgressionSuggestion,
} from '../types';
import { suggestNextTarget } from './progression';
import { getExercisePerformances } from './analytics';

// ─── Session construction (pure, testable) ────────────────────────────────────
// Extracted from WorkoutSession so the routine→session→log pipeline can be unit
// tested (e.g. that muscleGroup and RIR flow all the way into the WorkoutLog).

/** Extract a leading integer from a reps string ("10-12" → 10, "30 seg" → 30). */
export function parseRepsNumber(reps?: string): number | undefined {
  if (!reps) return undefined;
  const m = /\d+/.exec(reps);
  return m ? parseInt(m[0], 10) : undefined;
}

/** Whether an exercise is measured by time rather than reps. */
export function isTimeBased(ex: ExerciseTemplate): boolean {
  if (ex.unit) return ex.unit === 'seconds';
  return /seg|segundo|min|'|"/i.test(ex.reps ?? ''); // legacy detection
}

/** Parse a duration string into seconds ("30 seg" → 30, "1 min" → 60). */
export function parseDuration(reps?: string): number | undefined {
  if (!reps) return undefined;
  const m = /(\d+)\s*(min|m|seg|segundos?|s|')?/i.exec(reps);
  if (!m) return undefined;
  const n = parseInt(m[1], 10);
  const unit = (m[2] ?? '').toLowerCase();
  if (unit === 'min' || unit === 'm' || unit === "'") return n * 60;
  return n;
}

/** Build one SessionExercise from a template, its library entry and today's suggestion. */
export function buildSessionExercise(
  ex: ExerciseTemplate,
  lib: Exercise | undefined,
  suggestion?: ProgressionSuggestion,
): SessionExercise {
  const count = ex.sets && ex.sets > 0 ? ex.sets : (suggestion?.targetReps?.length ?? 1);
  const timeBased = isTimeBased(ex);
  const repsNum = timeBased ? undefined : parseRepsNumber(ex.reps);
  const targetSeconds = timeBased ? (parseDuration(ex.reps) ?? 30) : undefined;
  const prefWeight = suggestion?.targetWeight ?? ex.weight;
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
    targetRepMin: ex.targetRepMin,
    targetRepMax: ex.targetRepMax,
    targetRir: ex.targetRir,
    weightIncrement: ex.weightIncrement,
    progressionMethod: ex.progressionMethod,
    priority: ex.priority,
    progressionNotes: ex.progressionNotes,
    plannedTarget: suggestion,
    sets: Array.from({ length: count }, (_, i) => ({
      weight: prefWeight,
      reps: timeBased ? undefined : (suggestion?.targetReps?.[i] ?? repsNum),
      seconds: undefined,
      completed: false,
      type: 'working' as const,
    })),
  };
}

/** Build all session exercises for a routine, computing each one's "objetivo de hoy". */
export function buildSessionExercises(
  routine: Routine,
  exercises: Exercise[] | undefined,
  logs: WorkoutLog[],
  settings: Settings,
): SessionExercise[] {
  return routine.exercises.map(ex => {
    const lib = ex.exerciseId ? exercises?.find(e => e.id === ex.exerciseId) : undefined;
    const performances = getExercisePerformances(logs, ex.exerciseId, ex.name);
    const suggestion = suggestNextTarget({ template: ex, performances, settings });
    return buildSessionExercise(ex, lib, suggestion);
  });
}

/** Convert one in-progress SessionExercise into a persisted ExerciseLog. */
export function sessionExerciseToLog(e: SessionExercise): ExerciseLog {
  return {
    exerciseId: e.exerciseId ?? '',
    exerciseName: e.name,
    muscleGroup: e.muscleGroup,
    sets: e.sets.map((s): SetLog => ({
      reps: e.unit === 'seconds' ? undefined : s.reps,
      seconds: e.unit === 'seconds' ? s.seconds : undefined,
      weight: s.weight,
      completed: s.completed,
      rir: e.unit === 'seconds' ? undefined : s.rir,
      type: s.type ?? 'working',
    })),
    notes: e.notes,
  };
}

export interface WorkoutLogMeta {
  date: string;
  type: WorkoutType;
  routineId?: string;
  routineName?: string;
  duration?: number;
  feeling?: WorkoutLog['feeling'];
  notes?: string;
}

/** Build the final WorkoutLog (minus id) from the session and its metadata. */
export function buildWorkoutLog(session: SessionExercise[], meta: WorkoutLogMeta): Omit<WorkoutLog, 'id'> {
  return {
    date: meta.date,
    type: meta.type,
    routineId: meta.routineId,
    routineName: meta.routineName,
    duration: meta.duration,
    feeling: meta.feeling,
    notes: meta.notes,
    exercises: session.map(sessionExerciseToLog),
  };
}

/** Index of the last working (non-warmup) set, or -1. Used to place the RIR input. */
export function lastWorkingSetIndex(sets: SessionSet[]): number {
  for (let i = sets.length - 1; i >= 0; i--) {
    if (sets[i].type !== 'warmup') return i;
  }
  return -1;
}
