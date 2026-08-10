import { describe, it, expect } from 'vitest';
import { sanitizeWorkoutLogs } from '../storage';
import type { WorkoutLog } from '../../types';

describe('sanitizeWorkoutLogs — new nested fields survive', () => {
  it('preserves muscleGroup, set.rir and set.type through sanitation', () => {
    const raw: WorkoutLog[] = [
      {
        id: 'w1',
        date: '2026-01-01',
        type: 'workout',
        exercises: [
          {
            exerciseId: 'rdl',
            exerciseName: 'Peso muerto rumano',
            muscleGroup: 'glutes',
            sets: [
              { reps: 8, weight: 40, completed: true, type: 'warmup' },
              { reps: 8, weight: 40, completed: true, type: 'working', rir: 2 },
            ],
          },
        ],
      },
    ];
    const out = sanitizeWorkoutLogs(raw);
    expect(out).toHaveLength(1);
    const el = out[0].exercises[0];
    expect(el.muscleGroup).toBe('glutes');
    expect(el.sets[0].type).toBe('warmup');
    expect(el.sets[1].rir).toBe(2);
    expect(el.sets[1].type).toBe('working');
  });

  it('drops logs with an invalid date but keeps valid ones', () => {
    const raw = [
      { id: 'bad', date: 'not-a-date', type: 'workout', exercises: [] },
      { id: 'ok', date: '2026-02-02', type: 'workout', exercises: [] },
    ];
    const out = sanitizeWorkoutLogs(raw);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('ok');
  });

  it('accepts a legacy 1.1 backup shape (version is not validated)', () => {
    // Older backups carry version '1.1' and logs without the new fields.
    const legacy = [{ id: 'a', date: '2025-12-01', type: 'workout', exercises: [{ exerciseId: '', exerciseName: 'X', sets: [{ reps: 10, weight: 30, completed: true }] }] }];
    const out = sanitizeWorkoutLogs(legacy);
    expect(out).toHaveLength(1);
    expect(out[0].exercises[0].sets[0].reps).toBe(10);
  });
});
