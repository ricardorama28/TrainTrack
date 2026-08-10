import type { WorkoutLog, SetLog, MetricKind, Trend } from '../types';
import { normalizeName } from './normalize';

// ─── Analytics primitives ─────────────────────────────────────────────────────
// Pure functions over WorkoutLog[] — no React, no storage. They power the
// progression engine, the exercise history charts and the dashboard.

/** A single set counts toward analytics only if it was completed and is not a warm-up. */
function isEffective(s: SetLog): boolean {
  return s.completed === true && s.type !== 'warmup';
}

/** Estimated one-rep max (Epley). Meaningless for bodyweight/isometric work. */
export function epley1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  return weight * (1 + reps / 30);
}

/** Best Epley 1RM across the effective sets. */
export function estimateBest1RM(sets: SetLog[]): number {
  let best = 0;
  for (const s of sets) {
    if (!isEffective(s)) continue;
    const e = epley1RM(s.weight ?? 0, s.reps ?? 0);
    if (e > best) best = e;
  }
  return best;
}

/** Training volume (Σ reps × weight) over the effective sets. Warm-ups excluded. */
export function computeVolume(sets: SetLog[]): number {
  let v = 0;
  for (const s of sets) {
    if (!isEffective(s)) continue;
    v += (s.reps ?? 0) * (s.weight ?? 0);
  }
  return v;
}

/** Heaviest weight used among the effective sets (0 if none / bodyweight). */
export function maxWeight(sets: SetLog[]): number {
  let m = 0;
  for (const s of sets) {
    if (!isEffective(s)) continue;
    if ((s.weight ?? 0) > m) m = s.weight ?? 0;
  }
  return m;
}

/** One exposure of an exercise: what was actually performed in a session. */
export interface ExercisePerformance {
  date: string;              // YYYY-MM-DD
  workingSets: SetLog[];     // effective (completed, non-warmup) sets
  topWeight: number;
  maxReps: number;           // most reps in a single working set
  totalReps: number;         // Σ reps across working sets
  estimated1RM: number;
  volume: number;
  lastWorkingSetRir?: number; // RIR of the last working set, when recorded
  hasSeconds: boolean;        // true if any working set is time-based (isometric)
  maxSeconds?: number;        // longest hold among working sets (isometric)
  totalSeconds?: number;      // total hold time (isometric)
}

function buildPerformance(date: string, sets: SetLog[]): ExercisePerformance | null {
  const working = sets.filter(isEffective);
  if (working.length === 0) return null;
  const topWeight = maxWeight(working);
  let maxReps = 0;
  let totalReps = 0;
  let hasSeconds = false;
  let maxSeconds = 0;
  let totalSeconds = 0;
  for (const s of working) {
    if (s.seconds != null) {
      hasSeconds = true;
      totalSeconds += s.seconds;
      if (s.seconds > maxSeconds) maxSeconds = s.seconds;
    }
    const r = s.reps ?? 0;
    totalReps += r;
    if (r > maxReps) maxReps = r;
  }
  const last = working[working.length - 1];
  return {
    date,
    workingSets: working,
    topWeight,
    maxReps,
    totalReps,
    estimated1RM: estimateBest1RM(working),
    volume: computeVolume(working),
    lastWorkingSetRir: last?.rir,
    hasSeconds,
    maxSeconds,
    totalSeconds,
  };
}

/**
 * All exposures of an exercise across the logs, ascending by date.
 * Joins each ExerciseLog by `exerciseId` first, then falls back to normalized
 * name so historical logs (which often have an empty exerciseId) still match.
 */
export function getExercisePerformances(
  logs: WorkoutLog[],
  exerciseId: string | undefined,
  exerciseName: string,
): ExercisePerformance[] {
  const nameKey = normalizeName(exerciseName);
  const wantId = exerciseId && exerciseId.length > 0 ? exerciseId : undefined;
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const out: ExercisePerformance[] = [];
  for (const log of sorted) {
    const sets: SetLog[] = [];
    for (const el of log.exercises) {
      const matches =
        (wantId != null && el.exerciseId === wantId) ||
        normalizeName(el.exerciseName) === nameKey;
      if (matches) sets.push(...el.sets);
    }
    const perf = buildPerformance(log.date, sets);
    if (perf) out.push(perf);
  }
  return out;
}

export function getLastPerformance(
  logs: WorkoutLog[],
  exerciseId: string | undefined,
  exerciseName: string,
): ExercisePerformance | undefined {
  const perfs = getExercisePerformances(logs, exerciseId, exerciseName);
  return perfs[perfs.length - 1];
}

/**
 * The current load block: the trailing run of exposures at `weight`, from the
 * most recent backwards until the weight changes. A return to an old weight
 * after a change starts a fresh block, so old performances at the same weight
 * do NOT contaminate progression or stall detection.
 */
export function getCurrentLoadBlock(
  perfs: ExercisePerformance[],
  weight: number,
): ExercisePerformance[] {
  const block: ExercisePerformance[] = [];
  for (let i = perfs.length - 1; i >= 0; i--) {
    if (perfs[i].topWeight === weight) block.unshift(perfs[i]);
    else break;
  }
  return block;
}

/** Best exposure (by total reps) within a block; retains its own RIR. */
export function getBestPerformanceAtWeight(
  block: ExercisePerformance[],
  _weight?: number,
): ExercisePerformance | undefined {
  let best: ExercisePerformance | undefined;
  for (const p of block) {
    if (!best || p.totalReps > best.totalReps) best = p;
  }
  return best;
}

/** Decide which progress metrics make sense: explicit wins, else inferred. */
export function exerciseMetricKind(
  perfs: ExercisePerformance[],
  explicit?: MetricKind,
): MetricKind {
  if (explicit) return explicit;
  if (perfs.some(p => p.hasSeconds)) return 'isometric';
  if (perfs.some(p => p.topWeight > 0)) return 'loaded';
  return 'bodyweight';
}

// ─── Personal records ─────────────────────────────────────────────────────────

export interface PRValue {
  value: number;
  date: string;
  weight?: number; // associated load, where relevant
}

export interface ExercisePRs {
  maxWeight?: PRValue;
  maxSingleSetRepsAtWeight?: PRValue;
  maxTotalRepsAtWeight?: PRValue;
  best1RM?: PRValue;
  maxSessionVolume?: PRValue;
}

export function computePRs(perfs: ExercisePerformance[]): ExercisePRs {
  const prs: ExercisePRs = {};
  for (const p of perfs) {
    if (p.topWeight > 0 && (!prs.maxWeight || p.topWeight > prs.maxWeight.value)) {
      prs.maxWeight = { value: p.topWeight, date: p.date };
    }
    if (p.totalReps > 0 && (!prs.maxTotalRepsAtWeight || p.totalReps > prs.maxTotalRepsAtWeight.value)) {
      prs.maxTotalRepsAtWeight = { value: p.totalReps, date: p.date, weight: p.topWeight };
    }
    if (p.maxReps > 0 && (!prs.maxSingleSetRepsAtWeight || p.maxReps > prs.maxSingleSetRepsAtWeight.value)) {
      prs.maxSingleSetRepsAtWeight = { value: p.maxReps, date: p.date, weight: p.topWeight };
    }
    if (p.estimated1RM > 0 && (!prs.best1RM || p.estimated1RM > prs.best1RM.value)) {
      prs.best1RM = { value: p.estimated1RM, date: p.date };
    }
    if (p.volume > 0 && (!prs.maxSessionVolume || p.volume > prs.maxSessionVolume.value)) {
      prs.maxSessionVolume = { value: p.volume, date: p.date };
    }
  }
  return prs;
}

export interface LatestPRs {
  any: boolean;
  load: boolean;
  totalReps: boolean;
  singleSetReps: boolean;
}

/** Which records the most recent exposure established (strictly beating history). */
export function getLatestPRs(perfs: ExercisePerformance[]): LatestPRs {
  const none: LatestPRs = { any: false, load: false, totalReps: false, singleSetReps: false };
  if (perfs.length < 2) {
    // With a single exposure everything is trivially a "record"; not motivating.
    return none;
  }
  const latest = perfs[perfs.length - 1];
  const prior = computePRs(perfs.slice(0, -1));
  const load = latest.topWeight > 0 && (!prior.maxWeight || latest.topWeight > prior.maxWeight.value);
  const totalReps =
    latest.totalReps > 0 && (!prior.maxTotalRepsAtWeight || latest.totalReps > prior.maxTotalRepsAtWeight.value);
  const singleSetReps =
    latest.maxReps > 0 && (!prior.maxSingleSetRepsAtWeight || latest.maxReps > prior.maxSingleSetRepsAtWeight.value);
  return { any: load || totalReps || singleSetReps, load, totalReps, singleSetReps };
}

// ─── Trend & stall ────────────────────────────────────────────────────────────

export function detectTrend(
  perfs: ExercisePerformance[],
  metric: 'estimated1RM' | 'volume' | 'totalReps' = 'estimated1RM',
): Trend {
  if (perfs.length < 2) return 'flat';
  const window = perfs.slice(-4);
  const first = window[0][metric];
  const last = window[window.length - 1][metric];
  const delta = last - first;
  const tolerance = Math.max(0.5, Math.abs(first) * 0.02);
  if (delta > tolerance) return 'up';
  if (delta < -tolerance) return 'down';
  return 'flat';
}

export interface StalledInfo {
  stalled: boolean;
  sessionsWithoutProgress: number;
  reason?: 'no-progress' | 'ceiling-failure';
}

/**
 * Stall detection relative to recent progress (not the absolute historical PR).
 * Operates on a load block. `repCeiling` (sets × targetRepMax) enables the
 * `ceiling-failure` sub-case (repeated top-of-range sessions taken to failure),
 * which takes priority because it is the more actionable explanation.
 */
export function detectStalled(
  block: ExercisePerformance[],
  threshold: number,
  repCeiling?: number,
): StalledInfo {
  if (block.length === 0) return { stalled: false, sessionsWithoutProgress: 0 };

  // ceiling-failure: trailing run at/above the ceiling with RIR 0.
  if (repCeiling != null && repCeiling > 0) {
    let ceilRun = 0;
    for (let i = block.length - 1; i >= 0; i--) {
      const p = block[i];
      if (p.totalReps >= repCeiling && p.lastWorkingSetRir === 0) ceilRun++;
      else break;
    }
    if (ceilRun >= threshold) {
      return { stalled: true, sessionsWithoutProgress: ceilRun, reason: 'ceiling-failure' };
    }
  }

  // no-progress: exposures since the last new max of total reps.
  let lastImproveIdx = 0;
  let runningMax = -1;
  for (let i = 0; i < block.length; i++) {
    if (block[i].totalReps > runningMax) {
      runningMax = block[i].totalReps;
      lastImproveIdx = i;
    }
  }
  const sinceImprove = block.length - 1 - lastImproveIdx;
  if (sinceImprove >= threshold) {
    return { stalled: true, sessionsWithoutProgress: sinceImprove, reason: 'no-progress' };
  }
  return { stalled: false, sessionsWithoutProgress: sinceImprove };
}
