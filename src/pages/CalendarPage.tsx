import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MonthCalendar } from '../components/calendar/MonthCalendar';
import { DayDetail } from '../components/calendar/DayDetail';
import { formatMonthYear } from '../lib/dates';
import type { WorkoutLog, Routine } from '../types';

interface CalendarPageProps {
  logs: WorkoutLog[];
  routines: Routine[];
  onSaveLog: (log: Omit<WorkoutLog, 'id'>) => void;
  onDeleteLog: (id: string) => void;
}

export function CalendarPage({ logs, routines, onSaveLog, onDeleteLog }: CalendarPageProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const selectedLog = selectedDate ? logs.find(l => l.date === selectedDate) : undefined;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-display font-bold tracking-tight text-gray-900 dark:text-white">Calendario</h1>

      <Card>
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
          >
            ‹
          </button>
          <span className="font-semibold text-gray-800 dark:text-gray-100 capitalize">
            {formatMonthYear(new Date(year, month))}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
          >
            ›
          </button>
        </div>

        <MonthCalendar
          year={year}
          month={month}
          logs={logs}
          onDayClick={date => setSelectedDate(date)}
        />
      </Card>

      {/* Quick log today */}
      <Button
        fullWidth
        size="lg"
        onClick={() => {
          const today = new Date();
          const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          setSelectedDate(dateStr);
        }}
      >
        + Registrar entrenamiento de hoy
      </Button>

      <DayDetail
        date={selectedDate}
        log={selectedLog}
        routines={routines}
        onClose={() => setSelectedDate(null)}
        onSave={onSaveLog}
        onDelete={onDeleteLog}
      />
    </div>
  );
}
