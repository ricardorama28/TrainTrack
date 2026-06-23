import { useState, useCallback } from 'react';
import { storage } from '../lib/storage';
import type { Exercise } from '../types';

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Unicode range for combining diacritical marks (accents).
const COMBINING_MARKS = /[̀-ͯ]/g;

/**
 * Normalises a name for comparison: lowercase, trimmed, collapsed spaces,
 * accents removed. Used to dedup "Hip Thrust" vs "hip thrust" vs "Hip  Thrust".
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>(() => storage.getExercises());

  const save = useCallback((updated: Exercise[]) => {
    storage.setExercises(updated);
    setExercises(updated);
  }, []);

  const findByName = useCallback((name: string): Exercise | undefined => {
    const key = normalizeName(name);
    return storage.getExercises().find(e => e.nameLower === key);
  }, []);

  const addExercise = useCallback((data: Omit<Exercise, 'id' | 'createdAt' | 'nameLower'>): Exercise => {
    const current = storage.getExercises();
    const exercise: Exercise = {
      ...data,
      id: newId(),
      nameLower: normalizeName(data.name),
      createdAt: new Date().toISOString(),
    };
    save([...current, exercise]);
    return exercise;
  }, [save]);

  const updateExercise = useCallback((id: string, updates: Partial<Omit<Exercise, 'id' | 'createdAt'>>) => {
    const current = storage.getExercises();
    save(current.map(e => {
      if (e.id !== id) return e;
      const merged = { ...e, ...updates };
      // keep nameLower in sync if name changed
      if (updates.name) merged.nameLower = normalizeName(updates.name);
      return merged;
    }));
  }, [save]);

  const deleteExercise = useCallback((id: string) => {
    save(storage.getExercises().filter(e => e.id !== id));
  }, [save]);

  /**
   * Returns an existing exercise matching `name` (by normalised name) or
   * creates a new one with the provided defaults. Does NOT overwrite existing
   * data — reuse is preferred over duplication.
   */
  const getOrCreate = useCallback((
    name: string,
    defaults?: Partial<Omit<Exercise, 'id' | 'createdAt' | 'nameLower' | 'name'>>,
  ): Exercise => {
    const key = normalizeName(name);
    const current = storage.getExercises();
    const existing = current.find(e => e.nameLower === key);
    if (existing) return existing;

    const exercise: Exercise = {
      id: newId(),
      name: name.trim(),
      nameLower: key,
      createdAt: new Date().toISOString(),
      ...defaults,
    };
    save([...current, exercise]);
    return exercise;
  }, [save]);

  const refresh = useCallback(() => {
    setExercises(storage.getExercises());
  }, []);

  return {
    exercises,
    findByName,
    addExercise,
    updateExercise,
    deleteExercise,
    getOrCreate,
    refresh,
  };
}
