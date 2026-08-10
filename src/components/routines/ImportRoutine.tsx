import { useState } from 'react';
import {
  ClipboardList, FileText, Bot, Lightbulb, AlertTriangle, ArrowRight, ArrowLeft,
  Check, Copy, Trash2, X, TrendingUp, type LucideIcon,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { parseRoutineText } from '../../lib/parser';
import type { ParsedDay, ParsedExercise, MuscleGroup, ProgressionMethod, ExercisePriority, MetricKind } from '../../types';

type Tab = 'json' | 'text' | 'prompt';
type Phase = 'input' | 'preview';

// ─── JSON validation ──────────────────────────────────────────────────────────

const VALID_MUSCLE_GROUPS = new Set<string>([
  'glutes', 'legs', 'back', 'chest', 'shoulders', 'arms', 'core', 'full-body', 'mobility', 'other',
]);

const VALID_PROGRESSION_METHODS = new Set<string>(['double-progression', 'linear', 'none']);
const VALID_PRIORITIES = new Set<string>(['primary', 'secondary', 'optional']);
const VALID_METRIC_KINDS = new Set<string>(['loaded', 'bodyweight', 'isometric']);

/** Read a numeric field, returning undefined when absent or not a finite number. */
function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

/**
 * Cleans up pasted JSON before parsing. Handles the common real-world cases:
 * - iOS/ChatGPT smart quotes (“ ” « » ‘ ’ ′) → straight quotes
 * - markdown code fences (```json ... ```)
 * - leading/trailing prose around the JSON object
 */
function sanitizeJsonInput(input: string): string {
  let text = input.trim();

  // Strip markdown code fences
  text = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  // If there is text before/after, extract from the first { to the last }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  // Smart/typographic quotes → straight quotes
  return text
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’′]/g, "'");
}

function validateAndConvert(raw: unknown): ParsedDay[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('El JSON debe ser un objeto con una propiedad "days"');
  }
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.days)) {
    throw new Error('Falta la propiedad "days" (array de días)');
  }

  return (obj.days as unknown[]).map((day, dayIdx) => {
    if (!day || typeof day !== 'object' || Array.isArray(day)) {
      throw new Error(`Día ${dayIdx + 1}: debe ser un objeto`);
    }
    const d = day as Record<string, unknown>;
    if (!d.name || typeof d.name !== 'string') {
      throw new Error(`Día ${dayIdx + 1}: falta la propiedad "name" (string)`);
    }
    if (!Array.isArray(d.exercises)) {
      throw new Error(`Día "${d.name}": falta la propiedad "exercises" (array)`);
    }

    const type: 'workout' | 'active-rest' = d.type === 'active-rest' ? 'active-rest' : 'workout';

    const exercises: ParsedExercise[] = (d.exercises as unknown[]).map((ex, exIdx) => {
      if (!ex || typeof ex !== 'object' || Array.isArray(ex)) {
        throw new Error(`Día "${d.name}", ejercicio ${exIdx + 1}: debe ser un objeto`);
      }
      const e = ex as Record<string, unknown>;
      if (!e.name || typeof e.name !== 'string') {
        throw new Error(`Día "${d.name}", ejercicio ${exIdx + 1}: falta "name" (string)`);
      }
      const muscleGroup =
        typeof e.muscleGroup === 'string' && VALID_MUSCLE_GROUPS.has(e.muscleGroup)
          ? (e.muscleGroup as MuscleGroup)
          : undefined;
      const progressionMethod =
        typeof e.progressionMethod === 'string' && VALID_PROGRESSION_METHODS.has(e.progressionMethod)
          ? (e.progressionMethod as ProgressionMethod)
          : undefined;
      const priority =
        typeof e.priority === 'string' && VALID_PRIORITIES.has(e.priority)
          ? (e.priority as ExercisePriority)
          : undefined;
      const metricKind =
        typeof e.metricKind === 'string' && VALID_METRIC_KINDS.has(e.metricKind)
          ? (e.metricKind as MetricKind)
          : undefined;
      return {
        name: e.name as string,
        sets: num(e.sets),
        reps: e.reps != null ? String(e.reps) : undefined,
        weight: num(e.weight),
        restSeconds: num(e.restSeconds),
        muscleGroup,
        videoUrl: typeof e.videoUrl === 'string' && e.videoUrl ? e.videoUrl : undefined,
        notes: typeof e.notes === 'string' && e.notes ? e.notes : undefined,
        // Progression (all optional; absent ones stay undefined and import unchanged)
        progressionMethod: progressionMethod !== 'none' ? progressionMethod : undefined,
        targetRepMin: num(e.targetRepMin),
        targetRepMax: num(e.targetRepMax),
        targetRir: num(e.targetRir),
        weightIncrement: num(e.weightIncrement),
        priority,
        progressionNotes: typeof e.progressionNotes === 'string' && e.progressionNotes ? e.progressionNotes : undefined,
        metricKind,
      };
    });

    return {
      name: d.name as string,
      type,
      notes: typeof d.notes === 'string' && d.notes ? d.notes : undefined,
      exercises,
    };
  });
}

const PRIORITY_LABEL: Record<string, string> = { primary: 'Principal', secondary: 'Importante', optional: 'Opcional' };

/** Compact read-only summary of an exercise's parsed progression, or '' if none. */
function progressionSummary(ex: ParsedExercise): string {
  const parts: string[] = [];
  if (ex.progressionMethod === 'double-progression') parts.push('Doble progresión');
  if (ex.targetRepMin != null && ex.targetRepMax != null) parts.push(`${ex.targetRepMin}–${ex.targetRepMax}`);
  if (ex.targetRir != null) parts.push(`RIR ${ex.targetRir}`);
  if (ex.priority) parts.push(PRIORITY_LABEL[ex.priority] ?? ex.priority);
  return parts.join(' · ');
}

// ─── Static content ───────────────────────────────────────────────────────────

const CHATGPT_PROMPT = `Necesito una rutina de entrenamiento en formato JSON estricto. Responde SOLO con el JSON (sin explicaciones, sin bloques de código markdown, sin texto adicional antes o después).

Formato requerido:
{
  "days": [
    {
      "name": "Día A",
      "type": "workout",
      "notes": "Notas opcionales del día",
      "exercises": [
        {
          "name": "Hip Thrust",
          "sets": 4,
          "reps": "8-12",
          "weight": null,
          "restSeconds": 90,
          "muscleGroup": "glutes",
          "videoUrl": "",
          "notes": "Notas técnicas opcionales",
          "progressionMethod": "double-progression",
          "targetRepMin": 8,
          "targetRepMax": 12,
          "targetRir": 1,
          "weightIncrement": 2.5,
          "priority": "primary"
        }
      ]
    }
  ]
}

Valores válidos para "type": "workout" o "active-rest"
Valores válidos para "muscleGroup": "glutes", "legs", "back", "chest", "shoulders", "arms", "core", "full-body", "mobility", "other"
"weight" puede ser null para ejercicios de peso corporal o sin carga específica

Campos de progresión (TODOS opcionales — omitilos en accesorios, movilidad o si no aplica):
- "progressionMethod": "double-progression" o "none" (usá doble progresión en ejercicios principales con carga)
- "targetRepMin" y "targetRepMax": números, el rango de reps objetivo (ej. 8 y 12)
- "targetRir": número, RIR mínimo para subir carga (típico 1 o 2)
- "weightIncrement": número, cuántos kg subir al completar el rango (ej. 2.5)
- "priority": "primary" (principal), "secondary" (importante) u "optional" (opcional)
- "metricKind": "loaded" (con carga), "bodyweight" (peso corporal) o "isometric" (isométrico); se infiere si se omite
- "progressionNotes": texto con una regla especial (ej. "no subir si hay molestia lumbar")

Mi solicitud de rutina:
[ESCRIBE TU PEDIDO AQUÍ — ej: "Rutina de 3 días full body para principiante con mancuernas y banco"]`;

const EXAMPLE_JSON = `{
  "days": [
    {
      "name": "Día A – Full Body",
      "type": "workout",
      "exercises": [
        { "name": "Hip Thrust", "sets": 4, "reps": "8-12", "weight": 25, "restSeconds": 90, "muscleGroup": "glutes", "progressionMethod": "double-progression", "targetRepMin": 8, "targetRepMax": 12, "targetRir": 1, "weightIncrement": 2.5, "priority": "primary" },
        { "name": "Sentadilla Goblet", "sets": 3, "reps": "10-12", "weight": 12, "restSeconds": 75, "muscleGroup": "legs", "progressionMethod": "double-progression", "targetRepMin": 10, "targetRepMax": 12, "targetRir": 2, "weightIncrement": 2.5, "priority": "primary" },
        { "name": "Plancha", "sets": 3, "reps": "30 seg", "restSeconds": 60, "muscleGroup": "core", "metricKind": "isometric", "priority": "secondary" }
      ]
    },
    {
      "name": "Día B – Tren Superior",
      "type": "workout",
      "exercises": [
        { "name": "Press Militar", "sets": 3, "reps": "8-10", "weight": 7.5, "restSeconds": 90, "muscleGroup": "shoulders", "progressionMethod": "double-progression", "targetRepMin": 8, "targetRepMax": 10, "targetRir": 1, "weightIncrement": 2.5, "priority": "primary" },
        { "name": "Curl de Bíceps", "sets": 3, "reps": "12", "weight": 7.5, "restSeconds": 60, "muscleGroup": "arms", "priority": "optional" }
      ]
    }
  ]
}`;

// ─── Component ────────────────────────────────────────────────────────────────

interface ImportRoutineProps {
  open: boolean;
  onClose: () => void;
  onImport: (days: ParsedDay[]) => void;
}

export function ImportRoutine({ open, onClose, onImport }: ImportRoutineProps) {
  const [tab, setTab] = useState<Tab>('json');
  const [phase, setPhase] = useState<Phase>('input');

  const [textInput, setTextInput] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [previewDays, setPreviewDays] = useState<ParsedDay[]>([]);
  const [generalNotes, setGeneralNotes] = useState<string | undefined>();

  // ── Actions ──────────────────────────────────────────────────────────────────

  function handleParseText() {
    const result = parseRoutineText(textInput);
    setPreviewDays(result.days.map(d => ({ ...d, exercises: d.exercises.map(e => ({ ...e })) })));
    setGeneralNotes(result.generalNotes);
    setPhase('preview');
  }

  function handleValidateJson() {
    setJsonError(null);
    let raw: unknown;
    try {
      raw = JSON.parse(sanitizeJsonInput(jsonInput));
    } catch {
      setJsonError('JSON inválido — revisá que las comillas, comas y llaves estén bien cerradas.');
      return;
    }
    try {
      const days = validateAndConvert(raw);
      setPreviewDays(days);
      setGeneralNotes(undefined);
      setPhase('preview');
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'Error de validación');
    }
  }

  function handleCopyPrompt() {
    navigator.clipboard.writeText(CHATGPT_PROMPT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function handleBack() {
    setPhase('input');
    setPreviewDays([]);
    setGeneralNotes(undefined);
  }

  function handleConfirm() {
    onImport(previewDays);
    resetAndClose();
  }

  function resetAndClose() {
    setPhase('input');
    setTextInput('');
    setJsonInput('');
    setJsonError(null);
    setPreviewDays([]);
    setGeneralNotes(undefined);
    onClose();
  }

  // ── Preview editing ──────────────────────────────────────────────────────────

  function updateDay(i: number, updates: Partial<ParsedDay>) {
    setPreviewDays(prev => prev.map((d, idx) => (idx === i ? { ...d, ...updates } : d)));
  }

  function updateExercise(dayIdx: number, exIdx: number, updates: Partial<ParsedExercise>) {
    setPreviewDays(prev =>
      prev.map((d, i) => {
        if (i !== dayIdx) return d;
        return { ...d, exercises: d.exercises.map((e, j) => (j === exIdx ? { ...e, ...updates } : e)) };
      }),
    );
  }

  function deleteExercise(dayIdx: number, exIdx: number) {
    setPreviewDays(prev =>
      prev.map((d, i) => {
        if (i !== dayIdx) return d;
        return { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) };
      }),
    );
  }

  function deleteDay(dayIdx: number) {
    setPreviewDays(prev => prev.filter((_, i) => i !== dayIdx));
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const TABS: [Tab, LucideIcon, string][] = [
    ['json', ClipboardList, 'JSON'],
    ['text', FileText, 'Texto libre'],
    ['prompt', Bot, 'Prompt ChatGPT'],
  ];

  return (
    <Modal open={open} onClose={resetAndClose} title="Importar rutina" maxWidth="max-w-2xl">
      {phase === 'input' ? (
        <div className="space-y-4">
          {/* Tab bar */}
          <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {TABS.map(([t, Icon, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 px-1.5 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                  tab === t
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={13} /> {label}
                {t === 'json' && (
                  <span className={`text-[9px] px-1 rounded ${tab === 'json' ? 'bg-white/20 text-white' : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'}`}>
                    Rec.
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* JSON tab */}
          {tab === 'json' && (
            <div className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300">
                <p className="inline-flex items-center gap-1 font-medium mb-1"><Lightbulb size={13} /> Importación por JSON</p>
                <p>Pegá el JSON generado con el prompt de la pestaña "Prompt ChatGPT". La estructura es validada antes de importar.</p>
              </div>
              <div>
                <label className="label">JSON de la rutina</label>
                <textarea
                  value={jsonInput}
                  onChange={e => { setJsonInput(e.target.value); setJsonError(null); }}
                  rows={10}
                  placeholder={EXAMPLE_JSON}
                  className="input resize-none font-mono text-xs"
                />
              </div>
              {jsonError && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-xs text-red-700 dark:text-red-300">
                  <p className="inline-flex items-center gap-1 font-medium"><AlertTriangle size={13} /> Error de validación</p>
                  <p className="mt-0.5">{jsonError}</p>
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setJsonInput(EXAMPLE_JSON); setJsonError(null); }}
                  className="text-gray-500"
                >
                  Cargar ejemplo
                </Button>
                <div className="flex-1" />
                <Button variant="secondary" onClick={resetAndClose}>Cancelar</Button>
                <Button onClick={handleValidateJson} disabled={!jsonInput.trim()}>
                  Validar y continuar <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* Text tab */}
          {tab === 'text' && (
            <div className="space-y-3">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 text-xs text-yellow-700 dark:text-yellow-300">
                <p className="inline-flex items-center gap-1 font-medium mb-1"><AlertTriangle size={13} /> Importación por texto libre</p>
                <p>El parser solo reconoce ejercicios con series/reps explícitas (ej: 4x10). Texto médico, objetivos y notas se ignoran automáticamente. Para mejores resultados usá el formato JSON.</p>
              </div>
              <div>
                <label className="label">Pegá tu rutina en texto</label>
                <textarea
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  rows={10}
                  placeholder={`Día A:\n- Hip thrust: 4x10, 25 kg\n- Sentadilla: 3x12\n\nDía B:\n- Press militar: 3x10, 7.5 kg\n- Bíceps: 3x12, 7.5 kg`}
                  className="input resize-none font-mono text-xs"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1" />
                <Button variant="secondary" onClick={resetAndClose}>Cancelar</Button>
                <Button onClick={handleParseText} disabled={!textInput.trim()}>
                  Analizar texto <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* ChatGPT prompt tab */}
          {tab === 'prompt' && (
            <div className="space-y-3">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-xs text-purple-700 dark:text-purple-300">
                <p className="inline-flex items-center gap-1 font-medium mb-2"><Bot size={13} /> Cómo usar el prompt con ChatGPT</p>
                <ol className="list-decimal ml-4 space-y-0.5">
                  <li>Copiá el prompt de abajo con el botón "Copiar"</li>
                  <li>Pegalo en ChatGPT y reemplazá lo que está entre corchetes con tu pedido</li>
                  <li>ChatGPT va a responder solo con el JSON</li>
                  <li>Copiá el JSON, volvé a la pestaña "JSON" y pegalo allí</li>
                </ol>
              </div>
              <div>
                <label className="label">Prompt para ChatGPT</label>
                <textarea
                  readOnly
                  value={CHATGPT_PROMPT}
                  rows={14}
                  className="input resize-none font-mono text-xs bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 cursor-text"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1" />
                <Button variant="secondary" onClick={resetAndClose}>Cerrar</Button>
                <Button onClick={handleCopyPrompt}>
                  {copied ? <><Check size={16} /> ¡Copiado!</> : <><Copy size={16} /> Copiar prompt</>}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Preview / edit phase */
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <ArrowLeft size={15} /> Volver
            </button>
            <span className="text-sm text-gray-300 dark:text-gray-600">|</span>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong className="text-gray-800 dark:text-gray-200">{previewDays.length} rutina{previewDays.length !== 1 ? 's' : ''}</strong> listas para guardar. Editá antes de confirmar.
            </p>
          </div>

          {previewDays.length === 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center text-sm text-red-600 dark:text-red-400">
              No se detectaron rutinas válidas. Volvé y revisá el formato.
            </div>
          )}

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {previewDays.map((day, dayIdx) => (
              <div
                key={dayIdx}
                className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-3"
              >
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
                    <option value="workout">Entrenamiento</option>
                    <option value="active-rest">Descanso activo</option>
                  </select>
                  <button
                    onClick={() => deleteDay(dayIdx)}
                    className="text-red-400 hover:text-red-600"
                    title="Eliminar día"
                    aria-label="Eliminar día"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {day.notes && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-1">
                    Nota: {day.notes}
                  </p>
                )}

                {/* Exercises */}
                <div className="space-y-2">
                  {day.exercises.length === 0 && (
                    <p className="text-xs text-gray-400 italic text-center py-1">Sin ejercicios</p>
                  )}
                  {day.exercises.map((ex, exIdx) => (
                    <div
                      key={exIdx}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={ex.name}
                          onChange={e => updateExercise(dayIdx, exIdx, { name: e.target.value })}
                          className="flex-1 text-sm bg-transparent border-b border-gray-200 dark:border-gray-600 focus:outline-none focus:border-primary-500 text-gray-800 dark:text-gray-100 pb-0.5"
                        />
                        <button
                          onClick={() => deleteExercise(dayIdx, exIdx)}
                          className="text-red-400 hover:text-red-600"
                          title="Eliminar ejercicio"
                          aria-label="Eliminar ejercicio"
                        >
                          <X size={15} />
                        </button>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <input
                          type="number"
                          value={ex.sets ?? ''}
                          onChange={e =>
                            updateExercise(dayIdx, exIdx, {
                              sets: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                          placeholder="Series"
                          className="w-16 input py-1 text-xs"
                        />
                        <input
                          type="text"
                          value={ex.reps ?? ''}
                          onChange={e =>
                            updateExercise(dayIdx, exIdx, { reps: e.target.value || undefined })
                          }
                          placeholder="Reps"
                          className="w-20 input py-1 text-xs"
                        />
                        <input
                          type="number"
                          step="0.5"
                          value={ex.weight ?? ''}
                          onChange={e =>
                            updateExercise(dayIdx, exIdx, {
                              weight: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                          placeholder="kg"
                          className="w-16 input py-1 text-xs"
                        />
                      </div>
                      {ex.notes && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 italic">{ex.notes}</p>
                      )}
                      {progressionSummary(ex) && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300 text-[11px] font-medium px-1.5 py-0.5">
                          <TrendingUp size={11} /> {progressionSummary(ex)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {generalNotes && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 text-xs text-yellow-700 dark:text-yellow-300">
              <p className="font-medium mb-1">Notas generales (no importadas como ejercicios):</p>
              <p className="whitespace-pre-line">{generalNotes}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={handleBack} fullWidth>
              <ArrowLeft size={16} /> Volver
            </Button>
            <Button onClick={handleConfirm} disabled={previewDays.length === 0} fullWidth>
              <Check size={16} /> Guardar {previewDays.length} rutina{previewDays.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
