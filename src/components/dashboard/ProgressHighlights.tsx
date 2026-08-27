import { useMemo } from 'react';
import { Trophy, ArrowUp, Minus } from 'lucide-react';
import { Card, SectionLabel } from '../ui/Card';
import {
  getExercisePerformances, getLatestPRs, detectTrend, detectStalled, getCurrentLoadBlock,
} from '../../lib/analytics';
import type { WorkoutLog, Exercise, Settings } from '../../types';

interface ProgressHighlightsProps {
  logs: WorkoutLog[];
  exercises: Exercise[];
  settings: Settings;
}

type Kind = 'pr' | 'up' | 'stalled';
interface Highlight {
  name: string;
  kind: Kind;
  text: string;
  weight: number;
}

const ORDER: Record<Kind, number> = { pr: 0, up: 1, stalled: 2 };

export function ProgressHighlights({ logs, exercises, settings }: ProgressHighlightsProps) {
  const highlights = useMemo<Highlight[]>(() => {
    const threshold = settings.stalledSessionThreshold ?? 3;
    const items: Highlight[] = [];
    for (const ex of exercises) {
      const perfs = getExercisePerformances(logs, ex.id, ex.name);
      if (perfs.length < 2) continue;
      const currentWeight = perfs[perfs.length - 1].topWeight;
      const latest = getLatestPRs(perfs);
      const stalled = detectStalled(getCurrentLoadBlock(perfs, currentWeight), threshold);
      const trend = detectTrend(perfs);

      if (latest.any) {
        items.push({ name: ex.name, kind: 'pr', weight: currentWeight, text: latest.load ? 'nuevo PR de carga' : 'nuevo PR de reps' });
      } else if (stalled.stalled) {
        items.push({
          name: ex.name, kind: 'stalled', weight: currentWeight,
          text: stalled.reason === 'ceiling-failure'
            ? `${stalled.sessionsWithoutProgress} sesiones al techo sin reserva`
            : `${stalled.sessionsWithoutProgress} exposiciones sin progresión`,
        });
      } else if (trend === 'up') {
        items.push({ name: ex.name, kind: 'up', weight: currentWeight, text: 'progresando' });
      }
    }
    return items.sort((a, b) => ORDER[a.kind] - ORDER[b.kind]).slice(0, 6);
  }, [logs, exercises, settings]);

  if (highlights.length === 0) return null;

  const Icon: Record<Kind, typeof Trophy> = { pr: Trophy, up: ArrowUp, stalled: Minus };
  // El icono va sobre un disco tintado: separa las tres señales de un vistazo
  // sin pintar la fila entera de color.
  const chip: Record<Kind, string> = {
    pr:      'bg-accent-500/12 text-accent-600 dark:text-accent-400',
    up:      'bg-primary-500/12 text-primary-600 dark:text-primary-400',
    stalled: 'bg-surface-3 text-content-subtle',
  };

  return (
    <Card>
      <SectionLabel>Progreso</SectionLabel>
      <div className="mt-3 divide-y divide-hairline">
        {highlights.map((h, i) => {
          const I = Icon[h.kind];
          return (
            <div key={i} className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0">
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg ${chip[h.kind]}`}>
                <I size={13} strokeWidth={2.5} />
              </span>
              <span className="truncate text-sm font-medium text-content">{h.name}</span>
              <span className="ml-auto shrink-0 text-xs tabular-nums text-content-muted">
                {h.weight > 0 && (
                  <span className="font-semibold text-content">{h.weight} kg</span>
                )}
                {h.weight > 0 ? ' · ' : ''}
                {h.text}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
