import { supabase } from './supabase';
import { storage, sanitizeWorkoutLogs } from './storage';
import type { AppData } from '../types';

const TABLE = 'user_data';

function extractErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e != null && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message);
  return 'Error de sincronización';
}
const DEBOUNCE_MS = 2000;

// ─── Sync state (observable) ────────────────────────────────────────────────────

export interface SyncState {
  syncing: boolean;
  lastSyncedAt: string | null; // ISO timestamp
  error: string | null;
}

let state: SyncState = { syncing: false, lastSyncedAt: null, error: null };
const stateListeners = new Set<(s: SyncState) => void>();

function setState(patch: Partial<SyncState>): void {
  state = { ...state, ...patch };
  stateListeners.forEach(cb => cb(state));
}

export function getSyncState(): SyncState {
  return state;
}

export function onSyncStateChange(cb: (s: SyncState) => void): () => void {
  stateListeners.add(cb);
  return () => {
    stateListeners.delete(cb);
  };
}

// ─── Loop guard ─────────────────────────────────────────────────────────────────
// When pullFromCloud writes to localStorage it triggers storage.onChange, which
// would schedule a push. suppressSync prevents that feedback loop.

let suppressSync = false;

// ─── Push ───────────────────────────────────────────────────────────────────────

let pushTimer: ReturnType<typeof setTimeout> | null = null;

/** Immediately upload the full local dataset to the cloud for this user. */
export async function pushToCloud(userId: string): Promise<void> {
  if (!supabase) return;
  setState({ syncing: true, error: null });
  try {
    const payload = {
      user_id: userId,
      workout_logs: storage.getWorkoutLogs(),
      routines: storage.getRoutines(),
      exercises: storage.getExercises(),
      settings: storage.getSettings(),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from(TABLE).upsert(payload, { onConflict: 'user_id' });
    if (error) throw error;
    setState({ syncing: false, lastSyncedAt: new Date().toISOString(), error: null });
  } catch (e) {
    setState({ syncing: false, error: extractErrorMessage(e) });
  }
}

/** Debounced push — coalesces bursts of local writes into a single upload. */
export function schedulePush(userId: string): void {
  if (!supabase || suppressSync) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushToCloud(userId);
  }, DEBOUNCE_MS);
}

// ─── Pull ─────────────────────────────────────────────────────────────────────--

export interface CloudData {
  hasData: boolean;
}

/**
 * Download the user's cloud dataset into localStorage. suppressSync is held for
 * the whole operation so the resulting local writes never schedule a push back.
 * Returns whether the cloud actually had data for this user.
 */
export async function pullFromCloud(userId: string): Promise<CloudData> {
  if (!supabase) return { hasData: false };
  setState({ syncing: true, error: null });
  suppressSync = true;
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('workout_logs, routines, exercises, settings')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;

    const hasData =
      !!data &&
      ((Array.isArray(data.workout_logs) && data.workout_logs.length > 0) ||
        (Array.isArray(data.routines) && data.routines.length > 0) ||
        (Array.isArray(data.exercises) && data.exercises.length > 0));

    if (data) {
      const appData: AppData = {
        workoutLogs: sanitizeWorkoutLogs(data.workout_logs),
        routines: Array.isArray(data.routines) ? data.routines : [],
        exercises: Array.isArray(data.exercises) ? data.exercises : [],
        settings: data.settings ?? undefined,
        version: '1.1',
      } as AppData;
      storage.importAll(appData);
    }

    setState({ syncing: false, lastSyncedAt: new Date().toISOString(), error: null });
    return { hasData };
  } catch (e) {
    setState({ syncing: false, error: extractErrorMessage(e) });
    return { hasData: false };
  } finally {
    suppressSync = false;
  }
}

/** Whether the cloud has any data for this user (without importing it). */
export async function cloudHasData(userId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from(TABLE)
    .select('workout_logs, routines, exercises')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return false;
  return (
    (Array.isArray(data.workout_logs) && data.workout_logs.length > 0) ||
    (Array.isArray(data.routines) && data.routines.length > 0) ||
    (Array.isArray(data.exercises) && data.exercises.length > 0)
  );
}

/** Reset sync state (e.g. on sign out). Does NOT touch localStorage. */
export function resetSyncState(): void {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  setState({ syncing: false, lastSyncedAt: null, error: null });
}
