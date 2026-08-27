import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Pencil, Copy, Trash2, Play, ChevronUp, ChevronDown, ClipboardList, Calendar } from 'lucide-react';
import type { Routine } from '../../types';

interface RoutineCardProps {
  routine: Routine;
  onStart: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function RoutineCard({ routine, onStart, onEdit, onDuplicate, onDelete, onMoveUp, onMoveDown, canMoveUp, canMoveDown }: RoutineCardProps) {
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h3 className="min-w-0 flex-1 truncate text-title text-content">{routine.name}</h3>
        <Badge variant={routine.type === 'workout' ? 'purple' : 'teal'}>
          {routine.type === 'workout' ? 'Entrenamiento' : 'Desc. activo'}
        </Badge>
      </div>
      {routine.description && (
        <p className="mt-1.5 line-clamp-2 text-caption text-content-muted">{routine.description}</p>
      )}

      {/* Metadatos */}
      <div className="mt-3 flex items-center gap-4 text-caption text-content-muted">
        <span className="flex items-center gap-1.5">
          <ClipboardList size={13} />
          {routine.exercises.length} ejercicio{routine.exercises.length !== 1 ? 's' : ''}
        </span>
        {routine.suggestedDays && routine.suggestedDays.length > 0 && (
          <span className="flex items-center gap-1.5">
            <Calendar size={13} />
            {routine.suggestedDays.map(d => DAY_NAMES[d]).join(', ')}
          </span>
        )}
      </div>

      {/* Vista previa: sin viñeta por fila — aparecía en todas, así que era
          textura. La columna de series queda alineada en Mono. */}
      {routine.exercises.length > 0 && (
        <div className="mt-4 divide-y divide-hairline">
          {routine.exercises.slice(0, 3).map(ex => (
            <div key={ex.id} className="grid grid-cols-[1fr_auto] items-baseline gap-4 py-2.5 first:pt-0">
              <span className="truncate text-body text-content">{ex.name}</span>
              {ex.sets && ex.reps && (
                <span className="font-mono text-caption text-content-muted">
                  {ex.sets}×{ex.reps}
                </span>
              )}
            </div>
          ))}
          {routine.exercises.length > 3 && (
            <p className="pt-2.5 text-caption text-content-subtle">
              +{routine.exercises.length - 3} más
            </p>
          )}
        </div>
      )}

      {/* Start workout */}
      {routine.exercises.length > 0 && (
        <Button variant="ink" size="lg" onClick={onStart} fullWidth className="mt-5">
          <Play size={16} /> Iniciar entrenamiento
        </Button>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2 border-t border-hairline pt-3">
        <Button variant="ghost" size="sm" onClick={onMoveUp} disabled={!canMoveUp} aria-label="Subir rutina">
          <ChevronUp size={16} />
        </Button>
        <Button variant="ghost" size="sm" onClick={onMoveDown} disabled={!canMoveDown} aria-label="Bajar rutina">
          <ChevronDown size={16} />
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit} className="flex-1">
          <Pencil size={14} /> Editar
        </Button>
        <Button variant="ghost" size="sm" onClick={onDuplicate} aria-label="Duplicar">
          <Copy size={14} />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500 dark:text-red-400" aria-label="Eliminar">
          <Trash2 size={14} />
        </Button>
      </div>
    </Card>
  );
}
