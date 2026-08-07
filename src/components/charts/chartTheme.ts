// Shared chart palette, aligned with the Tailwind primary/accent scales so the
// Recharts visuals read as part of the same design system in light and dark.

export const CHART = {
  primary: '#8b5cf6',   // primary-500 (violet)
  primaryDim: '#a78bfa',
  accent: '#f97316',    // accent-500 (orange)
  grid: 'rgba(148, 163, 184, 0.18)',
  axis: '#94a3b8',      // slate-400, legible on both themes
};

/** Muscle-group bar colors — one stable hue per group. */
export const MUSCLE_COLORS: Record<string, string> = {
  glutes: '#8b5cf6',
  legs: '#6366f1',
  back: '#0ea5e9',
  chest: '#f97316',
  shoulders: '#eab308',
  arms: '#ec4899',
  core: '#14b8a6',
  'full-body': '#64748b',
  mobility: '#22c55e',
  other: '#94a3b8',
};
