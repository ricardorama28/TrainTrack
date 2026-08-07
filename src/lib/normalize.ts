// Unicode range for combining diacritical marks (accents).
const COMBINING_MARKS = /[̀-ͯ]/g;

/**
 * Normalises a name for comparison: lowercase, trimmed, collapsed spaces,
 * accents removed. Used to dedup "Hip Thrust" vs "hip thrust" vs "Hip  Thrust"
 * and to join workout logs to the exercise library by name.
 *
 * Lives in `lib/` (not a hook) so pure analytics modules can use it without
 * importing React.
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/\s+/g, ' ')
    .trim();
}
