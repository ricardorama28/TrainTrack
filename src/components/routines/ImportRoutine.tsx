import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { parseRoutineText } from '../../lib/parser';
import type { ParseResult, ParsedDay, ParsedExercise, MuscleGroup } from '../../types';

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface ImportRoutineProps {
  open: boolean;
  onClose: () => void;
  onImport: (days: ParsedDay[]) => void;
}

const EXAMPLE_TEXT = `Día A:
- Hip thrust: 4x10, 25 kg
- Peso muerto rumano: 3x12, 25 kg
- Sentadilla: 3x12
- Plancha: 3x30 segundos

Día B:
- Press militar: 3x10, 7.5 kg
- Bíceps: 3x12, 7.5 kg
- Dorsales en máquina: 3x12
- Face pulls: 3x15

Descanso activo:
- Caminata suave
- Movilidad de cadera
- Estiramientos`;

export function ImportRoutine({ open, onClose, onImport }: ImportRoutineProps) {
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [editableDays, setEditableDays] = useState<ParsedDay[]>([]);

  function handleParse() {
    const result = parseRoutineText(text);
    setParsed(result);
    setEditableDays(result.days.map(d => ({ ...d, exercises: d.exercises.map(e => ({ ...e })) })));
  }

  function updateDay(index: number, updates: Partial<ParsedDay>) {
    setEditableDays(prev => prev.map((d, i) => i === index ? { ...d, ...updates } : d));
  }

  function updateExercise(dayIndex: number, exIndex: number, updates: Partial<ParsedExercise>) {
    setEditableDays(prev => prev.map((d, i) => {
      if (i !== dayIndex) return d;
      return { ...d, exercises: d.exercises.map((e, j) => j === exIndex ? { ...e, ...updates } : e) };
    }));
  }

  function deleteExercise(dayIndex: number, exIndex: number) {
    setEditableDays(prev => prev.map((d, i) => {
      if (i !== dayIndex) return d;
      return { ...d, exercises: d.exercises.filter((_, j) => j !== exIndex) };
    }));
  }

  function handleConfirm() {
    onImport(editableDays);
    setText('');
    setParsed(null);
    setEditableDays([]);
    onClose();
  }

  function handleBack() {
    setParsed(null);
    setEditableDays([]);
  }

  return (
    <Modal open={open} onClose={onClose} title="Importar rutina desde texto" maxWidth="max-w-2xl">
      {!parsed ? (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">💡 ¿Cómo funciona?</p>
            <p>Pegá una rutina escrita en texto libre (de ChatGPT, notas, etc). La app detecta automáticamente los días, ejercicios, series, repeticiones y pesos. Después podés editar todo antes de guardar.</p>
          </div>

          <div>
            <label className="label">Pegá tu rutina aquí</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={10}
              placeholder={EXAMPLE_TEXT}
              className="input resize-none font-mono text-xs"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" size="sm" onClick={() => setText(EXAMPLE_TEXT)} className="text-gray-500">
              Cargar ejemplo
            </Button>
            <div className="flex-1" />
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleParse} disabled={!text.trim()}>
              Analizar texto →
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={handleBack} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">← Volver</button>
            <span className="text-sm text-gray-400">|</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Se detectaron <strong className="text-gray-800 dark:text-gray-200">{editableDays.length} días</strong>. Revisá y editá antes de confirmar.
            </p>
          </div>

          {editableDays.length === 0 && (
            <p className="text-sm text-red-500 text-center py-4">
              No se detectaron días. Revisá el formato del texto.
            </p>
          )}

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {editableDays.map((day, dayIdx) => (
              <div key={dayIdx} className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-3">
                {/* Day header */}
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    value={day.name}
                    onChange={e => updateDay(dayIdx, { name: e.target.value })}
                    className="flex-1 min-w-0 text-sm font-semibold bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-primary-500 text-gray-800 dark:text-gray-100 pb-0.5"
                  />
                  <select
                    value={day.type}
                    onChange={e => updateDay(dayIdx, { type: e.target.value as 'workout' | 'active-rest' })}
                    className="text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1"
                  >
                    <option value="workout">💪 Entrenamiento</option>
                    <option value="active-rest">🚶 Descanso activo</option>
                  </select>
                  <button
                    onClick={() => setEditableDays(prev => prev.filter((_, i) => i !== dayIdx))}
                    className="text-red-400 text-sm"
                  >🗑️</button>
                </div>

                {day.notes && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-1">
                    Nota: {day.notes}
                  </p>
                )}

                {/* Exercises */}
                <div className="space-y-2">
                  {day.exercises.map((ex, exIdx) => (
                    <div key={exIdx} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={ex.name}
                          onChange={e => updateExercise(dayIdx, exIdx, { name: e.target.value })}
                          className="flex-1 text-sm bg-transparent border-b border-gray-200 dark:border-gray-600 focus:outline-none focus:border-primary-500 text-gray-800 dark:text-gray-100 pb-0.5"
                        />
                        <button onClick={() => deleteExercise(dayIdx, exIdx)} className="text-red-400 text-xs">✕</button>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <input
                          type="number"
                          value={ex.sets ?? ''}
                          onChange={e => updateExercise(dayIdx, exIdx, { sets: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="Series"
                          className="w-16 input py-1 text-xs"
                        />
                        <input
                          type="text"
                          value={ex.reps ?? ''}
                          onChange={e => updateExercise(dayIdx, exIdx, { reps: e.target.value || undefined })}
                          placeholder="Reps"
                          className="w-16 input py-1 text-xs"
                        />
                        <input
                          type="number"
                          step="0.5"
                          value={ex.weight ?? ''}
                          onChange={e => updateExercise(dayIdx, exIdx, { weight: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="kg"
                          className="w-16 input py-1 text-xs"
                        />
                      </div>
                      {ex.notes && (
                        <p className="text-xs text-gray-400 italic">{ex.notes}</p>
                      )}
                      {ex.videoUrl && (
                        <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 dark:text-primary-400">
                          🎬 Ver video
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {parsed.generalNotes && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 text-xs text-yellow-700 dark:text-yellow-300">
              <p className="font-medium mb-1">Notas generales detectadas:</p>
              <p className="whitespace-pre-line">{parsed.generalNotes}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={handleBack} fullWidth>← Volver</Button>
            <Button onClick={handleConfirm} disabled={editableDays.length === 0} fullWidth>
              ✓ Guardar {editableDays.length} rutina{editableDays.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
