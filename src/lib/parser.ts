import type { ParsedDay, ParsedExercise, ParseResult } from '../types';

// ─── Day header whitelist ─────────────────────────────────────────────────────
// Only these patterns are accepted as day section headers.
// Anything else (medical context, goals, equipment notes) is ignored as a header.

const DAY_HEADER_WHITELIST: RegExp[] = [
  /^d[ií]a\s*[a-z0-9]/i,          // Día A, Día 1, Day A, Día A-B
  /^lunes\b/i,
  /^martes\b/i,
  /^mi[eé]rcoles\b/i,
  /^jueves\b/i,
  /^viernes\b/i,
  /^s[aá]bado\b/i,
  /^domingo\b/i,
  /^descanso/i,                    // Descanso, Descanso activo
  /^movilidad/i,
  /^trabajo\s+postural/i,
  /^todos\s+los\s+d[ií]as/i,
  /^calentamiento/i,
  /^enfriamiento/i,
  /^gl[uú]teos/i,                  // Glúteos (muscle-focused day name)
  /^piernas/i,
  /^espalda/i,
  /^pecho/i,
  /^hombros/i,
  /^brazos/i,
  /^core/i,
  /^full.?body/i,
  /^bloque\s/i,
  /^semana\s/i,
  /^entrenamiento\s/i,
];

// Lines containing these phrases are advisory/contextual — never treated as exercises
const CONTEXT_SIGNALS: RegExp[] = [
  /\btienes?\b/i,
  /\btenés?\b/i,
  /\bdispon[eé]s?\b/i,
  /\btu objetivo\b/i,
  /\byo har[ií]a\b/i,
  /\bconsulta[r]?\b/i,
  /\bespecialista\b/i,
  /\bm[eé]dico\b/i,
  /\bdiagn[oó]stico\b/i,
  /\bs[ií]ntoma\b/i,
  /\blesi[oó]n\b/i,
  /\bsi puedes\b/i,
  /\bsi no puedes\b/i,
  /\brecomiendo\b/i,
  /\bsugiero\b/i,
  /\bdependiendo\b/i,
  /\bprogresa\b/i,
  /\ben tu caso\b/i,
  /\bpor eso\b/i,
  /\brecuerda\b/i,
  /\bimportante\b/i,
  /\bobjetivo\b/i,
  /\bprogres[ií]/i,
];

// An exercise line MUST have at least one of these to be accepted
const EXERCISE_SIGNALS: RegExp[] = [
  /\d+\s*[x×]\s*[\d]/i,                      // 4x10, 3×8-12
  /\d+\s+series?\b/i,                         // 3 series
  /\d+\s+reps?\b/i,                           // 10 reps
  /\d+\s+repeticiones?\b/i,                   // 12 repeticiones
  /\d+\s*seg(?:undos?)?\b/i,                  // 30 seg / 30 segundos
  /\d+\s*min(?:utos?)?\b/i,                   // 2 min
  /\d+(?:[.,]\d+)?\s*(?:kg|kgs|lb|lbs)\b/i,  // 25 kg, 7.5kg
];

// ─── Extraction patterns ──────────────────────────────────────────────────────

const SETS_REPS_PATTERN = /(\d+)\s*[x×]\s*([\d]+(?:[.,]\d+)?(?:\s*[-–]\s*[\d]+)?)/i;
const SERIES_PATTERN = /(\d+)\s+series?(?:\s+de\s+([\d][\d\-]*(?:\s*(?:seg(?:undos?)?|min(?:utos?)?))?))?/i;
const REPS_PATTERN = /^(\d+)\s+reps?\b/i;
const WEIGHT_PATTERN = /(\d+(?:[.,]\d+)?)\s*(?:kg|kgs|lb|lbs)\b/i;
const REST_SECONDS_PATTERN = /(?:descanso|rest)[:\s]+(\d+)\s*s(?:eg)?|(\d+)\s*s(?:eg)?\s+(?:descanso|rest)/i;
const URL_PATTERN = /https?:\/\/[^\s]+/i;
const BULLET_PATTERN = /^[\-\*•·▪▸►]\s+(.+)$/;
const NUMBERED_ITEM_PATTERN = /^\d+[.)]\s+(.+)$/;
const ACTIVE_REST_KEYWORDS = /descanso\s+activo|active\s+rest|movilidad|mobility|stretching|estiramiento|caminata/i;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isContextual(text: string): boolean {
  return CONTEXT_SIGNALS.some(p => p.test(text));
}

function hasExerciseSignal(text: string): boolean {
  return EXERCISE_SIGNALS.some(p => p.test(text));
}

function extractUrl(text: string): { url?: string; cleaned: string } {
  const m = URL_PATTERN.exec(text);
  if (!m) return { cleaned: text };
  return { url: m[0], cleaned: text.replace(m[0], '').trim() };
}

function parseSetsReps(text: string): { sets?: number; reps?: string; cleaned: string } {
  const srm = SETS_REPS_PATTERN.exec(text);
  if (srm) {
    const sets = parseInt(srm[1]);
    const repsRaw = srm[2];
    const after = text.slice(srm.index + srm[0].length).trim();
    const timeUnit = /^(seg(?:undos?)?|min(?:utos?)?)/.exec(after);
    const reps = timeUnit ? `${repsRaw} ${timeUnit[0]}` : repsRaw;
    const cleaned = text.replace(srm[0], '').replace(timeUnit ? timeUnit[0] : '', '').trim();
    return { sets, reps, cleaned };
  }

  const sm = SERIES_PATTERN.exec(text);
  if (sm) {
    return {
      sets: parseInt(sm[1]),
      reps: sm[2] || undefined,
      cleaned: text.replace(sm[0], '').trim(),
    };
  }

  const rm = REPS_PATTERN.exec(text);
  if (rm) {
    return { reps: rm[1], cleaned: text.replace(rm[0], '').trim() };
  }

  return { cleaned: text };
}

function parseWeight(text: string): { weight?: number; cleaned: string } {
  const m = WEIGHT_PATTERN.exec(text);
  if (!m) return { cleaned: text };
  return { weight: parseFloat(m[1].replace(',', '.')), cleaned: text.replace(m[0], '').trim() };
}

function parseRestSeconds(text: string): { restSeconds?: number; cleaned: string } {
  const m = REST_SECONDS_PATTERN.exec(text);
  if (!m) return { cleaned: text };
  return { restSeconds: parseInt(m[1] || m[2]), cleaned: text.replace(m[0], '').trim() };
}

function cleanRemnants(text: string): string {
  return text.replace(/^[,;:\-\s]+|[,;:\-\s]+$/g, '').replace(/\s{2,}/g, ' ').trim();
}

function stripMarkdown(line: string): string {
  return line.replace(/\*+/g, '').replace(/^#+\s*/, '').replace(/_+/g, '').trim();
}

/**
 * Returns null if the line doesn't look like an exercise.
 * Only accepts lines with explicit sets/reps signals and no contextual phrases.
 */
function parseExerciseLine(line: string): ParsedExercise | null {
  if (isContextual(line)) return null;
  if (!hasExerciseSignal(line)) return null;

  const { url, cleaned: c1 } = extractUrl(line);
  const { sets, reps, cleaned: c2 } = parseSetsReps(c1);
  const { weight, cleaned: c3 } = parseWeight(c2);
  const { restSeconds, cleaned: c4 } = parseRestSeconds(c3);

  const parts = cleanRemnants(c4).split(',');
  const name = cleanRemnants(parts[0]);
  if (!name) return null;

  return {
    name,
    sets,
    reps,
    weight,
    restSeconds,
    videoUrl: url,
    notes: parts.slice(1).join(',').trim() || undefined,
  };
}

/**
 * Returns the header text if the line is a valid day header, or null.
 * Requires the line to end with ":" (except markdown ## headings) AND
 * match the day header whitelist.
 */
function detectDayHeader(line: string): string | null {
  const cleaned = stripMarkdown(line);

  // Markdown headings (## Día A) are always headers
  if (/^#+\s/.test(line)) {
    return cleaned || null;
  }

  // Must end with ":" to be a header
  const m = /^(.+?)\s*[:：]\s*$/.exec(cleaned);
  if (!m) return null;

  const candidate = m[1].trim();
  if (candidate.length > 60) return null; // sanity cap

  if (DAY_HEADER_WHITELIST.some(p => p.test(candidate))) {
    return candidate;
  }

  return null;
}

function extractBulletContent(line: string): string | null {
  const m = BULLET_PATTERN.exec(line) ?? NUMBERED_ITEM_PATTERN.exec(line);
  return m ? m[1].trim() : null;
}

// ─── Main parser ──────────────────────────────────────────────────────────────

/**
 * Conservative free-text routine parser.
 *
 * Day headers: only explicit patterns (Día A:, Lunes:, Glúteos:, etc.)
 * Exercises: only bullet/numbered lines that have sets×reps, kg, or duration
 * Everything else: goes to day notes or generalNotes — never silently as exercises
 */
export function parseRoutineText(text: string): ParseResult {
  const lines = text.split('\n').map(l => l.trimEnd());
  const days: ParsedDay[] = [];
  let currentDay: ParsedDay | null = null;
  const generalNotes: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // ── Day header? ───────────────────────────────────────────────────────────
    const header = detectDayHeader(trimmed);
    if (header) {
      if (currentDay) days.push(currentDay);
      const isActiveRest = ACTIVE_REST_KEYWORDS.test(header);
      const isRestOnly = /^descanso$/i.test(header);
      currentDay = {
        name: header,
        type: isRestOnly || isActiveRest ? 'active-rest' : 'workout',
        exercises: [],
      };
      continue;
    }

    // ── Bullet / numbered item ────────────────────────────────────────────────
    const bulletContent = extractBulletContent(trimmed);
    if (bulletContent !== null) {
      const exercise = parseExerciseLine(bulletContent);
      if (exercise) {
        if (!currentDay) {
          currentDay = { name: 'Rutina', type: 'workout', exercises: [] };
        }
        currentDay.exercises.push(exercise);
      } else {
        // Bullet but not an exercise → notes
        if (currentDay) {
          currentDay.notes = currentDay.notes
            ? `${currentDay.notes}\n${bulletContent}`
            : bulletContent;
        } else {
          generalNotes.push(bulletContent);
        }
      }
      continue;
    }

    // ── Plain line (no bullet, no header) ────────────────────────────────────
    // Only add as exercise if it has an explicit signal AND no context keywords
    if (currentDay) {
      if (hasExerciseSignal(trimmed) && !isContextual(trimmed)) {
        const exercise = parseExerciseLine(trimmed);
        if (exercise) {
          currentDay.exercises.push(exercise);
          continue;
        }
      }
      currentDay.notes = currentDay.notes
        ? `${currentDay.notes}\n${trimmed}`
        : trimmed;
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
