import type { MuscleGroup, ExercisePriority } from '../types';

// ─── Shared display labels (Spanish) ──────────────────────────────────────────
// Centralised here so the guided session, forms, library and charts all read
// from one source instead of duplicating the map in every component.

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  glutes: 'Glúteos',
  legs: 'Piernas',
  back: 'Espalda',
  chest: 'Pecho',
  shoulders: 'Hombros',
  arms: 'Brazos',
  core: 'Core',
  'full-body': 'Full Body',
  mobility: 'Movilidad',
  other: 'Otro',
};

export const MUSCLE_OPTIONS: { value: MuscleGroup; label: string }[] = (
  Object.keys(MUSCLE_LABELS) as MuscleGroup[]
).map(value => ({ value, label: MUSCLE_LABELS[value] }));

export function muscleLabel(group?: MuscleGroup): string {
  return group ? MUSCLE_LABELS[group] : 'Otro';
}

export const PRIORITY_LABELS: Record<ExercisePriority, string> = {
  primary: 'Principal',
  secondary: 'Importante',
  optional: 'Opcional',
};

export const PRIORITY_OPTIONS: { value: ExercisePriority; label: string }[] = [
  { value: 'primary', label: 'Principal' },
  { value: 'secondary', label: 'Importante' },
  { value: 'optional', label: 'Opcional' },
];
