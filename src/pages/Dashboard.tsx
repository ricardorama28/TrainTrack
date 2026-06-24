import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StreakCard } from '../components/dashboard/StreakCard';
import { WeeklySummary } from '../components/dashboard/WeeklySummary';
import { MotivationalQuote } from '../components/dashboard/MotivationalQuote';
import { UpcomingDays } from '../components/dashboard/UpcomingDays';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { calculateCurrentStreak, calculateBestStreak } from '../lib/streaks';
import { formatDateLong, relativeDate, todayStr } from '../lib/dates';
import { useAuth } from '../context/AuthContext';
import type { WorkoutLog, Routine, Settings } from '../types';

interface DashboardProps {
  logs: WorkoutLog[];
  routines: Routine[];
  settings: Settings;
}

const FEELING_LABELS: Record<string, string> = {
  easy:      '😊 Fácil',
  normal:    '😐 Normal',
  hard:      '😤 Difícil',
  'very-hard': '🥵 Muy difícil',
};

export function Dashboard({ logs, routines, settings }: DashboardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentStreak = useMemo(() => calculateCurrentStreak(logs, settings), [logs, settings]);
  const bestStreak = useMemo(() => calculateBestStreak(logs, settings), [logs, settings]);

  const lastWorkout = useMemo(() =>
    [...logs]
      .filter(l => l.type === 'workout')
      .sort((a, b) => b.date.localeCompare(a.date))[0],
    [logs]
  );

  const todayLog = logs.find(l => l.date === todayStr());

  const firstName = user?.user_metadata?.full_name?.split(' ')[0]
                 ?? user?.email?.split('@')[0]
                 ?? null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{formatDateLong(todayStr())}</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {firstName ? `¡Hola, ${firstName}!` : 'TrainTrack'}
          </h1>
        </div>
        {!todayLog && (
          <Button size="sm" onClick={() => navigate('/calendar')}>
            + Registrar hoy
          </Button>
        )}
      </div>

      <MotivationalQuote />

      <StreakCard currentStreak={currentStreak} bestStreak={bestStreak} />

      <WeeklySummary logs={logs} settings={settings} />

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
              <Badge variant="blue">⏱ {lastWorkout.duration} min</Badge>
            )}
            {lastWorkout.feeling && (
              <Badge variant="gray">{FEELING_LABELS[lastWorkout.feeling]}</Badge>
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
            📅 Ver calendario
          </Button>
          <Button variant="secondary" onClick={() => navigate('/routines')} fullWidth>
            📋 Mis rutinas
          </Button>
        </div>
      </Card>
    </div>
  );
}
