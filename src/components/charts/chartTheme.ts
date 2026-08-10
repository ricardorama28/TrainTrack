// Shared chart palette, aligned with the Tailwind primary/accent scales so the
// Recharts visuals read as part of the same design system in light and dark.

export const CHART = {
  primary: '#84D717',   // primary-500 (lime)
  primaryDim: '#B7F03A',
  accent: '#F85F26',    // accent-500 (amber)
  grid: 'rgba(148, 163, 184, 0.18)',
  axis: '#94a3b8',      // slate-400, legible on both themes
};

/** Muscle-group bar colors — one stable hue per group, harmonized with the
 *  lime/amber brand plus a few distinct tech hues so groups stay readable. */
export const MUSCLE_COLORS: Record<string, string> = {
  glutes: '#84D717',    // lime (brand)
  legs: '#B7F03A',      // bright lime
  back: '#22D3EE',      // cyan
  chest: '#F85F26',     // amber (brand accent)
  shoulders: '#FBBF24', // gold
  arms: '#F472B6',      // pink
  core: '#2DD4BF',      // teal
  'full-body': '#94A3B8', // slate
  mobility: '#4ADE80',  // green
  other: '#64748B',     // muted slate
};
