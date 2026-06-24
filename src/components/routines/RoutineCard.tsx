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
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate">{routine.name}</h3>
            <Badge variant={routine.type === 'workout' ? 'green' : 'teal'}>
              {routine.type === 'workout' ? 'Entrenamiento' : 'Desc. activo'}
            </Badge>
          </div>
          {routine.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{routine.description}</p>
          )}
        </div>
      </div>

      {/* Exercise count */}
      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <ClipboardList size={14} />
          {routine.exercises.length} ejercicio{routine.exercises.length !== 1 ? 's' : ''}
        </span>
        {routine.suggestedDays && routine.suggestedDays.length > 0 && (
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            {routine.suggestedDays.map(d => DAY_NAMES[d]).join(', ')}
          </span>
        )}
      </div>

      {/* Exercise preview */}
      {routine.exercises.length > 0 && (
        <div className="space-y-1">
          {routine.exercises.slice(0, 3).map(ex => (
            <div key={ex.id} className="flex items-center gap-2 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300 truncate">{ex.name}</span>
              {ex.sets && ex.reps && (
                <span className="text-gray-400 dark:text-gray-500 text-xs ml-auto flex-shrink-0">
                  {ex.sets}×{ex.reps}
                </span>
              )}
            </div>
          ))}
          {routine.exercises.length > 3 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 pl-3">
              +{routine.exercises.length - 3} más
            </p>
          )}
        </div>
      )}

      {/* Start workout */}
      {routine.exercises.length > 0 && (
        <Button size="lg" onClick={onStart} fullWidth className="mt-1">
          <Play size={16} /> Iniciar entrenamiento
        </Button>
      )}

      {/* Actions */}
      <div className="flex gap-2 border-t border-gray-100 dark:border-gray-800 pt-2">
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
