import { useMemo } from 'react';
import { Card } from '../ui/Card';
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

  const icon: Record<Kind, string> = { pr: '🏆', up: '↑', stalled: '→' };
  const color: Record<Kind, string> = {
    pr: 'text-amber-600 dark:text-amber-400',
    up: 'text-green-600 dark:text-green-400',
    stalled: 'text-gray-500 dark:text-gray-400',
  };

  return (
    <Card>
      <p className="text-[11px] font-bold uppercase tracking-wider text-primary-500 mb-2">Progreso</p>
      <div className="space-y-1.5">
        {highlights.map((h, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className={`font-bold ${color[h.kind]}`}>{icon[h.kind]}</span>
            <span className="font-medium text-gray-800 dark:text-gray-100 truncate">{h.name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto shrink-0">
              {h.weight > 0 ? `${h.weight} kg · ` : ''}{h.text}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
