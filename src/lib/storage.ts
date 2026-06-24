import type { WorkoutLog, WorkoutType, Routine, Settings, AppData, Exercise } from '../types';

// ─── Sanitization ──────────────────────────────────────────────────────────────
// Defensive layer: a single malformed/legacy log (e.g. a missing `date` or
// `exercises`) must never reach React and crash the whole app. We repair what we
// safely can and drop entries that are beyond repair.

const VALID_WORKOUT_TYPES: WorkoutType[] = ['workout', 'rest', 'active-rest', 'missed'];

/** Normalize a value into a YYYY-MM-DD string, or null if it can't be one. */
function normalizeDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const d = value.slice(0, 10); // tolerate ISO "YYYY-MM-DDTHH:MM:SSZ"
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
}

/**
 * Coerce arbitrary stored/cloud data into well-formed WorkoutLog[]:
 * - drops entries without a valid date (the crash vector),
 * - guarantees `exercises` is an array,
 * - guarantees a valid `type` (defaults to 'workout').
 */
export function sanitizeWorkoutLogs(raw: unknown): WorkoutLog[] {
  if (!Array.isArray(raw)) return [];
  const out: WorkoutLog[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const log = item as Record<string, unknown>;
    const date = normalizeDate(log.date);
    if (!date) continue; // unrepairable — skip
    const type = VALID_WORKOUT_TYPES.includes(log.type as WorkoutType)
      ? (log.type as WorkoutType)
      : 'workout';
    out.push({
      ...(log as object),
      id: typeof log.id === 'string' && log.id ? log.id : `${date}-${out.length}`,
      date,
      type,
      exercises: Array.isArray(log.exercises) ? log.exercises : [],
    } as WorkoutLog);
  }
  return out;
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const KEYS = {
  WORKOUT_LOGS: 'traintrack_workouts',
  ROUTINES:     'traintrack_routines',
  EXERCISES:    'traintrack_exercises',
  SETTINGS:     'traintrack_settings',
  INITIALIZED:  'traintrack_initialized',
} as const;

// ─── Default Values ───────────────────────────────────────────────────────────

export const defaultSettings: Settings = {
  weeklyGoal: 4,
  restDays: [0, 6],       // Sunday and Saturday
  restDaysKeepStreak: true,
  darkMode: true,
  autoEnrich: true,       // enrich from local KB by default (no network needed)
  externalSearch: false,  // external search is opt-in (requires backend)
};

// ─── Generic Helpers ─────────────────────────────────────────────────────────

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// ─── Change notification ───────────────────────────────────────────────────────
// Lets the cloud-sync layer react to local writes without modifying the hooks.

type Listener = () => void;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach(cb => {
    try {
      cb();
    } catch (e) {
      console.error('storage onChange listener failed:', e);
    }
  });
}

function set<T>(key: string, value: T): void {
  try {
    const next = JSON.stringify(value);
    const prev = localStorage.getItem(key);
    if (prev === next) return; // no-op: value unchanged, don't notify
    localStorage.setItem(key, next);
    notify();
  } catch (e) {
    console.error('Storage write failed:', e);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const storage = {
  // Workout logs
  getWorkoutLogs: (): WorkoutLog[] => sanitizeWorkoutLogs(get<unknown>(KEYS.WORKOUT_LOGS, [])),
  setWorkoutLogs: (logs: WorkoutLog[]): void => set(KEYS.WORKOUT_LOGS, logs),

  // Routines
  getRoutines: (): Routine[] => get<Routine[]>(KEYS.ROUTINES, []),
  setRoutines: (routines: Routine[]): void => set(KEYS.ROUTINES, routines),

  // Exercises (global library)
  getExercises: (): Exercise[] => get<Exercise[]>(KEYS.EXERCISES, []),
  setExercises: (exercises: Exercise[]): void => set(KEYS.EXERCISES, exercises),

  // Settings
  getSettings: (): Settings => ({ ...defaultSettings, ...get<Partial<Settings>>(KEYS.SETTINGS, {}) }),
  setSettings: (settings: Settings): void => set(KEYS.SETTINGS, settings),

  // Initialization flag
  isInitialized: (): boolean => localStorage.getItem(KEYS.INITIALIZED) === 'true',
  markInitialized: (): void => localStorage.setItem(KEYS.INITIALIZED, 'true'),

  // Export / Import
  exportAll: (): string => {
    const data: AppData = {
      workoutLogs: storage.getWorkoutLogs(),
      routines:    storage.getRoutines(),
      exercises:   storage.getExercises(),
      settings:    storage.getSettings(),
      version:     '1.1',
    };
    return JSON.stringify(data, null, 2);
  },

  importAll: (data: AppData): void => {
    if (Array.isArray(data.workoutLogs)) storage.setWorkoutLogs(sanitizeWorkoutLogs(data.workoutLogs));
    if (Array.isArray(data.routines))    storage.setRoutines(data.routines);
    // Backward-compat: older backups may not include exercises
    if (Array.isArray(data.exercises))   storage.setExercises(data.exercises);
    if (data.settings)                   storage.setSettings({ ...defaultSettings, ...data.settings });
  },

  clearAll: (): void => {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    notify();
  },

  /** True when there is any user-created data worth syncing. */
  hasLocalData: (): boolean =>
    storage.getWorkoutLogs().length > 0 ||
    storage.getRoutines().length > 0 ||
    storage.getExercises().length > 0,

  /** Subscribe to local writes. Returns an unsubscribe function. */
  onChange: (cb: Listener): (() => void) => {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
};
