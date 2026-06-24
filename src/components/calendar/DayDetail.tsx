import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatDateLong } from '../../lib/dates';
import type { WorkoutLog, WorkoutType, FeelingType, Routine } from '../../types';

interface DayDetailProps {
  date: string | null;
  log?: WorkoutLog;
  routines: Routine[];
  onClose: () => void;
  onSave: (log: Omit<WorkoutLog, 'id'>) => void;
  onDelete?: (id: string) => void;
}

const WORKOUT_TYPES: { value: WorkoutType; label: string; icon: string; badge: string }[] = [
  { value: 'workout',     label: 'Entrenado',     icon: '💪', badge: 'green' },
  { value: 'rest',        label: 'Descanso',      icon: '💤', badge: 'blue'  },
  { value: 'active-rest', label: 'Desc. activo',  icon: '🚶', badge: 'teal'  },
  { value: 'missed',      label: 'No realizado',  icon: '✗',  badge: 'red'   },
];

const FEELINGS: { value: FeelingType; label: string; icon: string }[] = [
  { value: 'easy',      label: 'Fácil',        icon: '😊' },
  { value: 'normal',    label: 'Normal',       icon: '😐' },
  { value: 'hard',      label: 'Difícil',      icon: '😤' },
  { value: 'very-hard', label: 'Muy difícil',  icon: '🥵' },
];

export function DayDetail({ date, log, routines, onClose, onSave, onDelete }: DayDetailProps) {
  const [type, setType] = useState<WorkoutType>(log?.type ?? 'workout');
  const [routineId, setRoutineId] = useState(log?.routineId ?? '');
  const [duration, setDuration] = useState<number | ''>(log?.duration ?? '');
  const [feeling, setFeeling] = useState<FeelingType | ''>(log?.feeling ?? '');
  const [notes, setNotes] = useState(log?.notes ?? '');
  const [editDate, setEditDate] = useState(date ?? '');

  if (!date) return null;

  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(editDate);

  function handleSave() {
    if (!isValidDate) return; // never persist a log without a valid date
    const selectedRoutine = routines.find(r => r.id === routineId);
    onSave({
      date: editDate,
      type,
      routineId: routineId || undefined,
      routineName: selectedRoutine?.name,
      duration: duration !== '' ? Number(duration) : undefined,
      feeling: feeling || undefined,
      notes: notes || undefined,
      exercises: log?.exercises ?? [],
    });
    onClose();
  }

  return (
    <Modal open={!!date} onClose={onClose} title={formatDateLong(editDate)}>
      <div className="space-y-5">
        {/* Date edit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
          <input
            type="date"
            value={editDate}
            onChange={e => setEditDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm"
          />
        </div>

        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de día</label>
          <div className="grid grid-cols-2 gap-2">
            {WORKOUT_TYPES.map(wt => (
              <button
                key={wt.value}
                onClick={() => setType(wt.value)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  type === wt.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                }`}
              >
                <span>{wt.icon}</span>
                {wt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Routine selector (only for workout) */}
        {type === 'workout' && routines.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rutina</label>
            <select
              value={routineId}
              onChange={e => setRoutineId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm"
            >
              <option value="">Sin rutina asignada</option>
              {routines.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Duration */}
        {(type === 'workout' || type === 'active-rest') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duración (minutos)</label>
            <input
              type="number"
              min="1"
              max="300"
              value={duration}
              onChange={e => setDuration(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Ej: 45"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm"
            />
          </div>
        )}

        {/* Feeling */}
        {type === 'workout' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">¿Cómo me sentí?</label>
            <div className="flex gap-2">
              {FEELINGS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFeeling(f.value)}
                  className={`flex-1 flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${
                    feeling === f.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl">{f.icon}</span>
                  <span className="text-[10px] text-gray-600 dark:text-gray-300 font-medium">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Cómo fue el entrenamiento, qué trabajaste, observaciones..."
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {log && onDelete && (
            <Button
              variant="ghost"
              onClick={() => { onDelete(log.id); onClose(); }}
              className="text-red-500 dark:text-red-400"
            >
              Eliminar
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!isValidDate} className="flex-1">
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
