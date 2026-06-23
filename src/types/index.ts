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

/**
 * A reusable exercise stored in the global library.
 * Routines reference these by id via ExerciseTemplate.exerciseId.
 */
export interface Exercise {
  id: string;
  name: string;
  nameLower: string;              // normalised name for search & dedup
  muscleGroup?: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  equipment?: string[];
  videoUrl?: string;
  technicalNotes?: string;
  category?: ExerciseCategory;
  createdAt: string;
}

// ─── Exercise Template (inside a Routine) ────────────────────────────────────

export interface ExerciseTemplate {
  id: string;
  exerciseId?: string;    // NEW: reference to Exercise in the global library
  name: string;
  sets?: number;
  reps?: string;          // "10", "30 segundos", "al fallo"
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
  exercises: ExerciseTemplate[];
  createdAt: string;
}

// ─── Workout Log ─────────────────────────────────────────────────────────────

export interface SetLog {
  reps?: number;
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

// ─── Settings ────────────────────────────────────────────────────────────────

export interface Settings {
  weeklyGoal: number;          // 1-7
  restDays: number[];          // days that are planned rest (0-6)
  restDaysKeepStreak: boolean; // whether rest days count toward streak
  darkMode: boolean;
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
