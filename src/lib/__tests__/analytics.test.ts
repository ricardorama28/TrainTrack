import { describe, it, expect } from 'vitest';
import {
  epley1RM,
  computeVolume,
  getExercisePerformances,
  getCurrentLoadBlock,
  getBestPerformanceAtWeight,
  computePRs,
  detectStalled,
  exerciseMetricKind,
  type ExercisePerformance,
} from '../analytics';
import type { WorkoutLog } from '../../types';

function log(date: string, name: string, sets: { reps?: number; weight?: number; completed?: boolean; type?: 'warmup' | 'working'; rir?: number; seconds?: number }[], exerciseId = ''): WorkoutLog {
  return {
    id: date,
    date,
    type: 'workout',
    exercises: [{ exerciseId, exerciseName: name, sets: sets.map(s => ({ completed: true, ...s })) }],
  };
}

describe('epley1RM & computeVolume', () => {
  it('Epley formula', () => {
    expect(epley1RM(40, 10)).toBeCloseTo(40 * (1 + 10 / 30));
    expect(epley1RM(0, 10)).toBe(0);
  });
  it('volume excludes warm-up sets', () => {
    const vol = computeVolume([
      { reps: 10, weight: 20, completed: true, type: 'warmup' },
      { reps: 8, weight: 40, completed: true, type: 'working' },
      { reps: 8, weight: 40, completed: true },
    ]);
    expect(vol).toBe(8 * 40 + 8 * 40); // warm-up ignored
  });
});

describe('getExercisePerformances', () => {
  it('joins by id, falls back to normalized name', () => {
    const logs: WorkoutLog[] = [
      log('2026-01-01', 'Remo con barra', [{ reps: 8, weight: 40 }], 'remo-id'),
      log('2026-01-08', 'remo con  barra', [{ reps: 9, weight: 40 }], ''), // empty id → name join
    ];
    const byId = getExercisePerformances(logs, 'remo-id', 'Remo con barra');
    expect(byId).toHaveLength(2); // both match (id + name)
    expect(byId[0].totalReps).toBe(8);
    expect(byId[1].totalReps).toBe(9);
  });
  it('excludes warm-ups from working sets', () => {
    const logs = [log('2026-01-01', 'X', [{ reps: 5, weight: 20, type: 'warmup' }, { reps: 8, weight: 40 }])];
    const p = getExercisePerformances(logs, undefined, 'X');
    expect(p[0].workingSets).toHaveLength(1);
    expect(p[0].topWeight).toBe(40);
  });
});

describe('load block & best at weight', () => {
  const perfs: ExercisePerformance[] = [40, 40, 42.5, 42.5, 40].map((w, i) => ({
    date: `2026-01-0${i + 1}`,
    workingSets: [],
    topWeight: w,
    maxReps: 8,
    totalReps: 32 + i,
    estimated1RM: 0,
    volume: 0,
    hasSeconds: false,
  }));

  it('current block is the trailing consecutive run at weight', () => {
    const block = getCurrentLoadBlock(perfs, 40);
    expect(block).toHaveLength(1); // only the last return-to-40, not the first two
    expect(block[0].totalReps).toBe(36);
  });

  it('best at weight retains its own RIR', () => {
    const block: ExercisePerformance[] = [
      { date: 'a', workingSets: [], topWeight: 40, maxReps: 10, totalReps: 40, estimated1RM: 0, volume: 0, hasSeconds: false, lastWorkingSetRir: 0 },
      { date: 'b', workingSets: [], topWeight: 40, maxReps: 9, totalReps: 38, estimated1RM: 0, volume: 0, hasSeconds: false, lastWorkingSetRir: 3 },
    ];
    const best = getBestPerformanceAtWeight(block, 40);
    expect(best?.totalReps).toBe(40);
    expect(best?.lastWorkingSetRir).toBe(0); // its own RIR, not the later session's
  });
});

describe('computePRs', () => {
  it('separates single-set and total reps, keeps dates', () => {
    const logs = [
      log('2026-01-01', 'X', [{ reps: 10, weight: 40 }, { reps: 10, weight: 40 }, { reps: 10, weight: 40 }, { reps: 10, weight: 40 }]),
      log('2026-01-08', 'X', [{ reps: 12, weight: 40 }, { reps: 8, weight: 40 }, { reps: 8, weight: 40 }, { reps: 8, weight: 40 }]),
    ];
    const perfs = getExercisePerformances(logs, undefined, 'X');
    const prs = computePRs(perfs);
    expect(prs.maxTotalRepsAtWeight?.value).toBe(40); // session 1
    expect(prs.maxTotalRepsAtWeight?.date).toBe('2026-01-01');
    expect(prs.maxSingleSetRepsAtWeight?.value).toBe(12); // session 2
    expect(prs.maxWeight?.value).toBe(40);
  });
});

describe('detectStalled', () => {
  function p(total: number, rir?: number): ExercisePerformance {
    return { date: 't', workingSets: [], topWeight: 40, maxReps: 10, totalReps: total, estimated1RM: 0, volume: 0, hasSeconds: false, lastWorkingSetRir: rir };
  }
  it('flags no-progress after N exposures without a new total-reps max', () => {
    const block = [p(32), p(34), p(35), p(35), p(35), p(35)];
    const r = detectStalled(block, 3);
    expect(r.stalled).toBe(true);
    expect(r.reason).toBe('no-progress');
    expect(r.sessionsWithoutProgress).toBe(3);
  });
  it('does not flag when recent progress happened', () => {
    const block = [p(35), p(36), p(35)];
    expect(detectStalled(block, 3).stalled).toBe(false);
  });
  it('ceiling-failure takes priority over no-progress', () => {
    const block = [p(40, 0), p(40, 0), p(40, 0)];
    const r = detectStalled(block, 3, 40); // repCeiling = 40
    expect(r.stalled).toBe(true);
    expect(r.reason).toBe('ceiling-failure');
  });
});

describe('exerciseMetricKind', () => {
  const perfs: ExercisePerformance[] = [{ date: 't', workingSets: [], topWeight: 40, maxReps: 8, totalReps: 32, estimated1RM: 0, volume: 0, hasSeconds: false }];
  it('explicit wins over inference', () => {
    expect(exerciseMetricKind(perfs, 'bodyweight')).toBe('bodyweight');
  });
  it('infers loaded from weight, bodyweight otherwise', () => {
    expect(exerciseMetricKind(perfs)).toBe('loaded');
    const bw: ExercisePerformance[] = [{ date: 't', workingSets: [], topWeight: 0, maxReps: 12, totalReps: 48, estimated1RM: 0, volume: 0, hasSeconds: false }];
    expect(exerciseMetricKind(bw)).toBe('bodyweight');
    const iso: ExercisePerformance[] = [{ date: 't', workingSets: [], topWeight: 0, maxReps: 0, totalReps: 0, estimated1RM: 0, volume: 0, hasSeconds: true }];
    expect(exerciseMetricKind(iso)).toBe('isometric');
  });
});
