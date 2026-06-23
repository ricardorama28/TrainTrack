import { useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { ExerciseHistory } from '../components/exercises/ExerciseHistory';
import { normalizeName } from '../hooks/useExercises';
import type { WorkoutLog, Routine, Exercise, MuscleGroup, ExerciseCategory } from '../types';

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  glutes: 'Glúteos', legs: 'Piernas', back: 'Espalda', chest: 'Pecho',
  shoulders: 'Hombros', arms: 'Brazos', core: 'Core', 'full-body': 'Full Body',
  mobility: 'Movilidad', other: 'Otro',
};

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  strength: 'Fuerza', mobility: 'Movilidad', core: 'Core', posture: 'Postura', cardio: 'Cardio',
};

const MUSCLE_OPTIONS = Object.keys(MUSCLE_LABELS) as MuscleGroup[];
const CATEGORY_OPTIONS = Object.keys(CATEGORY_LABELS) as ExerciseCategory[];

interface ExercisesPageProps {
  logs: WorkoutLog[];
  routines: Routine[];
  exercises: Exercise[];
  onUpdateExercise: (id: string, updates: Partial<Omit<Exercise, 'id' | 'createdAt'>>) => void;
}

interface ExerciseRow {
  /** Library exercise if it exists; orphan rows (from old data) have no library entry */
  library?: Exercise;
  name: string;
  muscleGroup?: MuscleGroup;
  category?: ExerciseCategory;
  videoUrl?: string;
  lastDate: string;
  lastWeight?: number;
  totalSessions: number;
}

export function ExercisesPage({ logs, routines, exercises, onUpdateExercise }: ExercisesPageProps) {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [search, setSearch] = useState('');

  const rows = useMemo((): ExerciseRow[] => {
    // Aggregate log stats keyed by normalized name
    const stats = new Map<string, { dates: string[]; weights: number[]; displayName: string }>();
    const bump = (name: string) => {
      const key = normalizeName(name);
      if (!stats.has(key)) stats.set(key, { dates: [], weights: [], displayName: name });
      return stats.get(key)!;
    };

    for (const log of logs) {
      for (const ex of log.exercises) {
        const s = bump(ex.exerciseName);
        s.dates.push(log.date);
        for (const set of ex.sets) {
          if (set.weight != null) s.weights.push(set.weight);
        }
      }
    }

    const rowMap = new Map<string, ExerciseRow>();

    // 1. Start from the global library (primary source)
    for (const lib of exercises) {
      const s = stats.get(lib.nameLower);
      const sortedDates = s ? [...s.dates].sort((a, b) => b.localeCompare(a)) : [];
      rowMap.set(lib.nameLower, {
        library: lib,
        name: lib.name,
        muscleGroup: lib.muscleGroup,
        category: lib.category,
        videoUrl: lib.videoUrl,
        lastDate: sortedDates[0] ?? '',
        lastWeight: s && s.weights.length > 0 ? s.weights[s.weights.length - 1] : undefined,
        totalSessions: s ? s.dates.length : 0,
      });
    }

    // 2. Add orphans: exercises in logs or routines not yet in the library
    //    (keeps backward compatibility with data created before the library existed)
    const addOrphan = (name: string, muscleGroup?: MuscleGroup, weight?: number, videoUrl?: string) => {
      const key = normalizeName(name);
      if (rowMap.has(key)) return;
      const s = stats.get(key);
      const sortedDates = s ? [...s.dates].sort((a, b) => b.localeCompare(a)) : [];
      const weights = s ? s.weights : (weight != null ? [weight] : []);
      rowMap.set(key, {
        name,
        muscleGroup,
        videoUrl,
        lastDate: sortedDates[0] ?? '',
        lastWeight: weights.length > 0 ? weights[weights.length - 1] : undefined,
        totalSessions: s ? s.dates.length : 0,
      });
    };

    for (const log of logs) {
      for (const ex of log.exercises) addOrphan(ex.exerciseName);
    }
    for (const routine of routines) {
      for (const ex of routine.exercises) addOrphan(ex.name, ex.muscleGroup, ex.weight, ex.videoUrl);
    }

    return Array.from(rowMap.values()).sort((a, b) => {
      if (a.lastDate && b.lastDate) return b.lastDate.localeCompare(a.lastDate);
      if (a.lastDate) return -1;
      if (b.lastDate) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [logs, routines, exercises]);

  const filtered = rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ejercicios</h1>

      <input
        type="search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar ejercicio..."
        className="input"
      />

      {filtered.length === 0 && (
        <EmptyState
          icon="💪"
          title="Sin ejercicios todavía"
          description="Los ejercicios aparecen acá cuando importás o creás una rutina, o registrás un entrenamiento."
        />
      )}

      <div className="space-y-2">
        {filtered.map(row => (
          <Card key={row.name} padding>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0" onClick={() => setSelectedExercise(row.name)} role="button">
                <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{row.name}</p>
                <div className="flex gap-1.5 mt-1 flex-wrap items-center">
                  {row.muscleGroup && <Badge variant="purple">{MUSCLE_LABELS[row.muscleGroup]}</Badge>}
                  {row.category && <Badge variant="blue">{CATEGORY_LABELS[row.category]}</Badge>}
                  {row.totalSessions > 0 && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {row.totalSessions} sesión{row.totalSessions !== 1 ? 'es' : ''}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {row.lastWeight !== undefined && <Badge variant="green">🏋️ {row.lastWeight} kg</Badge>}
                {row.videoUrl && (
                  <a href={row.videoUrl} target="_blank" rel="noopener noreferrer" className="text-sm" title="Ver video">🎬</a>
                )}
                {row.library && (
                  <button
                    onClick={() => setEditing(row.library!)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm"
                    title="Editar"
                  >✏️</button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedExercise && (
        <ExerciseHistory
          exerciseName={selectedExercise}
          logs={logs}
          onClose={() => setSelectedExercise(null)}
        />
      )}

      {editing && (
        <ExerciseEditModal
          exercise={editing}
          onClose={() => setEditing(null)}
          onSave={(updates) => { onUpdateExercise(editing.id, updates); setEditing(null); }}
        />
      )}
    </div>
  );
}

// ─── Inline edit modal for a library exercise ─────────────────────────────────

interface ExerciseEditModalProps {
  exercise: Exercise;
  onClose: () => void;
  onSave: (updates: Partial<Omit<Exercise, 'id' | 'createdAt'>>) => void;
}

function ExerciseEditModal({ exercise, onClose, onSave }: ExerciseEditModalProps) {
  const [name, setName] = useState(exercise.name);
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | ''>(exercise.muscleGroup ?? '');
  const [category, setCategory] = useState<ExerciseCategory | ''>(exercise.category ?? '');
  const [videoUrl, setVideoUrl] = useState(exercise.videoUrl ?? '');
  const [technicalNotes, setTechnicalNotes] = useState(exercise.technicalNotes ?? '');

  return (
    <Modal open onClose={onClose} title="Editar ejercicio">
      <div className="space-y-4">
        <div>
          <label className="label">Nombre</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Grupo muscular</label>
            <select className="input" value={muscleGroup} onChange={e => setMuscleGroup(e.target.value as MuscleGroup)}>
              <option value="">Sin especificar</option>
              {MUSCLE_OPTIONS.map(m => <option key={m} value={m}>{MUSCLE_LABELS[m]}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Categoría</label>
            <select className="input" value={category} onChange={e => setCategory(e.target.value as ExerciseCategory)}>
              <option value="">Sin especificar</option>
              {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Link de video/referencia</label>
          <input className="input" type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/..." />
        </div>
        <div>
          <label className="label">Notas técnicas</label>
          <textarea className="input resize-none" rows={3} value={technicalNotes} onChange={e => setTechnicalNotes(e.target.value)} />
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} fullWidth>Cancelar</Button>
          <Button
            fullWidth
            disabled={!name.trim()}
            onClick={() => onSave({
              name: name.trim(),
              muscleGroup: muscleGroup || undefined,
              category: category || undefined,
              videoUrl: videoUrl || undefined,
              technicalNotes: technicalNotes || undefined,
            })}
          >Guardar</Button>
        </div>
      </div>
    </Modal>
  );
}
