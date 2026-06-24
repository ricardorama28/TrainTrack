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

/** Effective reference link of an exercise (new field first, legacy fallback). */
function refUrl(ex?: Exercise): string | undefined {
  return ex?.referenceUrl ?? ex?.videoUrl;
}

/** YouTube search deep-link fallback. */
function ytSearchUrl(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' ejercicio técnica')}`;
}

/** Google search deep-link fallback. */
function googleSearchUrl(name: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(name + ' ejercicio técnica')}`;
}

/**
 * Converts a YouTube watch/shorts URL to its embeddable /embed/ form.
 * Returns null for non-video URLs (search results, non-YouTube, etc.)
 * so callers can skip rendering the iframe entirely.
 */
function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let videoId: string | null = null;

    if ((u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com') && u.pathname === '/watch') {
      videoId = u.searchParams.get('v');
    } else if (u.hostname === 'youtu.be') {
      videoId = u.pathname.slice(1).split('?')[0];
    } else if ((u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com') && u.pathname.startsWith('/shorts/')) {
      videoId = u.pathname.split('/')[2];
    }

    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return null;
  }
}

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
  referenceUrl?: string;
  lastDate: string;
  lastWeight?: number;
  totalSessions: number;
}

export function ExercisesPage({ logs, routines, exercises, onUpdateExercise }: ExercisesPageProps) {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
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
        referenceUrl: refUrl(lib),
        lastDate: sortedDates[0] ?? '',
        lastWeight: s && s.weights.length > 0 ? s.weights[s.weights.length - 1] : undefined,
        totalSessions: s ? s.dates.length : 0,
      });
    }

    // 2. Add orphans: exercises in logs or routines not yet in the library
    const addOrphan = (name: string, muscleGroup?: MuscleGroup, weight?: number, videoUrl?: string) => {
      const key = normalizeName(name);
      if (rowMap.has(key)) return;
      const s = stats.get(key);
      const sortedDates = s ? [...s.dates].sort((a, b) => b.localeCompare(a)) : [];
      const weights = s ? s.weights : (weight != null ? [weight] : []);
      rowMap.set(key, {
        name,
        muscleGroup,
        referenceUrl: videoUrl,
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

  function acceptReference(lib: Exercise) {
    onUpdateExercise(lib.id, { referenceStatus: 'accepted' });
  }

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
        {filtered.map(row => {
          const lib = row.library;
          const isOpen = expanded === row.name;
          const suggested = lib?.referenceStatus === 'suggested';
          return (
            <Card key={row.name} padding>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
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
                  {lib?.primaryMuscles && lib.primaryMuscles.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">💪 {lib.primaryMuscles.join(' · ')}</p>
                  )}
                  {lib?.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{lib.description}</p>
                  )}
                  {lib?.purpose && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 italic">🎯 {lib.purpose}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {row.lastWeight !== undefined && <Badge variant="green">🏋️ {row.lastWeight} kg</Badge>}
                  {lib && (
                    <button
                      onClick={() => setEditing(lib)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm"
                      title="Editar"
                    >✏️</button>
                  )}
                </div>
              </div>

              {/* Reference row */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {row.referenceUrl ? (
                  <>
                    <a
                      href={row.referenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      🎬 Ver referencia
                    </a>
                    {suggested && (
                      <>
                        <Badge variant="yellow">Sugerida</Badge>
                        {lib && (
                          <button
                            onClick={() => acceptReference(lib)}
                            className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            ✓ Aceptar
                          </button>
                        )}
                      </>
                    )}
                    {lib && (
                      <button
                        onClick={() => setEditing(lib)}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
                      >
                        Cambiar
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-xs text-gray-400 dark:text-gray-500">Sin referencia</span>
                    <a
                      href={ytSearchUrl(row.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      🔎 Buscar en YouTube
                    </a>
                  </>
                )}
              </div>

              {/* Detail toggle — always visible so any exercise can be opened */}
              <button
                onClick={() => setExpanded(isOpen ? null : row.name)}
                className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {isOpen ? 'Ocultar detalle ▲' : 'Ver detalle ▼'}
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
                  {/* Inline YouTube embed — loads only when detail is open */}
                  {(() => {
                    const embedUrl = getYouTubeEmbedUrl(row.referenceUrl ?? '');
                    if (!embedUrl) return null;
                    return (
                      <div className="rounded-xl overflow-hidden aspect-video bg-black">
                        <iframe
                          src={embedUrl}
                          title={`Referencia: ${row.name}`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          loading="lazy"
                          className="w-full h-full"
                        />
                      </div>
                    );
                  })()}

                  {/* No knowledge yet → helpful empty state */}
                  {!lib?.description && !lib?.purpose &&
                   !(lib?.simpleInstructions?.length) && !(lib?.commonMistakes?.length) &&
                   !lib?.safetyNotes && !lib?.technicalNotes && (
                    <div className="rounded-xl bg-gray-100 dark:bg-gray-800 p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Sin descripción todavía. Podés enriquecer este ejercicio desde
                        <span className="font-medium text-gray-600 dark:text-gray-300"> Ajustes → Enriquecer ejercicios existentes</span>
                        {lib ? ', o editarlo manualmente con el lápiz ✏️.' : '.'}
                      </p>
                    </div>
                  )}

                  {/* What it is */}
                  {lib?.description && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">📖 Qué es</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{lib.description}</p>
                    </div>
                  )}

                  {/* What it's for */}
                  {lib?.purpose && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">🎯 Para qué sirve</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{lib.purpose}</p>
                    </div>
                  )}

                  {/* Movement pattern / posture chips */}
                  {(lib?.movementPattern || lib?.postureFocus) && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {lib?.movementPattern && <Badge variant="teal">{lib.movementPattern}</Badge>}
                      {lib?.postureFocus && <Badge variant="orange">Postura</Badge>}
                    </div>
                  )}

                  {/* Muscles */}
                  {(lib?.primaryMuscles?.length || lib?.secondaryMuscles?.length) && (
                    <div className="space-y-1.5">
                      {lib?.primaryMuscles && lib.primaryMuscles.length > 0 && (
                        <div className="flex items-start gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">💪 Principales:</span>
                          {lib.primaryMuscles.map(m => <Badge key={m} variant="purple">{m}</Badge>)}
                        </div>
                      )}
                      {lib?.secondaryMuscles && lib.secondaryMuscles.length > 0 && (
                        <div className="flex items-start gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">🤝 Secundarios:</span>
                          {lib.secondaryMuscles.map(m => <Badge key={m} variant="gray">{m}</Badge>)}
                        </div>
                      )}
                    </div>
                  )}

                  {lib?.simpleInstructions && lib.simpleInstructions.length > 0 && (
                    <DetailList title="📋 Instrucciones" items={lib.simpleInstructions} ordered />
                  )}
                  {lib?.commonMistakes && lib.commonMistakes.length > 0 && (
                    <DetailList title="⚠️ Errores comunes" items={lib.commonMistakes} />
                  )}
                  {lib?.safetyNotes && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">🛡️ Seguridad</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{lib.safetyNotes}</p>
                    </div>
                  )}
                  {lib?.equipment && lib.equipment.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">🧰 Equipo:</span>
                      {lib.equipment.map(eq => <Badge key={eq} variant="blue">{eq}</Badge>)}
                    </div>
                  )}

                  {/* Personal notes */}
                  {lib?.technicalNotes && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">📝 Notas personales</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-line">{lib.technicalNotes}</p>
                    </div>
                  )}

                  {row.totalSessions > 0 && (
                    <button
                      onClick={() => setSelectedExercise(row.name)}
                      className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      📈 Ver historial de progreso
                    </button>
                  )}
                </div>
              )}
            </Card>
          );
        })}
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

// ─── Small presentational helper ──────────────────────────────────────────────

function DetailList({ title, items, ordered }: { title: string; items: string[]; ordered?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">{title}</p>
      {ordered ? (
        <ol className="list-decimal ml-4 space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
          {items.map((it, i) => <li key={i}>{it}</li>)}
        </ol>
      ) : (
        <ul className="list-disc ml-4 space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
          {items.map((it, i) => <li key={i}>{it}</li>)}
        </ul>
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
  const [referenceUrl, setReferenceUrl] = useState(refUrl(exercise) ?? '');
  const [description, setDescription] = useState(exercise.description ?? '');
  const [purpose, setPurpose] = useState(exercise.purpose ?? '');
  const [technicalNotes, setTechnicalNotes] = useState(exercise.technicalNotes ?? '');

  const originalRef = refUrl(exercise) ?? '';

  function handleSave() {
    const refChanged = referenceUrl.trim() !== originalRef;
    const updates: Partial<Omit<Exercise, 'id' | 'createdAt'>> = {
      name: name.trim(),
      muscleGroup: muscleGroup || undefined,
      category: category || undefined,
      description: description.trim() || undefined,
      purpose: purpose.trim() || undefined,
      technicalNotes: technicalNotes.trim() || undefined,
    };
    if (refChanged) {
      // A hand-edited link becomes a protected manual reference.
      updates.referenceUrl = referenceUrl.trim() || undefined;
      updates.videoUrl = referenceUrl.trim() || undefined;
      updates.referenceStatus = referenceUrl.trim() ? 'manual' : 'missing';
      updates.referenceSource = referenceUrl.trim() ? 'manual' : undefined;
    }
    onSave(updates);
  }

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
          <label className="label">Descripción</label>
          <textarea className="input resize-none" rows={2} value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="label">Para qué sirve</label>
          <input className="input" value={purpose} onChange={e => setPurpose(e.target.value)} />
        </div>
        <div>
          <label className="label">Link de referencia (video/imagen)</label>
          <input className="input" type="url" value={referenceUrl} onChange={e => setReferenceUrl(e.target.value)} placeholder="https://youtube.com/..." />
          <div className="flex gap-3 mt-1.5">
            <a href={ytSearchUrl(name)} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 dark:text-primary-400 hover:underline">🔎 Buscar en YouTube</a>
            <a href={googleSearchUrl(name)} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 dark:text-primary-400 hover:underline">🔎 Buscar en Google</a>
          </div>
        </div>
        <div>
          <label className="label">Notas técnicas</label>
          <textarea className="input resize-none" rows={2} value={technicalNotes} onChange={e => setTechnicalNotes(e.target.value)} />
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} fullWidth>Cancelar</Button>
          <Button fullWidth disabled={!name.trim()} onClick={handleSave}>Guardar</Button>
        </div>
      </div>
    </Modal>
  );
}
