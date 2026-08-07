// ─── Workout Types ───────────────────────────────────────────────────────────

export type WorkoutType = 'workout' | 'rest' | 'active-rest' | 'missed';

export type FeelingType = 'easy' | 'normal' | 'hard' | 'very-hard';

export type MuscleGroup =
  | 'glutes'
  | 'legs'
  | 'back'
  | 'chest'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'full-body'
  | 'mobility'
  | 'other';

// ─── Progression & analytics ─────────────────────────────────────────────────

/** How an exercise's load/reps advance over time. `linear` is reserved for a
 *  future version and is intentionally kept out of the prescription UI for now. */
export type ProgressionMethod = 'double-progression' | 'linear' | 'none';

/** Direction of a progress metric over a recent window. */
export type Trend = 'up' | 'flat' | 'down';

/** Priority of an exercise within a routine (drives emphasis & future express mode). */
export type ExercisePriority = 'primary' | 'secondary' | 'optional';

/** Whether a logged set was a warm-up or a real working set. */
export type SetKind = 'warmup' | 'working';

/**
 * The nature of an exercise, deciding which progress metrics make sense.
 * Lives on {@link Exercise} (not the prescription); inferred when absent.
 */
export type MetricKind = 'loaded' | 'bodyweight' | 'isometric';

/** How much information backs a progression suggestion. `legacy` = decided by
 *  reps only because historical logs carry no RIR. */
export type SuggestionConfidence = 'high' | 'medium' | 'legacy';

/** The next-session recommendation produced by the progression engine. */
export interface ProgressionSuggestion {
  action: 'increase-weight' | 'add-reps' | 'consolidate' | 'repeat' | 'first-time';
  targetWeight?: number;
  targetReps?: number[];       // per-set reference, not an obligation
  targetTotalReps?: number;
  targetRepMin?: number;
  targetRepMax?: number;
  rir?: number;                // minimum RIR to progress (from the prescription)
  confidence: SuggestionConfidence;
  reason: string;              // Spanish, user-facing
}

// ─── Exercise (global library) ───────────────────────────────────────────────

/** Type of exercise, used for filtering and categorisation in the library */
export type ExerciseCategory = 'strength' | 'mobility' | 'core' | 'posture' | 'cardio';

/** Kind of the reference link attached to an exercise */
export type ReferenceType = 'youtube' | 'youtube_short' | 'image' | 'web' | 'other';

/** Where the reference came from */
export type ReferenceSource = 'local' | 'youtube_api' | 'web_search' | 'manual';

/** Lifecycle of a reference: suggested (needs user OK), accepted, manual, or absent */
export type ReferenceStatus = 'suggested' | 'accepted' | 'manual' | 'missing';

/**
 * A reusable exercise stored in the global library.
 * Routines reference these by id via ExerciseTemplate.exerciseId.
 *
 * All descriptive fields are optional and back-filled from the local knowledge
 * base (see src/data/exerciseKnowledgeBase.ts) without ever overwriting data
 * the user entered manually.
 */
export interface Exercise {
  id: string;
  name: string;
  nameLower: string;              // normalised name for search & dedup
  aliases?: string[];            // alternative names for KB matching
  muscleGroup?: MuscleGroup;     // coarse enum — drives badges & filters
  metricKind?: MetricKind;       // nature of the exercise (loaded/bodyweight/isometric); inferred when absent
  primaryMuscles?: string[];     // descriptive, e.g. "Glúteo mayor"
  secondaryMuscles?: string[];   // descriptive, e.g. "Isquiotibiales"
  equipment?: string[];
  category?: ExerciseCategory;
  movementPattern?: string;      // e.g. "Bisagra de cadera", "Empuje vertical" — for future filters/badges
  postureFocus?: boolean;        // true for postural/scapular/corrective work

  // Knowledge / coaching content
  description?: string;
  purpose?: string;
  simpleInstructions?: string[];
  commonMistakes?: string[];
  safetyNotes?: string;
  technicalNotes?: string;       // free user notes (legacy)

  // Visual reference
  referenceUrl?: string;         // canonical reference link
  referenceType?: ReferenceType;
  referenceSource?: ReferenceSource;
  referenceStatus?: ReferenceStatus;
  videoUrl?: string;             // legacy field, kept for back-compat / export

  createdAt: string;
  updatedAt?: string;
}

// ─── Exercise Template (inside a Routine) ────────────────────────────────────

export interface ExerciseTemplate {
  id: string;
  exerciseId?: string;    // NEW: reference to Exercise in the global library
  name: string;
  sets?: number;
  reps?: string;          // "10", "30 segundos", "al fallo" — display/legacy; targetRepMin/Max is the computable source
  unit?: 'reps' | 'seconds'; // how each set is measured (default 'reps')
  weight?: number;        // kg
  restSeconds?: number;
  notes?: string;
  videoUrl?: string;
  muscleGroup?: MuscleGroup;
  isOptional?: boolean;

  // ── Prescription (progression) — separate from performed results ──
  progressionMethod?: ProgressionMethod;
  targetRepMin?: number;   // structured rep range (falls back to parseRepRange(reps))
  targetRepMax?: number;
  targetRir?: number;      // minimum acceptable RIR to increase load (default 1)
  weightIncrement?: number; // kg step; falls back to Settings.defaultWeightIncrement
  priority?: ExercisePriority;
  progressionNotes?: string; // manual coaching escape hatch, e.g. "no subir si molestia lumbar"
}

// ─── Routine ─────────────────────────────────────────────────────────────────

export interface Routine {
  id: string;
  name: string;
  description?: string;
  type: 'workout' | 'active-rest';
  suggestedDays?: number[];   // 0=Dom, 1=Lun, ..., 6=Sab
  setOrder?: 'sequential' | 'circuit'; // how the guided session walks sets (default 'sequential')
  exercises: ExerciseTemplate[];
  createdAt: string;
}

// ─── Workout Log ─────────────────────────────────────────────────────────────

export interface SetLog {
  reps?: number;
  seconds?: number;       // for time-based (isometric) sets; reps stays undefined
  weight?: number;
  completed: boolean;
  rir?: number;           // reps in reserve — captured on the last working set only
  type?: SetKind;         // 'warmup' | 'working' (default 'working'); warm-ups are excluded from analytics
  notes?: string;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  muscleGroup?: MuscleGroup; // snapshot at log time, for robust per-muscle analytics
  sets: SetLog[];
  notes?: string;
}

export interface WorkoutLog {
  id: string;
  date: string;           // YYYY-MM-DD
  type: WorkoutType;
  routineId?: string;
  routineName?: string;
  duration?: number;      // minutes
  feeling?: FeelingType;
  notes?: string;
  exercises: ExerciseLog[];
}

// ─── Active workout session (in-progress, persisted to survive reloads) ──────

export interface SessionSet {
  weight?: number;
  reps?: number;
  seconds?: number;       // recorded hold time for time-based sets
  completed: boolean;
  rir?: number;           // reps in reserve — last working set only
  type?: SetKind;         // 'warmup' | 'working' (default 'working')
}

export interface SessionExercise {
  exerciseId?: string;
  name: string;
  muscleGroup?: MuscleGroup;
  unit: 'reps' | 'seconds';
  targetReps?: string;
  targetWeight?: number;
  targetSeconds?: number; // goal hold time for time-based exercises
  restSeconds?: number;
  notes?: string;
  description?: string;
  primaryMuscles?: string[];
  referenceUrl?: string;
  // ── Prescription carried into the session (for suggestion + display) ──
  targetRepMin?: number;
  targetRepMax?: number;
  targetRir?: number;
  weightIncrement?: number;
  progressionMethod?: ProgressionMethod;
  priority?: ExercisePriority;
  progressionNotes?: string;
  /** Snapshot of the "objetivo de hoy" computed when the session started.
   *  Persisted in the ActiveSession blob and never recomputed on resume. */
  plannedTarget?: ProgressionSuggestion;
  sets: SessionSet[];
}

export interface ActiveSession {
  routineId?: string;
  routineName: string;
  type: 'workout' | 'active-rest';
  setOrder: 'sequential' | 'circuit';
  startedAt: number;          // epoch ms
  session: SessionExercise[];
  currentStep: number;
  restEndsAt?: number;        // epoch ms when the running rest finishes
  restTotal?: number;         // total seconds of the running rest (for the ring)
  savedAt: number;            // epoch ms of last persist (for expiry)
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface Settings {
  weeklyGoal: number;          // 1-7
  restDays: number[];          // days that are planned rest (0-6)
  restDaysKeepStreak: boolean; // whether rest days count toward streak
  darkMode: boolean;
  autoEnrich: boolean;         // auto-fill exercise data from local knowledge base
  externalSearch: boolean;     // allow external (serverless) reference search
  defaultWeightIncrement?: number;  // kg step used when a template has none (default 2.5)
  stalledSessionThreshold?: number; // exposures without progress before flagging (default 3)
}

// ─── App Data (for import/export) ────────────────────────────────────────────

export interface AppData {
  workoutLogs: WorkoutLog[];
  routines: Routine[];
  exercises: Exercise[];   // NEW: global exercise library
  settings: Settings;
  version: '1.1' | '1.2';
}

// ─── Parser types ────────────────────────────────────────────────────────────

export interface ParsedExercise {
  name: string;
  sets?: number;
  reps?: string;
  weight?: number;
  restSeconds?: number;
  videoUrl?: string;
  muscleGroup?: MuscleGroup;
  notes?: string;
}

export interface ParsedDay {
  name: string;
  type: 'workout' | 'active-rest';
  exercises: ParsedExercise[];
  notes?: string;
}

export interface ParseResult {
  days: ParsedDay[];
  generalNotes?: string;
}
