import type { WorkoutLog, ExerciseLog, Exercise, MuscleGroup, SetLog } from '../types';
import { normalizeName } from './normalize';
import { getWeekDays, parseLocalDate, toDateStr } from './dates';

// ─── Per-muscle volume & frequency ────────────────────────────────────────────
// "Series de trabajo" (working sets performed) and tonnage attributed to the
// primary muscle group. This is a direct-work distribution, not a physiological
// quantification (secondary muscles are not counted in V1).

function isEffective(s: SetLog): boolean {
  return s.completed === true && s.type !== 'warmup';
}

/**
 * Resolve the primary muscle of a logged exercise: the log's own snapshot first,
 * then a library join by id, then by normalized name. Undefined if unresolved.
 */
export function resolveMuscleGroup(log: ExerciseLog, exercises: Exercise[]): MuscleGroup | undefined {
  if (log.muscleGroup) return log.muscleGroup;
  if (log.exerciseId) {
    const byId = exercises.find(e => e.id === log.exerciseId);
    if (byId?.muscleGroup) return byId.muscleGroup;
  }
  const key = normalizeName(log.exerciseName);
  const byName = exercises.find(e => e.nameLower === key);
  return byName?.muscleGroup;
}

export interface MuscleVolume {
  muscleGroup: MuscleGroup;
  sets: number;   // working sets performed
  volume: number; // Σ reps × weight
}

function accumulate(
  logs: WorkoutLog[],
  exercises: Exercise[],
  dates: Set<string>,
): Map<MuscleGroup, MuscleVolume> {
  const map = new Map<MuscleGroup, MuscleVolume>();
  for (const log of logs) {
    if (!dates.has(log.date)) continue;
    for (const el of log.exercises) {
      const mg = resolveMuscleGroup(el, exercises);
      if (!mg) continue;
      const working = el.sets.filter(isEffective);
      if (working.length === 0) continue;
      const entry = map.get(mg) ?? { muscleGroup: mg, sets: 0, volume: 0 };
      entry.sets += working.length;
      for (const s of working) entry.volume += (s.reps ?? 0) * (s.weight ?? 0);
      map.set(mg, entry);
    }
  }
  return map;
}

/** Working sets & volume per muscle for the week containing `weekStart` (default today). */
export function weeklyMuscleVolume(
  logs: WorkoutLog[],
  exercises: Exercise[],
  weekStart?: string,
): MuscleVolume[] {
  const ref = parseLocalDate(weekStart) ?? new Date();
  const dates = new Set(getWeekDays(ref));
  return [...accumulate(logs, exercises, dates).values()].sort((a, b) => b.sets - a.sets);
}

export interface WeekVolumePoint {
  weekStart: string; // Monday, YYYY-MM-DD
  volume: number;
  sets: number;
}

/** Return the Monday (YYYY-MM-DD) of the week that contains `date`. */
function mondayOf(date: Date): string {
  return getWeekDays(date)[0];
}

/** One point per ISO week for the last `weeks` weeks (ascending, includes current). */
export function volumeByWeek(logs: WorkoutLog[], exercises: Exercise[], weeks: number): WeekVolumePoint[] {
  const points: WeekVolumePoint[] = [];
  const now = new Date();
  for (let w = weeks - 1; w >= 0; w--) {
    const d = new Date(now);
    d.setDate(now.getDate() - w * 7);
    const weekStart = mondayOf(d);
    const dates = new Set(getWeekDays(d));
    let volume = 0;
    let sets = 0;
    for (const mv of accumulate(logs, exercises, dates).values()) {
      volume += mv.volume;
      sets += mv.sets;
    }
    points.push({ weekStart, volume, sets });
  }
  return points;
}

/** Average training days per week that hit each muscle over the last `weeks` weeks. */
export function muscleFrequency(
  logs: WorkoutLog[],
  exercises: Exercise[],
  weeks: number,
): Partial<Record<MuscleGroup, number>> {
  const now = new Date();
  const windowDates = new Set<string>();
  for (let w = 0; w < weeks; w++) {
    const d = new Date(now);
    d.setDate(now.getDate() - w * 7);
    for (const day of getWeekDays(d)) windowDates.add(day);
  }
  // distinct dates per muscle
  const daysByMuscle = new Map<MuscleGroup, Set<string>>();
  for (const log of logs) {
    if (!windowDates.has(log.date)) continue;
    for (const el of log.exercises) {
      const mg = resolveMuscleGroup(el, exercises);
      if (!mg) continue;
      if (!el.sets.some(isEffective)) continue;
      const set = daysByMuscle.get(mg) ?? new Set<string>();
      set.add(log.date);
      daysByMuscle.set(mg, set);
    }
  }
  const out: Partial<Record<MuscleGroup, number>> = {};
  for (const [mg, days] of daysByMuscle) out[mg] = days.size / weeks;
  return out;
}

/** Exposed for callers that need to label the current week. */
export function currentWeekStart(): string {
  return toDateStr(parseLocalDate(getWeekDays(new Date())[0]) ?? new Date());
}
