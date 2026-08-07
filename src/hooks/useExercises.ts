import { useState, useCallback } from 'react';
import { storage } from '../lib/storage';
import { enrichExerciseFromKnowledgeBase } from '../lib/enrichExercise';
import { normalizeName } from '../lib/normalize';
import type { Exercise } from '../types';

// Re-exported for existing importers (e.g. ExercisesPage). Source lives in lib/normalize.
export { normalizeName };

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
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

  const addExercise = useCallback((
    data: Omit<Exercise, 'id' | 'createdAt' | 'nameLower'>,
    options?: { enrich?: boolean },
  ): Exercise => {
    const current = storage.getExercises();
    let exercise: Exercise = {
      ...data,
      id: newId(),
      nameLower: normalizeName(data.name),
      createdAt: new Date().toISOString(),
    };
    if (options?.enrich !== false) exercise = enrichExerciseFromKnowledgeBase(exercise);
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
    options?: { enrich?: boolean },
  ): Exercise => {
    const key = normalizeName(name);
    const current = storage.getExercises();
    const existing = current.find(e => e.nameLower === key);
    if (existing) return existing;

    let exercise: Exercise = {
      id: newId(),
      name: name.trim(),
      nameLower: key,
      createdAt: new Date().toISOString(),
      ...defaults,
    };
    if (options?.enrich !== false) exercise = enrichExerciseFromKnowledgeBase(exercise);
    save([...current, exercise]);
    return exercise;
  }, [save]);

  /**
   * Re-enriches every stored exercise from the local knowledge base, filling
   * empty fields only and preserving manual references. Returns how many
   * exercises changed.
   */
  const enrichExisting = useCallback((): number => {
    const current = storage.getExercises();
    let changed = 0;
    const updated = current.map(e => {
      const next = enrichExerciseFromKnowledgeBase(e);
      if (next !== e) changed++;
      return next;
    });
    if (changed > 0) save(updated);
    return changed;
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
    enrichExisting,
    refresh,
  };
}
