import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { MUSCLE_OPTIONS, PRIORITY_OPTIONS } from '../../lib/labels';
import type { ExerciseTemplate, MuscleGroup, ProgressionMethod, ExercisePriority } from '../../types';

interface ExerciseFormProps {
  open: boolean;
  exercise?: ExerciseTemplate;
  onClose: () => void;
  onSave: (exercise: Omit<ExerciseTemplate, 'id'>) => void;
}

export function ExerciseForm({ open, exercise, onClose, onSave }: ExerciseFormProps) {
  const [name, setName] = useState(exercise?.name ?? '');
  const [sets, setSets] = useState<number | ''>(exercise?.sets ?? '');
  const [unit, setUnit] = useState<'reps' | 'seconds'>(exercise?.unit ?? 'reps');
  const [reps, setReps] = useState(exercise?.reps ?? '');
  const [weight, setWeight] = useState<number | ''>(exercise?.weight ?? '');
  const [restSeconds, setRestSeconds] = useState<number | ''>(exercise?.restSeconds ?? '');
  const [notes, setNotes] = useState(exercise?.notes ?? '');
  const [videoUrl, setVideoUrl] = useState(exercise?.videoUrl ?? '');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | ''>(exercise?.muscleGroup ?? '');
  const [isOptional, setIsOptional] = useState(exercise?.isOptional ?? false);

  // ── Progression (prescription) ──
  const [showProgression, setShowProgression] = useState(
    exercise?.progressionMethod != null && exercise.progressionMethod !== 'none',
  );
  const [progressionMethod, setProgressionMethod] = useState<ProgressionMethod>(
    exercise?.progressionMethod ?? 'none',
  );
  const [targetRepMin, setTargetRepMin] = useState<number | ''>(exercise?.targetRepMin ?? '');
  const [targetRepMax, setTargetRepMax] = useState<number | ''>(exercise?.targetRepMax ?? '');
  const [targetRir, setTargetRir] = useState<number | ''>(exercise?.targetRir ?? '');
  const [weightIncrement, setWeightIncrement] = useState<number | ''>(exercise?.weightIncrement ?? '');
  const [priority, setPriority] = useState<ExercisePriority | ''>(exercise?.priority ?? '');
  const [progressionNotes, setProgressionNotes] = useState(exercise?.progressionNotes ?? '');

  function handleSave() {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      sets: sets !== '' ? Number(sets) : undefined,
      unit,
      reps: reps || undefined,
      weight: weight !== '' ? Number(weight) : undefined,
      restSeconds: restSeconds !== '' ? Number(restSeconds) : undefined,
      notes: notes || undefined,
      videoUrl: videoUrl || undefined,
      muscleGroup: muscleGroup || undefined,
      isOptional,
      progressionMethod: progressionMethod !== 'none' ? progressionMethod : undefined,
      targetRepMin: targetRepMin !== '' ? Number(targetRepMin) : undefined,
      targetRepMax: targetRepMax !== '' ? Number(targetRepMax) : undefined,
      targetRir: targetRir !== '' ? Number(targetRir) : undefined,
      weightIncrement: weightIncrement !== '' ? Number(weightIncrement) : undefined,
      priority: priority || undefined,
      progressionNotes: progressionNotes.trim() || undefined,
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={exercise ? 'Editar ejercicio' : 'Nuevo ejercicio'}>
      <div className="space-y-4">
        <div>
          <label className="label">Nombre del ejercicio *</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Hip Thrust"
            className="input"
          />
        </div>

        <div>
          <label className="label">Medición</label>
          <div className="flex gap-3">
            {([['reps', '🔢 Repeticiones'], ['seconds', '⏱ Tiempo']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setUnit(val)}
                className={`flex-1 py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  unit === val
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Series</label>
            <input type="number" min="1" value={sets} onChange={e => setSets(e.target.value === '' ? '' : Number(e.target.value))} placeholder="4" className="input" />
          </div>
          <div>
            <label className="label">{unit === 'seconds' ? 'Segundos' : 'Reps'}</label>
            <input type="text" value={reps} onChange={e => setReps(e.target.value)} placeholder={unit === 'seconds' ? '30' : '10'} className="input" />
          </div>
          <div>
            <label className="label">Peso (kg)</label>
            <input type="number" min="0" step="0.5" value={weight} onChange={e => setWeight(e.target.value === '' ? '' : Number(e.target.value))} placeholder="25" className="input" />
          </div>
        </div>

        <div>
          <label className="label">Descanso entre series (segundos)</label>
          <input type="number" min="0" value={restSeconds} onChange={e => setRestSeconds(e.target.value === '' ? '' : Number(e.target.value))} placeholder="90" className="input" />
        </div>

        <div>
          <label className="label">Grupo muscular</label>
          <select value={muscleGroup} onChange={e => setMuscleGroup(e.target.value as MuscleGroup)} className="input">
            <option value="">Sin especificar</option>
            {MUSCLE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Link a video (YouTube, Instagram…)</label>
          <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/..." className="input" />
        </div>

        <div>
          <label className="label">Notas técnicas</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Técnica, puntos clave..." className="input resize-none" />
        </div>

        {/* ── Progresión ── */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setShowProgression(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200"
          >
            <span>📈 Progresión {progressionMethod !== 'none' && <span className="text-primary-500">· activa</span>}</span>
            <span className="text-gray-400">{showProgression ? '▾' : '▸'}</span>
          </button>
          {showProgression && (
            <div className="px-3 pb-3 space-y-3 border-t border-gray-100 dark:border-gray-700/60 pt-3">
              <div>
                <label className="label">Método</label>
                <select
                  value={progressionMethod}
                  onChange={e => setProgressionMethod(e.target.value as ProgressionMethod)}
                  className="input"
                >
                  <option value="none">Sin progresión automática</option>
                  <option value="double-progression">Doble progresión (reps → carga)</option>
                </select>
              </div>

              {progressionMethod === 'double-progression' && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="label">Reps mín</label>
                      <input type="number" min="1" value={targetRepMin} onChange={e => setTargetRepMin(e.target.value === '' ? '' : Number(e.target.value))} placeholder="8" className="input" />
                    </div>
                    <div>
                      <label className="label">Reps máx</label>
                      <input type="number" min="1" value={targetRepMax} onChange={e => setTargetRepMax(e.target.value === '' ? '' : Number(e.target.value))} placeholder="10" className="input" />
                    </div>
                    <div>
                      <label className="label" title="RIR mínimo aceptable para aumentar carga">RIR mín</label>
                      <input type="number" min="0" value={targetRir} onChange={e => setTargetRir(e.target.value === '' ? '' : Number(e.target.value))} placeholder="1" className="input" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Incremento de carga (kg)</label>
                    <input type="number" min="0" step="0.5" value={weightIncrement} onChange={e => setWeightIncrement(e.target.value === '' ? '' : Number(e.target.value))} placeholder="2.5" className="input" />
                  </div>
                </>
              )}

              <div>
                <label className="label">Prioridad</label>
                <select value={priority} onChange={e => setPriority(e.target.value as ExercisePriority)} className="input">
                  <option value="">Sin especificar</option>
                  {PRIORITY_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Nota de progresión</label>
                <textarea value={progressionNotes} onChange={e => setProgressionNotes(e.target.value)} rows={2} placeholder="Ej: no subir carga si aparece molestia lumbar" className="input resize-none" />
              </div>
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isOptional} onChange={e => setIsOptional(e.target.checked)} className="rounded" />
          <span className="text-sm text-gray-600 dark:text-gray-300">Ejercicio opcional</span>
        </label>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} fullWidth>Cancelar</Button>
          <Button onClick={handleSave} disabled={!name.trim()} fullWidth>Guardar</Button>
        </div>
      </div>
    </Modal>
  );
}
