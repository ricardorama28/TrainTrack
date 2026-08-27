import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, SectionLabel } from '../ui/Card';
import {
  getExercisePerformances, getLatestPRs, detectTrend, detectStalled, getCurrentLoadBlock,
} from '../../lib/analytics';
import type { WorkoutLog, Exercise, Settings } from '../../types';

interface ProgressHighlightsProps {
  logs: WorkoutLog[];
  exercises: Exercise[];
  settings: Settings;
  /** Máximo de filas visibles; el resto queda tras un enlace a Progreso.
   *  Sin límite (la página de Progreso) se muestran todas. */
  limit?: number;
  /** Encabezado del bloque. En la página de Progreso repetir "Progreso" sería
   *  eco del título, así que allí se pasa otro. */
  label?: string;
}

type Kind = 'pr' | 'up' | 'stalled';
interface Highlight {
  name: string;
  kind: Kind;
  text: string;
  weight: number;
}

const ORDER: Record<Kind, number> = { pr: 0, up: 1, stalled: 2 };

export function ProgressHighlights({ logs, exercises, settings, limit, label = 'Progreso' }: ProgressHighlightsProps) {
  const navigate = useNavigate();
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
    return items.sort((a, b) => ORDER[a.kind] - ORDER[b.kind]);
  }, [logs, exercises, settings]);

  if (highlights.length === 0) return null;

  // Tres, no seis: seis filas idénticas son una lista, no un logro.
  const visible = limit != null ? highlights.slice(0, limit) : highlights;
  const rest = highlights.length - visible.length;

  return (
    <Card>
      <SectionLabel
        action={
          rest > 0 ? (
            <button
              onClick={() => navigate('/progreso')}
              className="text-caption text-content-muted underline-offset-4 hover:text-content hover:underline"
            >
              Ver los {highlights.length}
            </button>
          ) : undefined
        }
      >
        {label}
      </SectionLabel>

      {/* Sin icono por fila: si aparece en todas, es textura, no información.
          La distinción entre PR, avance y estancamiento la lleva el texto. */}
      <div className="mt-3 divide-y divide-hairline">
        {visible.map((h, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto] items-baseline gap-4 py-4 first:pt-1">
            <div className="min-w-0">
              <p className="truncate text-body text-content">{h.name}</p>
              <p className="text-caption text-content-muted">{h.text}</p>
            </div>
            {h.weight > 0 && (
              <span className="flex items-baseline gap-1 whitespace-nowrap">
                <span className="font-mono text-metric text-content">{h.weight}</span>
                <span className="text-caption text-content-muted">kg</span>
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
