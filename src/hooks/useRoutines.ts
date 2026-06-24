import { useState, useCallback } from 'react';
import { storage } from '../lib/storage';
import type { Routine, ExerciseTemplate } from '../types';

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useRoutines() {
  const [routines, setRoutines] = useState<Routine[]>(() => storage.getRoutines());

  const save = useCallback((updated: Routine[]) => {
    storage.setRoutines(updated);
    setRoutines(updated);
  }, []);

  const addRoutine = useCallback((routine: Omit<Routine, 'id' | 'createdAt'>) => {
    const current = storage.getRoutines();
    const newRoutine: Routine = {
      ...routine,
      id: newId(),
      createdAt: new Date().toISOString(),
    };
    save([...current, newRoutine]);
    return newRoutine;
  }, [save]);

  const updateRoutine = useCallback((id: string, updates: Partial<Omit<Routine, 'id' | 'createdAt'>>) => {
    save(storage.getRoutines().map(r => r.id === id ? { ...r, ...updates } : r));
  }, [save]);

  const deleteRoutine = useCallback((id: string) => {
    save(storage.getRoutines().filter(r => r.id !== id));
  }, [save]);

  const duplicateRoutine = useCallback((id: string) => {
    const current = storage.getRoutines();
    const original = current.find(r => r.id === id);
    if (!original) return;
    const copy: Routine = {
      ...original,
      id: newId(),
      name: `${original.name} (copia)`,
      createdAt: new Date().toISOString(),
      exercises: original.exercises.map(e => ({ ...e, id: newId() })),
    };
    save([...current, copy]);
  }, [save]);

  const addExerciseToRoutine = useCallback((routineId: string, exercise: Omit<ExerciseTemplate, 'id'>) => {
    const current = storage.getRoutines();
    save(current.map(r => {
      if (r.id !== routineId) return r;
      return { ...r, exercises: [...r.exercises, { ...exercise, id: newId() }] };
    }));
  }, [save]);

  const moveRoutine = useCallback((id: string, direction: 'up' | 'down') => {
    const current = storage.getRoutines();
    const index = current.findIndex(r => r.id === id);
    if (index === -1) return;
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= current.length) return;
    const updated = [...current];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    save(updated);
  }, [save]);

  const refresh = useCallback(() => {
    setRoutines(storage.getRoutines());
  }, []);

  return {
    routines,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    duplicateRoutine,
    addExerciseToRoutine,
    moveRoutine,
    refresh,
  };
}
