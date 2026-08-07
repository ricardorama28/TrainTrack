import type { ExerciseTemplate, Settings, ProgressionSuggestion } from '../types';
import type { ExercisePerformance } from './analytics';
import { getCurrentLoadBlock, getBestPerformanceAtWeight } from './analytics';

// ─── Progression engine ───────────────────────────────────────────────────────
// Turns "what happened" into "what to do next". Pure and unit-tested.
//
// Philosophy: never reward a single session. Track the best progress of the
// CURRENT load block, don't regress on one bad day, demand reserve (RIR) before
// adding load, and recover the rep range before chasing a new record.

const DEFAULT_INCREMENT = 2.5;
const DEFAULT_TARGET_RIR = 1;

/** "6-10" → {min:6,max:10}; "10" → {min:10,max:10}; "al fallo" → undefined. */
export function parseRepRange(reps?: string): { min: number; max: number } | undefined {
  if (!reps) return undefined;
  const nums = reps.match(/\d+/g);
  if (!nums || nums.length === 0) return undefined;
  const a = parseInt(nums[0], 10);
  const b = nums.length > 1 ? parseInt(nums[1], 10) : a;
  return { min: Math.min(a, b), max: Math.max(a, b) };
}

/** Distribute `total` reps across `sets` within [min,max], balanced, adding the
 *  surplus one rep at a time from the first set (→ 9/8/8/8, then 9/9/8/8, …). */
function distributeReps(total: number, sets: number, min: number, max: number): number[] {
  const arr = new Array(sets).fill(min);
  let rem = total - sets * min;
  let i = 0;
  let guard = sets * (max - min);
  while (rem > 0 && guard-- > 0) {
    if (arr[i] < max) {
      arr[i]++;
      rem--;
    }
    i = (i + 1) % sets;
  }
  return arr;
}

function repRange(template: ExerciseTemplate): { min: number; max: number } | undefined {
  const parsed = parseRepRange(template.reps);
  const min = template.targetRepMin ?? parsed?.min;
  const max = template.targetRepMax ?? parsed?.max;
  if (min == null || max == null) return undefined;
  return { min: Math.min(min, max), max: Math.max(min, max) };
}

export interface SuggestArgs {
  template: ExerciseTemplate;
  performances: ExercisePerformance[];
  settings: Settings;
}

export function suggestNextTarget({ template, performances, settings }: SuggestArgs): ProgressionSuggestion {
  const method = template.progressionMethod ?? 'none';
  const range = repRange(template);
  const sets = template.sets && template.sets > 0 ? template.sets : 1;

  // No automatic progression configured → mirror the prescription (today's behavior).
  if (method !== 'double-progression' || !range) {
    return {
      action: 'repeat',
      targetWeight: template.weight,
      targetRepMin: range?.min,
      targetRepMax: range?.max,
      confidence: 'high',
      reason: 'Repetí la prescripción.',
    };
  }

  const { min, max } = range;
  const minTotal = sets * min;
  const maxTotal = sets * max;
  const increment = template.weightIncrement ?? settings.defaultWeightIncrement ?? DEFAULT_INCREMENT;
  const targetRir = template.targetRir ?? DEFAULT_TARGET_RIR;

  // Reference weight: the prescribed weight, else the most recent load used.
  const last = performances[performances.length - 1];
  const currentWeight = template.weight ?? last?.topWeight;

  const baseTarget = {
    targetRepMin: min,
    targetRepMax: max,
    rir: targetRir,
  };

  // No history at all, or no exposures at this weight → start at the bottom of the range.
  const block = currentWeight != null ? getCurrentLoadBlock(performances, currentWeight) : [];
  const best = getBestPerformanceAtWeight(block, currentWeight);
  if (!best || currentWeight == null) {
    return {
      action: 'first-time',
      targetWeight: currentWeight,
      targetReps: distributeReps(minTotal, sets, min, max),
      targetTotalReps: minTotal,
      ...baseTarget,
      confidence: performances.length === 0 ? 'high' : 'legacy',
      reason:
        currentWeight != null
          ? `Primera vez con ${currentWeight} kg — apuntá a ${sets}×${min}.`
          : `Empezá con ${sets}×${min}.`,
    };
  }

  const recentAtWeight = block[block.length - 1];
  const weightLabel = `${currentWeight} kg`;

  // 🔧D — the most recent exposure fell below the range: recover it before chasing a record.
  if (recentAtWeight.totalReps < minTotal) {
    return {
      action: 'consolidate',
      targetWeight: currentWeight,
      targetReps: distributeReps(minTotal, sets, min, max),
      targetTotalReps: minTotal,
      ...baseTarget,
      confidence: 'high',
      reason: `Rendimiento reciente por debajo del rango — recuperá ≥${minTotal} reps con ${weightLabel} antes del próximo récord.`,
    };
  }

  const repCeilingReached = best.totalReps >= maxTotal;

  if (repCeilingReached) {
    // The RIR gate uses the RIR of the performance that reached the ceiling (best), not another session.
    const ceilingRir = best.lastWorkingSetRir;
    if (ceilingRir == null) {
      return {
        action: 'increase-weight',
        targetWeight: currentWeight + increment,
        targetReps: new Array(sets).fill(min),
        targetTotalReps: minTotal,
        ...baseTarget,
        confidence: 'legacy',
        reason: `Techo del rango alcanzado (sin RIR registrado) — subí ${increment} kg a ${currentWeight + increment} kg.`,
      };
    }
    if (ceilingRir >= targetRir) {
      return {
        action: 'increase-weight',
        targetWeight: currentWeight + increment,
        targetReps: new Array(sets).fill(min),
        targetTotalReps: minTotal,
        ...baseTarget,
        confidence: 'high',
        reason: `Alcanzaste ${maxTotal} reps con RIR ${ceilingRir} — subí ${increment} kg a ${currentWeight + increment} kg.`,
      };
    }
    // Ceiling reached but not enough reserve (e.g. RIR 0) → consolidate the load.
    return {
      action: 'consolidate',
      targetWeight: currentWeight,
      targetReps: new Array(sets).fill(max),
      targetTotalReps: maxTotal,
      ...baseTarget,
      confidence: 'high',
      reason: `Llegaste al techo pero con poca reserva (RIR ${ceilingRir}) — consolidá ${weightLabel} antes de subir.`,
    };
  }

  // 🔧B/C — add reps, referenced against the best total of the block (not the last session).
  const nextTotal = Math.min(Math.max(best.totalReps, minTotal) + 1, maxTotal);
  const targetReps = distributeReps(nextTotal, sets, min, max);
  return {
    action: 'add-reps',
    targetWeight: currentWeight,
    targetReps,
    targetTotalReps: nextTotal,
    ...baseTarget,
    confidence: best.lastWorkingSetRir != null ? 'high' : 'legacy',
    reason: `Mejor a ${weightLabel}: ${best.totalReps} reps — objetivo ${nextTotal} (ref ${targetReps.join('/')}).`,
  };
}
