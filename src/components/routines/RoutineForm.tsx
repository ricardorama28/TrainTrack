import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ExerciseItem } from './ExerciseItem';
import { ExerciseForm } from './ExerciseForm';
import type { Routine, ExerciseTemplate } from '../../types';

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

interface RoutineFormProps {
  open: boolean;
  routine?: Routine;
  onClose: () => void;
  onSave: (routine: Omit<Routine, 'id' | 'createdAt'>) => void;
}

export function RoutineForm({ open, routine, onClose, onSave }: RoutineFormProps) {
  const [name, setName] = useState(routine?.name ?? '');
  const [description, setDescription] = useState(routine?.description ?? '');
  const [type, setType] = useState<'workout' | 'active-rest'>(routine?.type ?? 'workout');
  const [suggestedDays, setSuggestedDays] = useState<number[]>(routine?.suggestedDays ?? []);
  const [exercises, setExercises] = useState<ExerciseTemplate[]>(routine?.exercises ?? []);
  const [exerciseFormOpen, setExerciseFormOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseTemplate | null>(null);

  function toggleDay(day: number) {
    setSuggestedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  }

  function handleSaveExercise(ex: Omit<ExerciseTemplate, 'id'>) {
    if (editingExercise) {
      setExercises(prev => prev.map(e => e.id === editingExercise.id ? { ...ex, id: editingExercise.id } : e));
    } else {
      setExercises(prev => [...prev, { ...ex, id: newId() }]);
    }
    setEditingExercise(null);
  }

  function handleDeleteExercise(id: string) {
    setExercises(prev => prev.filter(e => e.id !== id));
  }

  function handleSave() {
    if (!name.trim()) return;
    onSave({ name: name.trim(), description: description || undefined, type, suggestedDays, exercises });
    onClose();
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title={routine ? 'Editar rutina' : 'Nueva rutina'} maxWidth="max-w-xl">
        <div className="space-y-5">
          <div>
            <label className="label">Nombre *</label>
            <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Día A – Full Body" className="input" />
          </div>

          <div>
            <label className="label">Descripción</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Descripción opcional..." className="input resize-none" />
          </div>

          <div>
            <label className="label">Tipo</label>
            <div className="flex gap-3">
              {([['workout', '💪 Entrenamiento'], ['active-rest', '🚶 Descanso activo']] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setType(val)}
                  className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    type === val
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Días sugeridos</label>
            <div className="flex gap-1.5">
              {DAY_NAMES.map((d, i) => (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    suggestedDays.includes(i)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Ejercicios</label>
              <Button size="sm" onClick={() => { setEditingExercise(null); setExerciseFormOpen(true); }}>
                + Agregar
              </Button>
            </div>
            <div className="space-y-2">
              {exercises.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                  No hay ejercicios. Agregá uno con el botón de arriba.
                </p>
              )}
              {exercises.map(ex => (
                <ExerciseItem
                  key={ex.id}
                  exercise={ex}
                  onEdit={() => { setEditingExercise(ex); setExerciseFormOpen(true); }}
                  onDelete={() => handleDeleteExercise(ex.id)}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={onClose} fullWidth>Cancelar</Button>
            <Button onClick={handleSave} disabled={!name.trim()} fullWidth>Guardar rutina</Button>
          </div>
        </div>
      </Modal>

      <ExerciseForm
        key={editingExercise?.id ?? 'new'}
        open={exerciseFormOpen}
        exercise={editingExercise ?? undefined}
        onClose={() => { setExerciseFormOpen(false); setEditingExercise(null); }}
        onSave={handleSaveExercise}
      />
    </>
  );
}
