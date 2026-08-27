import { describe, it, expect } from 'vitest';
import { pickNextRoutine } from '../nextWorkout';
import type { Routine, WorkoutLog } from '../../types';

function routine(id: string, name: string, suggestedDays?: number[]): Routine {
  return { id, name, type: 'workout', suggestedDays, exercises: [], createdAt: 't' };
}
function log(date: string, routineId: string): WorkoutLog {
  return { id: date, date, type: 'workout', routineId, exercises: [] };
}

const A = routine('a', 'Día A');
const B = routine('b', 'Día B');
const C = routine('c', 'Día C');
const routines = [A, B, C];

describe('pickNextRoutine — rotation from last completed', () => {
  it('after training A, suggests B', () => {
    const pick = pickNextRoutine(routines, [log('2026-01-05', 'a')], 1);
    expect(pick?.routine.id).toBe('b');
  });

  it('wraps C → A', () => {
    const pick = pickNextRoutine(routines, [log('2026-01-07', 'c')], 1);
    expect(pick?.routine.id).toBe('a');
  });

  it('uses the MOST RECENT workout log', () => {
    const logs = [log('2026-01-05', 'a'), log('2026-01-06', 'b')];
    expect(pickNextRoutine(routines, logs, 1)?.routine.id).toBe('c'); // last was B → C
  });

  it('ignores logs for routines not in the current set and non-workout logs', () => {
    const logs: WorkoutLog[] = [
      { id: '1', date: '2026-01-09', type: 'rest', exercises: [] },
      { id: '2', date: '2026-01-08', type: 'workout', routineId: 'ghost', exercises: [] },
      log('2026-01-05', 'a'),
    ];
    expect(pickNextRoutine(routines, logs, 1)?.routine.id).toBe('b'); // only A counts → B
  });
});

describe('pickNextRoutine — no history fallback', () => {
  it('picks by suggestedDays for the soonest upcoming day', () => {
    const mon = routine('a', 'Día A', [1]); // Monday
    const wed = routine('b', 'Día B', [3]); // Wednesday
    // today = Tuesday (2): soonest match is Wednesday → B, offset 1
    const pick = pickNextRoutine([mon, wed], [], 2);
    expect(pick?.routine.id).toBe('b');
    expect(pick?.dayOffset).toBe(1);
  });

  it('falls back to the first workout when no suggestedDays match', () => {
    const pick = pickNextRoutine(routines, [], 0);
    expect(pick?.routine.id).toBe('a');
    expect(pick?.dayOffset).toBe(0);
  });

  it('returns null when there are no workout routines', () => {
    expect(pickNextRoutine([], [], 0)).toBeNull();
  });
});
