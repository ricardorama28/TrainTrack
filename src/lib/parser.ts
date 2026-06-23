import type { ParsedDay, ParsedExercise, ParseResult } from '../types';

// ─── Keywords ─────────────────────────────────────────────────────────────────

const REST_KEYWORDS = /descanso|rest\b|recuperaci[oó]n/i;
const ACTIVE_REST_KEYWORDS = /descanso\s+activo|active\s+rest|movilidad|mobility|stretching|estiramiento|caminata/i;
const DAY_HEADER_PATTERN = /^(.+?)\s*[:：]\s*$/;
const BULLET_PATTERN = /^[\-\*•·▪▸►]\s+(.+)$/;
const NUMBERED_PATTERN = /^\d+[.)]\s+(.+)$/;
const URL_PATTERN = /https?:\/\/[^\s]+/i;

// Sets x Reps: "4x10", "3 x 12", "4×10"
const SETS_REPS_PATTERN = /(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)/i;
// Weight: "25 kg", "7.5kg", "25lb"
const WEIGHT_PATTERN = /(\d+(?:[.,]\d+)?)\s*(?:kg|kgs|lb|lbs)/i;
// Duration: "30 segundos", "30s", "1 min"
const DURATION_PATTERN = /(\d+)\s*(?:seg(?:undos?)?|s\b|min(?:utos?)?)/i;
// Rest: "60s descanso", "descanso 60s"
const REST_SECONDS_PATTERN = /(?:descanso|rest)\s+(\d+)\s*s|(\d+)\s*s\s+(?:descanso|rest)/i;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractUrl(text: string): { url: string | undefined; cleaned: string } {
  const match = URL_PATTERN.exec(text);
  if (!match) return { url: undefined, cleaned: text };
  return {
    url: match[0],
    cleaned: text.replace(match[0], '').trim(),
  };
}

function parseSetsReps(text: string): { sets?: number; reps?: string; cleaned: string } {
  // First check if it's a time-based exercise ("3x30 segundos")
  const timePart = DURATION_PATTERN.exec(text);
  const setsRepsMatch = SETS_REPS_PATTERN.exec(text);

  if (setsRepsMatch) {
    const sets = parseInt(setsRepsMatch[1]);
    const repsRaw = setsRepsMatch[2];
    // Check if after the reps value there's a time unit
    const afterSetsReps = text.slice(setsRepsMatch.index + setsRepsMatch[0].length).trim();
    const timeUnit = /^(seg(?:undos?)?|s\b|min(?:utos?)?)/i.exec(afterSetsReps);
    const reps = timeUnit ? `${repsRaw} ${timeUnit[0]}` : repsRaw;
    const cleaned = text.replace(setsRepsMatch[0], '').replace(timeUnit ? timeUnit[0] : '', '').trim();
    return { sets, reps, cleaned };
  }

  if (timePart) {
    // Something like "3 series de 30 segundos"
    const seriesMatch = /(\d+)\s*series/i.exec(text);
    if (seriesMatch) {
      return {
        sets: parseInt(seriesMatch[1]),
        reps: `${timePart[1]} ${timePart[0].replace(timePart[1], '').trim()}`,
        cleaned: text.replace(seriesMatch[0], '').replace(timePart[0], '').trim(),
      };
    }
  }

  return { cleaned: text };
}

function parseWeight(text: string): { weight?: number; cleaned: string } {
  const match = WEIGHT_PATTERN.exec(text);
  if (!match) return { cleaned: text };
  const weight = parseFloat(match[1].replace(',', '.'));
  return { weight, cleaned: text.replace(match[0], '').trim() };
}

function parseRestSeconds(text: string): { restSeconds?: number; cleaned: string } {
  const match = REST_SECONDS_PATTERN.exec(text);
  if (!match) return { cleaned: text };
  const seconds = parseInt(match[1] || match[2]);
  return { restSeconds: seconds, cleaned: text.replace(match[0], '').trim() };
}

/** Clean up leftover punctuation after extraction */
function cleanRemnants(text: string): string {
  return text
    .replace(/^[,;:\-\s]+|[,;:\-\s]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Parse a single exercise line into a ParsedExercise.
 * Whatever can't be parsed goes into `notes`.
 */
function parseExerciseLine(line: string): ParsedExercise {
  const { url, cleaned: afterUrl } = extractUrl(line);
  const { sets, reps, cleaned: afterSetsReps } = parseSetsReps(afterUrl);
  const { weight, cleaned: afterWeight } = parseWeight(afterSetsReps);
  const { restSeconds, cleaned: afterRest } = parseRestSeconds(afterWeight);

  // The name is what's left at the start before any commas or numbers
  // Split by comma to find name and leftover notes
  const parts = cleanRemnants(afterRest).split(',');
  const name = cleanRemnants(parts[0]);
  const leftover = parts.slice(1).join(',').trim();

  return {
    name: name || line.trim(),
    sets,
    reps,
    weight,
    restSeconds,
    videoUrl: url,
    notes: leftover || undefined,
  };
}

/**
 * Detect whether a line is a day/section header.
 * Returns the header text or null.
 */
function detectHeader(line: string): string | null {
  // Match lines like "Día A:", "Lunes:", "Glúteos:", "Descanso:", "**Día A**:"
  const cleaned = line.replace(/\*+/g, '').replace(/#+ /g, '').trim();
  const match = DAY_HEADER_PATTERN.exec(cleaned);
  if (match) return match[1].trim();

  // Also match lines that are ALL CAPS with no colon if they look like titles
  if (/^[A-ZÁÉÍÓÚÑ\s]+$/.test(cleaned) && cleaned.length > 2 && cleaned.length < 40) {
    return cleaned;
  }

  return null;
}

/** Extract the bullet/numbered line content */
function extractBulletContent(line: string): string | null {
  const bulletMatch = BULLET_PATTERN.exec(line);
  if (bulletMatch) return bulletMatch[1].trim();
  const numberedMatch = NUMBERED_PATTERN.exec(line);
  if (numberedMatch) return numberedMatch[1].trim();
  return null;
}

// ─── Main Parser ──────────────────────────────────────────────────────────────

/**
 * Parse free-form routine text into structured ParseResult.
 *
 * Accepts flexible formats:
 *   Día A:            <- header
 *   - Hip Thrust: 4x10, 25kg
 *   * Sentadilla: 3x12
 *
 *   Descanso:         <- rest day header
 *   - Caminata
 */
export function parseRoutineText(text: string): ParseResult {
  const lines = text.split('\n').map(l => l.trimEnd());
  const days: ParsedDay[] = [];
  let currentDay: ParsedDay | null = null;
  const generalNotes: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for header
    const header = detectHeader(trimmed);
    if (header) {
      if (currentDay) days.push(currentDay);
      const isActiveRest = ACTIVE_REST_KEYWORDS.test(header);
      const isRest = REST_KEYWORDS.test(header) && !isActiveRest;
      currentDay = {
        name: header,
        type: isRest || isActiveRest ? 'active-rest' : 'workout',
        exercises: [],
        notes: undefined,
      };
      continue;
    }

    // Check for bullet/numbered item
    const bulletContent = extractBulletContent(trimmed);
    if (bulletContent) {
      if (!currentDay) {
        // Exercises without a header go into a default "Rutina" day
        currentDay = { name: 'Rutina', type: 'workout', exercises: [] };
      }
      const exercise = parseExerciseLine(bulletContent);
      if (exercise.name) {
        currentDay.exercises.push(exercise);
      }
      continue;
    }

    // Plain line (not a header, not a bullet)
    // Could be a note or an unlabeled exercise
    if (currentDay) {
      // Try parsing as an exercise anyway (some people don't use bullets)
      const couldBeExercise = /\d+x\d+|kg|lb|series/i.test(trimmed);
      if (couldBeExercise) {
        currentDay.exercises.push(parseExerciseLine(trimmed));
      } else {
        // Append as a note to the current day
        currentDay.notes = currentDay.notes
          ? `${currentDay.notes}\n${trimmed}`
          : trimmed;
      }
    } else {
      generalNotes.push(trimmed);
    }
  }

  if (currentDay) days.push(currentDay);

  return {
    days,
    generalNotes: generalNotes.length > 0 ? generalNotes.join('\n') : undefined,
  };
}
