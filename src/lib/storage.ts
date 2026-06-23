import type { WorkoutLog, Routine, Settings, AppData } from '../types';

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const KEYS = {
  WORKOUT_LOGS: 'traintrack_workouts',
  ROUTINES:     'traintrack_routines',
  SETTINGS:     'traintrack_settings',
  INITIALIZED:  'traintrack_initialized',
} as const;

// ─── Default Values ───────────────────────────────────────────────────────────

export const defaultSettings: Settings = {
  weeklyGoal: 4,
  restDays: [0, 6],       // Sunday and Saturday
  restDaysKeepStreak: true,
  darkMode: false,
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

function set<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage write failed:', e);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const storage = {
  // Workout logs
  getWorkoutLogs: (): WorkoutLog[] => get<WorkoutLog[]>(KEYS.WORKOUT_LOGS, []),
  setWorkoutLogs: (logs: WorkoutLog[]): void => set(KEYS.WORKOUT_LOGS, logs),

  // Routines
  getRoutines: (): Routine[] => get<Routine[]>(KEYS.ROUTINES, []),
  setRoutines: (routines: Routine[]): void => set(KEYS.ROUTINES, routines),

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
      settings:    storage.getSettings(),
      version:     '1.0',
    };
    return JSON.stringify(data, null, 2);
  },

  importAll: (data: AppData): void => {
    if (Array.isArray(data.workoutLogs)) storage.setWorkoutLogs(data.workoutLogs);
    if (Array.isArray(data.routines))    storage.setRoutines(data.routines);
    if (data.settings)                   storage.setSettings({ ...defaultSettings, ...data.settings });
  },

  clearAll: (): void => {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  },
};
