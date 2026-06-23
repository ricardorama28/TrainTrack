import { Card } from '../ui/Card';
import { getWeekDays, getDayName, todayStr } from '../../lib/dates';
import type { WorkoutLog, Settings } from '../../types';

interface WeeklySummaryProps {
  logs: WorkoutLog[];
  settings: Settings;
}

const TYPE_COLORS: Record<string, string> = {
  workout:     'bg-primary-500',
  rest:        'bg-blue-400',
  'active-rest': 'bg-teal-400',
  missed:      'bg-red-400',
};

export function WeeklySummary({ logs, settings }: WeeklySummaryProps) {
  const weekDays = getWeekDays(new Date());
  const today = todayStr();
  const logMap = new Map(logs.map(l => [l.date, l]));

  const workoutCount = weekDays.filter(d => logMap.get(d)?.type === 'workout').length;
  const goal = settings.weeklyGoal;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">Esta semana</h3>
        <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
          {workoutCount}/{goal} entrenamientos
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-4">
        <div
          className="bg-primary-500 h-2 rounded-full transition-all"
          style={{ width: `${Math.min((workoutCount / goal) * 100, 100)}%` }}
        />
      </div>

      {/* Day dots */}
      <div className="flex gap-2 justify-between">
        {weekDays.map(date => {
          const log = logMap.get(date);
          const isToday = date === today;
          const dotColor = log ? TYPE_COLORS[log.type] : 'bg-gray-200 dark:bg-gray-600';

          return (
            <div key={date} className="flex flex-col items-center gap-1">
              <span className={`text-[10px] font-medium ${isToday ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}`}>
                {getDayName(date)}
              </span>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${dotColor} ${isToday ? 'ring-2 ring-primary-500 ring-offset-1' : ''}`}>
                {log?.type === 'workout' && <span className="text-[10px]">✓</span>}
                {log?.type === 'rest' && <span className="text-[10px]">💤</span>}
                {log?.type === 'active-rest' && <span className="text-[10px]">🚶</span>}
                {log?.type === 'missed' && <span className="text-[10px]">✗</span>}
              </div>
              {isToday && <div className="w-1 h-1 rounded-full bg-primary-500" />}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
