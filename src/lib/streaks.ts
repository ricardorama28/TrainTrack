import type { WorkoutLog, Settings } from '../types';

// ─── Streak Calculation ───────────────────────────────────────────────────────

/** Returns true if a log entry counts toward maintaining a streak */
function countsForStreak(log: WorkoutLog, settings: Settings): boolean {
  if (log.type === 'workout') return true;
  if (log.type === 'missed') return false;
  // 'rest' and 'active-rest' count if the setting is enabled
  return settings.restDaysKeepStreak;
}

/** Returns today's date as YYYY-MM-DD */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Returns a map from date string to WorkoutLog for fast lookup.
 */
function buildLogMap(logs: WorkoutLog[]): Map<string, WorkoutLog> {
  const map = new Map<string, WorkoutLog>();
  for (const log of logs) {
    map.set(log.date, log);
  }
  return map;
}

/**
 * Subtracts `days` from a YYYY-MM-DD date string.
 */
function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Calculates the current streak going backwards from today.
 * A streak is broken by:
 *  - A 'missed' entry
 *  - A day with no log (unless it's today, which may not have a log yet)
 */
export function calculateCurrentStreak(logs: WorkoutLog[], settings: Settings): number {
  const logMap = buildLogMap(logs);
  let streak = 0;
  let date = today();
  let offset = 0;

  // If today has no log yet, we start checking from yesterday
  if (!logMap.has(date)) {
    offset = 1;
    date = subtractDays(date, 1);
  }

  // Walk backwards as long as each day counts
  while (true) {
    const log = logMap.get(date);
    if (!log) break;
    if (!countsForStreak(log, settings)) break;
    streak++;
    date = subtractDays(date, 1);
    offset++;
    // Safety: don't loop forever (max 365 days back)
    if (offset > 366) break;
  }

  return streak;
}

/**
 * Calculates the all-time best streak.
 */
export function calculateBestStreak(logs: WorkoutLog[], settings: Settings): number {
  if (logs.length === 0) return 0;

  // Sort logs by date ascending
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));

  let best = 0;
  let current = 0;
  let prevDate: string | null = null;

  for (const log of sorted) {
    if (!countsForStreak(log, settings)) {
      current = 0;
      prevDate = null;
      continue;
    }

    if (prevDate === null) {
      current = 1;
    } else {
      // Check if this log is exactly one day after the previous
      const expected = subtractDays(log.date, -1); // prevDate + 1
      const actualExpected = subtractDays(log.date, 0);
      const dayAfterPrev = addOneDay(prevDate);
      if (log.date === dayAfterPrev) {
        current++;
      } else {
        // Gap — reset
        current = 1;
      }
    }

    prevDate = log.date;
    if (current > best) best = current;
  }

  return best;
}

function addOneDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Returns workout logs for the current ISO week (Mon–Sun) */
export function getThisWeekLogs(logs: WorkoutLog[]): WorkoutLog[] {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  // We want Mon as first day: adjust so Mon=0
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return logs.filter(log => {
    const d = new Date(log.date + 'T00:00:00');
    return d >= monday && d <= sunday;
  });
}
