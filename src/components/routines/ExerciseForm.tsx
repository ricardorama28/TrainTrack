import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { ExerciseTemplate, MuscleGroup } from '../../types';

const MUSCLE_OPTIONS: { value: MuscleGroup; label: string }[] = [
  { value: 'glutes',    label: 'Glúteos'   },
  { value: 'legs',      label: 'Piernas'   },
  { value: 'back',      label: 'Espalda'   },
  { value: 'chest',     label: 'Pecho'     },
  { value: 'shoulders', label: 'Hombros'   },
  { value: 'arms',      label: 'Brazos'    },
  { value: 'core',      label: 'Core'      },
  { value: 'full-body', label: 'Full Body' },
  { value: 'mobility',  label: 'Movilidad' },
  { value: 'other',     label: 'Otro'      },
];

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
