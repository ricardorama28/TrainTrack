import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, ArrowRight, Timer, Calendar, ClipboardList } from 'lucide-react';
import { StreakCard } from '../components/dashboard/StreakCard';
import { WeeklySummary } from '../components/dashboard/WeeklySummary';
import { MotivationalQuote } from '../components/dashboard/MotivationalQuote';
import { UpcomingDays } from '../components/dashboard/UpcomingDays';
import { NextWorkoutCard } from '../components/dashboard/NextWorkoutCard';
import { ProgressHighlights } from '../components/dashboard/ProgressHighlights';
import { Logo } from '../components/ui/Logo';
import { IntensityMeter } from '../components/ui/IntensityMeter';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { calculateCurrentStreak, calculateBestStreak } from '../lib/streaks';
import { weeklyMuscleVolume } from '../lib/volume';
import { MUSCLE_LABELS } from '../lib/labels';
import { formatDateLong, relativeDate, todayStr } from '../lib/dates';
import { storage } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import type { WorkoutLog, Routine, Settings, Exercise } from '../types';

interface DashboardProps {
  logs: WorkoutLog[];
  routines: Routine[];
  exercises: Exercise[];
  settings: Settings;
}

export function Dashboard({ logs, routines, exercises, settings }: DashboardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentStreak = useMemo(() => calculateCurrentStreak(logs, settings), [logs, settings]);
  const bestStreak = useMemo(() => calculateBestStreak(logs, settings), [logs, settings]);
  const weekMuscles = useMemo(() => weeklyMuscleVolume(logs, exercises).slice(0, 6), [logs, exercises]);

  const lastWorkout = useMemo(() =>
    [...logs]
      .filter(l => l.type === 'workout')
      .sort((a, b) => b.date.localeCompare(a.date))[0],
    [logs]
  );

  const todayLog = logs.find(l => l.date === todayStr());
  const activeSession = storage.getActiveSession();

  const firstName = user?.user_metadata?.full_name?.split(' ')[0]
                 ?? user?.email?.split('@')[0]
                 ?? null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <Logo size={34} className="text-primary-500 shrink-0" />
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{formatDateLong(todayStr())}</p>
            <h1 className="text-2xl font-display font-bold tracking-tight text-gray-900 dark:text-white">
              {firstName ? `¡Hola, ${firstName}!` : <>Train<span className="text-primary-500">Track</span></>}
            </h1>
          </div>
        </div>
        {!todayLog && (
          <Button size="sm" onClick={() => navigate('/calendar')}>
            + Registrar hoy
          </Button>
        )}
      </div>

      {activeSession && (
        <button
          onClick={() => navigate('/routines')}
          className="w-full flex items-center gap-3 rounded-2xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 px-4 py-3 text-left active:scale-[0.99] transition"
        >
          <Dumbbell size={24} className="text-primary-600 dark:text-primary-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">Entrenamiento en curso</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{activeSession.routineName}</p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 dark:text-primary-400">Continuar <ArrowRight size={15} strokeWidth={2.5} /></span>
        </button>
      )}

      {/* 1 · PRÓXIMO ENTRENAMIENTO — la respuesta a "¿qué hago hoy?" */}
      <NextWorkoutCard logs={logs} routines={routines} settings={settings} />

      {/* 2 · PROGRESO — PRs, mejoras y estancamiento */}
      <ProgressHighlights logs={logs} exercises={exercises} settings={settings} />

      {/* 3 · ESTA SEMANA — adherencia y distribución */}
      <StreakCard currentStreak={currentStreak} bestStreak={bestStreak} />

      <WeeklySummary logs={logs} settings={settings} />

      {weekMuscles.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary-500">Series de trabajo · esta semana</p>
            <button onClick={() => navigate('/progreso')} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400">Ver más <ArrowRight size={13} strokeWidth={2.5} /></button>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {weekMuscles.map(m => (
              <span key={m.muscleGroup} className="text-sm text-gray-700 dark:text-gray-200">
                {MUSCLE_LABELS[m.muscleGroup]} <span className="font-bold text-gray-900 dark:text-white">{m.sets}</span>
              </span>
            ))}
          </div>
        </Card>
      )}

      <MotivationalQuote />

      {/* Last workout */}
      {lastWorkout && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Último entrenamiento</h3>
            <Badge variant="gray">{relativeDate(lastWorkout.date)}</Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            {formatDateLong(lastWorkout.date)}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {lastWorkout.routineName && (
              <Badge variant="green">{lastWorkout.routineName}</Badge>
            )}
            {lastWorkout.duration && (
              <Badge variant="blue"><Timer size={12} /> {lastWorkout.duration} min</Badge>
            )}
            {lastWorkout.feeling && (
              <IntensityMeter value={lastWorkout.feeling} readOnly size="sm" />
            )}
          </div>
          {lastWorkout.notes && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic line-clamp-2">
              "{lastWorkout.notes}"
            </p>
          )}
        </Card>
      )}

      <UpcomingDays logs={logs} routines={routines} settings={settings} />

      {/* Quick actions */}
      <Card>
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Accesos rápidos</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => navigate('/calendar')} fullWidth>
            <Calendar size={16} /> Ver calendario
          </Button>
          <Button variant="secondary" onClick={() => navigate('/routines')} fullWidth>
            <ClipboardList size={16} /> Mis rutinas
          </Button>
        </div>
      </Card>
    </div>
  );
}
