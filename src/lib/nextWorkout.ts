import type { Routine, WorkoutLog } from '../types';

// ─── Next-workout selection ───────────────────────────────────────────────────
// Pure & testable. Decides which routine the dashboard suggests next.

export interface NextRoutinePick {
  routine: Routine;
  dayOffset: number; // 0 = hoy, 1 = mañana, … (for the "when" label)
}

/** The routineId of the most recent workout log that maps to a current workout routine. */
function lastWorkoutRoutineId(logs: WorkoutLog[], workoutIds: Set<string>): string | undefined {
  let best: WorkoutLog | undefined;
  for (const l of logs) {
    if (l.type !== 'workout' || !l.routineId || !workoutIds.has(l.routineId)) continue;
    if (!best || l.date > best.date) best = l; // YYYY-MM-DD compares lexicographically
  }
  return best?.routineId;
}

/** Soonest offset (0..6) whose day-of-week is in `days`, or 0 when none/empty. */
function offsetForSuggestedDays(days: number[] | undefined, todayDow: number): number {
  if (!days || days.length === 0) return 0;
  for (let offset = 0; offset < 7; offset++) {
    if (days.includes((todayDow + offset) % 7)) return offset;
  }
  return 0;
}

/**
 * Pick the next workout routine.
 *
 * With history: rotate to the routine AFTER the last one trained, in routine
 * order, wrapping around (did A → suggest B; did C → back to A). This is what
 * the user expects from an A/B/C split — day-of-week alone left it stuck on A.
 *
 * Without history: fall back to the routine whose `suggestedDays` match the
 * soonest upcoming day, else the first workout routine.
 *
 * `todayDow` is injectable for deterministic tests (defaults to the local day).
 */
export function pickNextRoutine(
  routines: Routine[],
  logs: WorkoutLog[],
  todayDow: number = new Date().getDay(),
): NextRoutinePick | null {
  const workouts = routines.filter(r => r.type === 'workout');
  if (workouts.length === 0) return null;

  const lastId = lastWorkoutRoutineId(logs, new Set(workouts.map(w => w.id)));
  if (lastId) {
    const idx = workouts.findIndex(w => w.id === lastId);
    const next = workouts[(idx + 1) % workouts.length];
    return { routine: next, dayOffset: offsetForSuggestedDays(next.suggestedDays, todayDow) };
  }

  for (let offset = 0; offset < 7; offset++) {
    const day = (todayDow + offset) % 7;
    const match = workouts.find(r => r.suggestedDays?.includes(day));
    if (match) return { routine: match, dayOffset: offset };
  }
  return { routine: workouts[0], dayOffset: 0 };
}
