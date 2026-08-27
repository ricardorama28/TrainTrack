import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card, SectionLabel } from '../ui/Card';
import { Button } from '../ui/Button';
import { suggestNextTarget } from '../../lib/progression';
import { getExercisePerformances, getLastPerformance } from '../../lib/analytics';
import { pickNextRoutine } from '../../lib/nextWorkout';
import type { WorkoutLog, Routine, Settings, ProgressionSuggestion } from '../../types';

interface NextWorkoutCardProps {
  logs: WorkoutLog[];
  routines: Routine[];
  settings: Settings;
}

/** Un trozo del objetivo: o una cifra (Mono) o una palabra/unidad (Sans). */
type Token = { n: string } | { u: string };

/**
 * El objetivo se devuelve troceado, no como una cadena, para que solo las
 * cifras caigan en Mono. "Repetir" es una palabra: en Mono a tamaño de métrica
 * pesaba lo mismo que un PR de carga y desalineaba la columna.
 */
function objectiveTokens(s: ProgressionSuggestion): Token[] {
  const weight = (): Token[] => (s.targetWeight != null ? [{ n: String(s.targetWeight) }, { u: 'kg' }] : []);

  switch (s.action) {
    case 'increase-weight':
    case 'consolidate':
      return weight();
    case 'add-reps':
    case 'first-time':
      return s.targetTotalReps != null
        ? [...weight(), { n: `${s.targetTotalReps}+` }, { u: 'reps' }]
        : weight();
    default:
      return s.targetWeight != null ? weight() : [{ u: 'Repetir' }];
  }
}

function Objective({ suggestion }: { suggestion: ProgressionSuggestion }) {
  return (
    <span className="flex items-baseline gap-1 whitespace-nowrap">
      {objectiveTokens(suggestion).map((t, i) =>
        'n' in t ? (
          <span key={i} className="font-mono text-metric text-content">{t.n}</span>
        ) : (
          <span key={i} className="text-caption text-content-muted">{t.u}</span>
        )
      )}
    </span>
  );
}

export function NextWorkoutCard({ logs, routines, settings }: NextWorkoutCardProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(null);

  const picked = useMemo(() => pickNextRoutine(routines, logs), [routines, logs]);

  const rows = useMemo(() => {
    if (!picked) return [];
    return picked.routine.exercises.map(ex => {
      const performances = getExercisePerformances(logs, ex.exerciseId, ex.name);
      const suggestion = suggestNextTarget({ template: ex, performances, settings });
      const last = getLastPerformance(logs, ex.exerciseId, ex.name);
      return { id: ex.id, name: ex.name, suggestion, last };
    });
  }, [picked, logs, settings]);

  // Un estado vacío es una invitación a actuar, no un hueco: el bloque hero no
  // desaparece cuando todavía no hay nada programado.
  if (!picked) {
    return (
      <Card tone="hero">
        <SectionLabel>Próximo entrenamiento</SectionLabel>
        <h2 className="mt-3 text-title text-content">Todavía no hay nada programado</h2>
        <p className="mt-2 text-caption text-content-muted">
          Creá una rutina y TrainTrack se encarga de decirte qué toca cada día.
        </p>
        <Button className="mt-5" onClick={() => navigate('/routines')}>
          Crear una rutina <ArrowRight size={15} strokeWidth={2} />
        </Button>
      </Card>
    );
  }

  const whenLabel = picked.dayOffset === 0 ? 'Hoy' : picked.dayOffset === 1 ? 'Mañana' : 'Próximo';

  return (
    <Card tone="hero">
      <SectionLabel>Próximo entrenamiento</SectionLabel>

      <h2 className="mt-3 text-title text-content">
        {whenLabel} <span className="text-content-subtle">·</span> {picked.routine.name}
      </h2>

      <div className="mt-4 divide-y divide-hairline">
        {rows.map(row => {
          const isOpen = expanded === row.id;
          const lastLabel = row.last
            ? row.last.workingSets.map(s => s.reps ?? s.seconds ?? '—').join('/')
            : null;
          return (
            <div key={row.id}>
              {/* Dos columnas: la métrica queda pegada al texto y alineada con
                  las de arriba y abajo, en vez de flotar contra el borde de la
                  pantalla con 200px de nada en medio. */}
              <button
                onClick={() => setExpanded(isOpen ? null : row.id)}
                className="grid w-full grid-cols-[1fr_auto] items-baseline gap-4 py-4 text-left"
              >
                <span className="truncate text-body text-content">{row.name}</span>
                <Objective suggestion={row.suggestion} />
              </button>
              {isOpen && (
                <div className="animate-fade-in space-y-1 pb-4 -mt-2 text-caption text-content-muted">
                  {lastLabel && <p>Último: {lastLabel}</p>}
                  {row.suggestion.targetReps && row.suggestion.targetReps.length > 0 && (
                    <p>Referencia: {row.suggestion.targetReps.join('/')}</p>
                  )}
                  <p>{row.suggestion.reason}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* La única acción principal de la pantalla, y el único fondo lima. */}
      <Button className="mt-5" fullWidth onClick={() => navigate('/routines')}>
        Empezar <ArrowRight size={15} strokeWidth={2} />
      </Button>
    </Card>
  );
}
