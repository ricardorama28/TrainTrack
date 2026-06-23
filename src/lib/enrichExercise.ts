import type { Exercise } from '../types';
import { findKnowledgeEntry, type ExerciseKnowledgeEntry } from '../data/exerciseKnowledgeBase';

/**
 * Migrates a legacy `videoUrl` into the new reference fields without ever
 * discarding it. A manually entered videoUrl becomes a protected manual
 * reference so later enrichment will not overwrite it.
 */
export function migrateReference(ex: Exercise): Exercise {
  if (ex.referenceUrl || !ex.videoUrl) return ex;
  return {
    ...ex,
    referenceUrl: ex.videoUrl,
    referenceType: ex.referenceType ?? 'youtube',
    referenceSource: 'manual',
    referenceStatus: 'manual',
  };
}

/** True when the exercise already has a reference the user owns — never touch it. */
function hasProtectedReference(ex: Exercise): boolean {
  if (ex.referenceStatus === 'manual' || ex.referenceStatus === 'accepted') return true;
  // Legacy/unlabelled link counts as user-owned.
  return Boolean(ex.referenceUrl || ex.videoUrl);
}

/**
 * Fills empty fields of an exercise from the local knowledge base. Existing
 * values are never overwritten, and a manual/accepted reference is preserved.
 *
 * Returns the same object reference when nothing changed, so callers can cheaply
 * detect no-ops.
 */
export function enrichExerciseFromKnowledgeBase(ex: Exercise): Exercise {
  const migrated = migrateReference(ex);
  const entry = findKnowledgeEntry(migrated.name);
  if (!entry) return migrated;

  const next: Exercise = { ...migrated };
  let changed = migrated !== ex;

  const fillScalar = <K extends keyof Exercise>(key: K, value: Exercise[K] | undefined) => {
    if (value != null && next[key] == null) {
      next[key] = value;
      changed = true;
    }
  };
  const fillArray = <K extends keyof Exercise>(key: K, value: string[] | undefined) => {
    const cur = next[key] as unknown as string[] | undefined;
    if (value && value.length > 0 && (!cur || cur.length === 0)) {
      next[key] = value as Exercise[K];
      changed = true;
    }
  };

  fillScalar('muscleGroup', entry.muscleGroup);
  fillScalar('category', entry.category);
  fillScalar('description', entry.description);
  fillScalar('purpose', entry.purpose);
  fillScalar('safetyNotes', entry.safetyNotes);
  fillArray('primaryMuscles', entry.primaryMuscles);
  fillArray('secondaryMuscles', entry.secondaryMuscles);
  fillArray('equipment', entry.equipment);
  fillArray('simpleInstructions', entry.simpleInstructions);
  fillArray('commonMistakes', entry.commonMistakes);
  fillArray('aliases', entry.aliases);

  // Reference: only set when the user has none. Local exact match is trusted, so
  // it is auto-accepted (no preview needed), per the agreed design.
  if (!hasProtectedReference(next)) {
    next.referenceUrl = entry.referenceUrl;
    next.referenceType = entry.referenceType;
    next.referenceSource = 'local';
    next.referenceStatus = 'accepted';
    // Mirror into legacy field so older views keep working.
    if (!next.videoUrl) next.videoUrl = entry.referenceUrl;
    changed = true;
  }

  if (changed) next.updatedAt = new Date().toISOString();
  return changed ? next : ex;
}

/** Whether the local knowledge base knows this exercise name. */
export function isKnown(name: string): boolean {
  return findKnowledgeEntry(name) !== undefined;
}

export type { ExerciseKnowledgeEntry };
