import { describe, it, expect } from 'vitest';
import { buildSessionExercises, sessionExerciseToLog, buildWorkoutLog } from '../session';
import type { Routine, Exercise, Settings } from '../../types';

const settings: Settings = {
  weeklyGoal: 4, restDays: [0, 6], restDaysKeepStreak: true, darkMode: true,
  autoEnrich: true, externalSearch: false, defaultWeightIncrement: 2.5, stalledSessionThreshold: 3,
};

const exercises: Exercise[] = [
  { id: 'rdl', name: 'Peso muerto rumano', nameLower: 'peso muerto rumano', muscleGroup: 'glutes', createdAt: 't' },
];

const routine: Routine = {
  id: 'A', name: 'Día A', type: 'workout', createdAt: 't',
  exercises: [
    {
      id: 'e1', exerciseId: 'rdl', name: 'Peso muerto rumano', sets: 4, weight: 40,
      progressionMethod: 'double-progression', targetRepMin: 8, targetRepMax: 10, targetRir: 1,
    },
  ],
};

describe('buildSession → buildLog pipeline', () => {
  it('propagates muscleGroup from template/library into the ExerciseLog', () => {
    const session = buildSessionExercises(routine, exercises, [], settings);
    expect(session[0].muscleGroup).toBe('glutes');
    const log = sessionExerciseToLog(session[0]);
    expect(log.muscleGroup).toBe('glutes'); // not dependent on the analytics name-fallback
  });

  it('pre-fills sets from the suggestion and carries RIR + type into the log', () => {
    const session = buildSessionExercises(routine, exercises, [], settings);
    // first-time with no history → 4×8 at 40 kg
    expect(session[0].sets).toHaveLength(4);
    expect(session[0].sets.every(s => s.weight === 40 && s.reps === 8)).toBe(true);

    // record an RIR on the last working set (as the UI does)
    session[0].sets[3].rir = 2;
    const full = buildWorkoutLog(session, { date: '2026-01-01', type: 'workout' });
    const sets = full.exercises[0].sets;
    expect(sets.every(s => s.type === 'working')).toBe(true);
    expect(sets[3].rir).toBe(2);
    expect(sets[0].rir).toBeUndefined();
  });

  it('exposes plannedTarget as the session snapshot', () => {
    const session = buildSessionExercises(routine, exercises, [], settings);
    expect(session[0].plannedTarget?.action).toBe('first-time');
    expect(session[0].plannedTarget?.targetTotalReps).toBe(32);
  });
});
