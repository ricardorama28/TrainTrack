import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, ArrowRight, Plus, Settings2 } from 'lucide-react';
import { WeeklySummary } from '../components/dashboard/WeeklySummary';
import { MotivationalQuote } from '../components/dashboard/MotivationalQuote';
import { NextWorkoutCard } from '../components/dashboard/NextWorkoutCard';
import { ProgressHighlights } from '../components/dashboard/ProgressHighlights';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import { calculateCurrentStreak } from '../lib/streaks';
import { formatDateLong, todayStr } from '../lib/dates';
import { storage } from '../lib/storage';
import { isColdStart } from '../lib/intro';
import { useAuth } from '../context/AuthContext';
import type { WorkoutLog, Routine, Settings, Exercise } from '../types';

interface DashboardProps {
  logs: WorkoutLog[];
  routines: Routine[];
  exercises: Exercise[];
  settings: Settings;
}

/**
 * Tres bloques, una cabecera y un pie. Nada más.
 *
 * Lo que salió y por qué:
 * - `StreakCard` — era el bloque más grande y el único lima sólido de la
 *   pantalla, y lo que decía la mayoría de los días era "0 días". Celebrar en
 *   96px que el usuario no entrenó es peor que no decirlo. Ahora la racha es
 *   una línea en la cabecera, y con 0 no se renderiza.
 * - "Accesos rápidos" — sus dos destinos ya están en el dock.
 * - "Último entrenamiento" y "Próximos días" — el Calendario ya es la vista
 *   canónica de ambos; `UpcomingDays` se movió allí en vez de eliminarse.
 * - "Series de trabajo · esta semana" — los mismos datos, mejor contados, ya
 *   están en Progreso.
 *
 * Presupuesto de color: un solo fondo lima (el botón "Empezar", dentro de la
 * tarjeta hero) y un solo dato en lima (la racha). Todo lo demás, neutral.
 */
export function Dashboard({ logs, routines, exercises, settings }: DashboardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentStreak = useMemo(() => calculateCurrentStreak(logs, settings), [logs, settings]);

  const todayLog = logs.find(l => l.date === todayStr());
  const activeSession = storage.getActiveSession();

  const firstName = user?.user_metadata?.full_name?.split(' ')[0]
                 ?? user?.email?.split('@')[0]
                 ?? null;

  return (
    <div>
      <header className="mb-12">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size={16} className="shrink-0 text-content-subtle" />
            <p className="text-overline uppercase text-content-subtle">{formatDateLong(todayStr())}</p>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="-mr-1.5 rounded-full p-1.5 text-content-subtle transition-colors hover:bg-surface-2 hover:text-content"
            aria-label="Ajustes"
          >
            <Settings2 size={17} strokeWidth={1.75} />
          </button>
        </div>

        <h1 className="mt-4 truncate text-display text-content">
          {firstName ? `Hola, ${firstName}` : 'TrainTrack'}
        </h1>

        <div className="mt-2 flex items-center justify-between gap-4">
          {/* La racha solo aparece cuando existe. */}
          {currentStreak > 0 ? (
            <p className="text-caption text-content-muted">
              <span className="font-mono text-metric text-primary-600 dark:text-primary-400">
                {currentStreak}
              </span>{' '}
              {currentStreak === 1 ? 'día seguido' : 'días seguidos'}
            </p>
          ) : (
            <span />
          )}

          {!todayLog && (
            <Button variant="secondary" size="sm" className="shrink-0" onClick={() => navigate('/calendar')}>
              <Plus size={15} strokeWidth={2} /> Registrar hoy
            </Button>
          )}
        </div>
      </header>

      <div className={`space-y-6 ${isColdStart() ? 'stagger' : ''}`}>
        {activeSession && (
          <button
            onClick={() => navigate('/routines')}
            className="group flex w-full items-center gap-4 rounded-card bg-ink-900 px-5 py-4 text-left transition-transform duration-200 ease-out-expo active:scale-[0.985]"
          >
            <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-white">
              <span className="absolute inset-0 animate-ping rounded-xl bg-white/10" aria-hidden="true" />
              <Dumbbell size={17} className="relative" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-strong text-white">Entrenamiento en curso</p>
              <p className="truncate text-caption text-white/50">{activeSession.routineName}</p>
            </div>
            <ArrowRight
              size={17}
              strokeWidth={2}
              className="shrink-0 text-white/60 transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </button>
        )}

        {/* 1 · ¿Qué hago hoy? */}
        <NextWorkoutCard logs={logs} routines={routines} settings={settings} />

        {/* 2 · ¿Estoy mejorando? */}
        <ProgressHighlights logs={logs} exercises={exercises} settings={settings} limit={3} />

        {/* 3 · ¿Vengo cumpliendo? */}
        <WeeklySummary logs={logs} settings={settings} />
      </div>

      <footer className="mt-12">
        <MotivationalQuote />
      </footer>
    </div>
  );
}
