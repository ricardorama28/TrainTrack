import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MonthCalendar } from '../components/calendar/MonthCalendar';
import { DayDetail } from '../components/calendar/DayDetail';
import { UpcomingDays } from '../components/dashboard/UpcomingDays';
import { formatMonthYear } from '../lib/dates';
import type { WorkoutLog, Routine, Settings } from '../types';

interface CalendarPageProps {
  logs: WorkoutLog[];
  routines: Routine[];
  settings: Settings;
  onSaveLog: (log: Omit<WorkoutLog, 'id'>) => void;
  onDeleteLog: (id: string) => void;
}

export function CalendarPage({ logs, routines, settings, onSaveLog, onDeleteLog }: CalendarPageProps) {
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
    <div>
      <h1 className="mb-12 text-display text-content">Calendario</h1>

      <div className="space-y-6">
        <Card>
          {/* Month navigation */}
          <div className="mb-5 flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="rounded-full p-2 text-content-muted transition-colors hover:bg-surface-2 hover:text-content"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-body-strong capitalize text-content">
              {formatMonthYear(new Date(year, month))}
            </span>
            <button
              onClick={nextMonth}
              className="rounded-full p-2 text-content-muted transition-colors hover:bg-surface-2 hover:text-content"
              aria-label="Mes siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <MonthCalendar
            year={year}
            month={month}
            logs={logs}
            onDayClick={date => setSelectedDate(date)}
          />
        </Card>

        {/* Quick log today — la acción principal de esta pantalla. */}
        <Button
          fullWidth
          size="lg"
          onClick={() => {
            const today = new Date();
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            setSelectedDate(dateStr);
          }}
        >
          <Plus size={17} strokeWidth={2} /> Registrar entrenamiento de hoy
        </Button>

        {/* Movido desde el Dashboard: los próximos días son una vista de
            calendario, no un resumen de inicio. */}
        <UpcomingDays logs={logs} routines={routines} settings={settings} />
      </div>

      {/* Keyed by the selected date so the modal remounts per tap — this
          re-seeds DayDetail's derived state (date, and the log's type/routine/
          duration/feeling/notes) instead of holding the first (null) value. */}
      {selectedDate && (
        <DayDetail
          key={selectedDate}
          date={selectedDate}
          log={selectedLog}
          routines={routines}
          onClose={() => setSelectedDate(null)}
          onSave={onSaveLog}
          onDelete={onDeleteLog}
        />
      )}
    </div>
  );
}
