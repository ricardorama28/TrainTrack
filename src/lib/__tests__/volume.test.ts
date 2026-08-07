import { describe, it, expect } from 'vitest';
import { resolveMuscleGroup, weeklyMuscleVolume } from '../volume';
import type { Exercise, ExerciseLog, WorkoutLog } from '../../types';

const exercises: Exercise[] = [
  { id: 'hip', name: 'Hip Thrust', nameLower: 'hip thrust', muscleGroup: 'glutes', createdAt: 't' },
  { id: 'row', name: 'Remo', nameLower: 'remo', muscleGroup: 'back', createdAt: 't' },
];

describe('resolveMuscleGroup — three-tier fallback', () => {
  it('prefers the log snapshot', () => {
    const el: ExerciseLog = { exerciseId: 'row', exerciseName: 'Remo', muscleGroup: 'chest', sets: [] };
    expect(resolveMuscleGroup(el, exercises)).toBe('chest');
  });
  it('falls back to id join', () => {
    const el: ExerciseLog = { exerciseId: 'hip', exerciseName: 'lo que sea', sets: [] };
    expect(resolveMuscleGroup(el, exercises)).toBe('glutes');
  });
  it('falls back to normalized name join', () => {
    const el: ExerciseLog = { exerciseId: '', exerciseName: 'HIP  thrust', sets: [] };
    expect(resolveMuscleGroup(el, exercises)).toBe('glutes');
  });
  it('undefined when unresolved', () => {
    const el: ExerciseLog = { exerciseId: '', exerciseName: 'desconocido', sets: [] };
    expect(resolveMuscleGroup(el, exercises)).toBeUndefined();
  });
});

describe('weeklyMuscleVolume — only working+completed sets count', () => {
  it('counts working sets and excludes warm-ups and incomplete sets', () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const logs: WorkoutLog[] = [
      {
        id: '1',
        date: dateStr,
        type: 'workout',
        exercises: [
          {
            exerciseId: 'hip',
            exerciseName: 'Hip Thrust',
            sets: [
              { reps: 10, weight: 20, completed: true, type: 'warmup' }, // excluded
              { reps: 10, weight: 40, completed: true, type: 'working' },
              { reps: 10, weight: 40, completed: true },
              { reps: 10, weight: 40, completed: false }, // excluded (not completed)
            ],
          },
        ],
      },
    ];
    const result = weeklyMuscleVolume(logs, exercises, dateStr);
    expect(result).toHaveLength(1);
    expect(result[0].muscleGroup).toBe('glutes');
    expect(result[0].sets).toBe(2);
    expect(result[0].volume).toBe(10 * 40 + 10 * 40);
  });
});
