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
  reps?: string;          // "10", "30 segundos", "al fallo"
  unit?: 'reps' | 'seconds'; // how each set is measured (default 'reps')
  weight?: number;        // kg
  restSeconds?: number;
  notes?: string;
  videoUrl?: string;
  muscleGroup?: MuscleGroup;
  isOptional?: boolean;
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
  notes?: string;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
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
}

// ─── App Data (for import/export) ────────────────────────────────────────────

export interface AppData {
  workoutLogs: WorkoutLog[];
  routines: Routine[];
  exercises: Exercise[];   // NEW: global exercise library
  settings: Settings;
  version: string;
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
