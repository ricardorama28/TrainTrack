import { describe, it, expect } from 'vitest';
import { parseRepRange, suggestNextTarget } from '../progression';
import type { ExercisePerformance } from '../analytics';
import type { ExerciseTemplate, Settings } from '../../types';

const settings: Settings = {
  weeklyGoal: 4,
  restDays: [0, 6],
  restDaysKeepStreak: true,
  darkMode: true,
  autoEnrich: true,
  externalSearch: false,
  defaultWeightIncrement: 2.5,
  stalledSessionThreshold: 3,
};

/** Build a performance at a weight with per-set reps and an optional last-set RIR. */
function perf(date: string, weight: number, reps: number[], rir?: number): ExercisePerformance {
  const working = reps.map((r, i) => ({
    reps: r,
    weight,
    completed: true,
    type: 'working' as const,
    rir: i === reps.length - 1 ? rir : undefined,
  }));
  return {
    date,
    workingSets: working,
    topWeight: weight,
    maxReps: Math.max(...reps),
    totalReps: reps.reduce((a, b) => a + b, 0),
    estimated1RM: weight * (1 + Math.max(...reps) / 30),
    volume: reps.reduce((a, b) => a + b, 0) * weight,
    lastWorkingSetRir: rir,
    hasSeconds: false,
  };
}

const rdl: ExerciseTemplate = {
  id: 'rdl',
  name: 'Peso muerto rumano',
  sets: 4,
  weight: 40,
  progressionMethod: 'double-progression',
  targetRepMin: 8,
  targetRepMax: 10,
  targetRir: 1,
  weightIncrement: 2.5,
};

describe('parseRepRange', () => {
  it('parses ranges, singles and non-numeric', () => {
    expect(parseRepRange('8-10')).toEqual({ min: 8, max: 10 });
    expect(parseRepRange('10')).toEqual({ min: 10, max: 10 });
    expect(parseRepRange('al fallo')).toBeUndefined();
    expect(parseRepRange(undefined)).toBeUndefined();
  });
});

describe('suggestNextTarget — actions', () => {
  it('repeat when no progression configured', () => {
    const t: ExerciseTemplate = { id: 'x', name: 'X', sets: 3, weight: 20 };
    const s = suggestNextTarget({ template: t, performances: [], settings });
    expect(s.action).toBe('repeat');
  });

  it('first-time when no history', () => {
    const s = suggestNextTarget({ template: rdl, performances: [], settings });
    expect(s.action).toBe('first-time');
    expect(s.targetWeight).toBe(40);
    expect(s.targetTotalReps).toBe(32); // 4×8
  });

  it('add-reps referencing the best total, distributing 33 → 9/8/8/8', () => {
    const s = suggestNextTarget({ template: rdl, performances: [perf('2026-01-01', 40, [8, 8, 8, 8], 2)], settings });
    expect(s.action).toBe('add-reps');
    expect(s.targetTotalReps).toBe(33);
    expect(s.targetReps).toEqual([9, 8, 8, 8]);
  });

  it('increase-weight when ceiling reached with enough RIR', () => {
    const s = suggestNextTarget({ template: rdl, performances: [perf('2026-01-01', 40, [10, 10, 10, 10], 2)], settings });
    expect(s.action).toBe('increase-weight');
    expect(s.targetWeight).toBe(42.5);
    expect(s.targetTotalReps).toBe(32); // reset to bottom of range
  });

  it('consolidate when ceiling reached at RIR 0', () => {
    const s = suggestNextTarget({ template: rdl, performances: [perf('2026-01-01', 40, [10, 10, 10, 10], 0)], settings });
    expect(s.action).toBe('consolidate');
    expect(s.targetWeight).toBe(40);
  });

  it('legacy confidence + increase when ceiling reached without RIR', () => {
    const s = suggestNextTarget({ template: rdl, performances: [perf('2026-01-01', 40, [10, 10, 10, 10])], settings });
    expect(s.action).toBe('increase-weight');
    expect(s.confidence).toBe('legacy');
  });
});

describe('suggestNextTarget — RIR gate (targetRir as minimum)', () => {
  it('targetRir 2: RIR 1 at ceiling → consolidate; RIR 6 → increase', () => {
    const strict: ExerciseTemplate = { ...rdl, targetRir: 2 };
    const low = suggestNextTarget({ template: strict, performances: [perf('2026-01-01', 40, [10, 10, 10, 10], 1)], settings });
    expect(low.action).toBe('consolidate');
    const high = suggestNextTarget({ template: strict, performances: [perf('2026-01-01', 40, [10, 10, 10, 10], 6)], settings });
    expect(high.action).toBe('increase-weight');
  });
});

describe('suggestNextTarget — §15 subtle cases', () => {
  it('§15-1: a bad session does not lower the objective (best 35, last 32 → 36)', () => {
    const perfs = [perf('2026-01-01', 40, [9, 9, 9, 8], 2), perf('2026-01-08', 40, [8, 8, 8, 8], 3)];
    const s = suggestNextTarget({ template: rdl, performances: perfs, settings });
    expect(s.action).toBe('add-reps');
    expect(s.targetTotalReps).toBe(36); // best 35 + 1, not last 32 + 1
  });

  it('§15-2: latest below minTotal → consolidate/recover, not chase', () => {
    const perfs = [perf('2026-01-01', 40, [10, 10, 10, 8], 2), perf('2026-01-08', 40, [7, 7, 7, 7], 3)];
    const s = suggestNextTarget({ template: rdl, performances: perfs, settings });
    expect(s.action).toBe('consolidate');
    expect(s.targetTotalReps).toBe(32);
  });

  it('§15-3: ceiling at RIR 0 then submax RIR 3 → do NOT increase', () => {
    const perfs = [perf('2026-01-01', 40, [10, 10, 10, 10], 0), perf('2026-01-08', 40, [9, 9, 10, 10], 3)];
    const s = suggestNextTarget({ template: rdl, performances: perfs, settings });
    // best is the 40-rep session at RIR 0 → consolidate, the later RIR3 must not justify a jump
    expect(s.action).toBe('consolidate');
    expect(s.targetWeight).toBe(40);
  });

  it('§15-4: a new load block ignores old performances at the same weight', () => {
    const perfs = [
      perf('2026-01-01', 40, [10, 10, 10, 10], 1), // old block at 40
      perf('2026-01-08', 42.5, [8, 8, 8, 8], 2),   // moved up
      perf('2026-01-15', 40, [8, 8, 8, 8], 2),     // dropped back to 40 → NEW block
    ];
    const s = suggestNextTarget({ template: rdl, performances: perfs, settings });
    // best of the new 40 block is 32 (not the old 40-rep session) → objective 33
    expect(s.action).toBe('add-reps');
    expect(s.targetTotalReps).toBe(33);
  });
});
