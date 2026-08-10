// ─── Date utilities ───────────────────────────────────────────────────────────
// We avoid importing date-fns locale to keep bundle size small.
// Spanish month/day names are defined here directly.

const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const MONTHS_ES_SHORT = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

const DAYS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DAYS_ES_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Fallback shown when a date string is missing or malformed */
const INVALID_DATE_LABEL = '—';

/**
 * Parse a YYYY-MM-DD string into a local Date (avoids UTC offset issues).
 * Returns null for null/undefined/non-string or malformed input instead of
 * throwing, and tolerates ISO strings ("YYYY-MM-DDTHH:MM:SSZ") by taking the
 * leading date portion. This prevents a single bad/legacy log from crashing
 * the whole app (there is no value worth a thrown exception here).
 */
export function parseLocalDate(dateStr?: string | null): Date | null {
  if (typeof dateStr !== 'string' || dateStr.length === 0) return null;
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format a YYYY-MM-DD string as "lunes, 23 de junio" */
export function formatDateLong(dateStr?: string | null): string {
  const d = parseLocalDate(dateStr);
  if (!d) return INVALID_DATE_LABEL;
  return `${DAYS_ES[d.getDay()]}, ${d.getDate()} de ${MONTHS_ES[d.getMonth()]}`;
}

/** Format a YYYY-MM-DD string as "23 jun" */
export function formatDateShort(dateStr?: string | null): string {
  const d = parseLocalDate(dateStr);
  if (!d) return INVALID_DATE_LABEL;
  return `${d.getDate()} ${MONTHS_ES_SHORT[d.getMonth()]}`;
}

/** Format a Date as "junio 2025" */
export function formatMonthYear(date: Date): string {
  return `${MONTHS_ES[date.getMonth()]} ${date.getFullYear()}`;
}

/** Return today as YYYY-MM-DD in local time */
export function todayStr(): string {
  const d = new Date();
  return toDateStr(d);
}

/** Convert a Date to YYYY-MM-DD (local time) */
export function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Return an array of YYYY-MM-DD strings for the 7 days of a week given a date in it */
export function getWeekDays(dateInWeek: Date): string[] {
  const dow = dateInWeek.getDay();
  const mondayOffset = dow === 0 ? 6 : dow - 1;
  const monday = new Date(dateInWeek);
  monday.setDate(dateInWeek.getDate() - mondayOffset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toDateStr(d);
  });
}

/** Return all days in a given month as YYYY-MM-DD strings */
export function getDaysInMonth(year: number, month: number): string[] {
  // month is 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = String(i + 1).padStart(2, '0');
    const m = String(month + 1).padStart(2, '0');
    return `${year}-${m}-${d}`;
  });
}

/** Returns day-of-week short name for a date string */
export function getDayName(dateStr: string, short = true): string {
  const d = parseLocalDate(dateStr);
  if (!d) return INVALID_DATE_LABEL;
  return short ? DAYS_ES_SHORT[d.getDay()] : DAYS_ES[d.getDay()];
}

/** Returns the first day of the week (0=Sun) for a given month/year */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/** Returns whether two date strings refer to the same day */
export function isSameDay(a: string, b: string): boolean {
  return a === b;
}

/** Returns relative label: "hoy", "ayer", or formatted date */
export function relativeDate(dateStr: string): string {
  const t = todayStr();
  if (dateStr === t) return 'hoy';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === toDateStr(yesterday)) return 'ayer';
  return formatDateShort(dateStr);
}

/** Returns upcoming N days from today as YYYY-MM-DD */
export function getUpcomingDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return toDateStr(d);
  });
}
