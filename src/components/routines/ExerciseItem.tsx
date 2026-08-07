import { Clapperboard, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { MUSCLE_LABELS } from '../../lib/labels';
import type { ExerciseTemplate } from '../../types';

interface ExerciseItemProps {
  exercise: ExerciseTemplate;
  onEdit: () => void;
  onDelete: () => void;
  draggable?: boolean;
}

export function ExerciseItem({ exercise, onEdit, onDelete }: ExerciseItemProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-800 dark:text-gray-100 text-sm">{exercise.name}</span>
            {exercise.isOptional && <Badge variant="gray">Opcional</Badge>}
            {exercise.muscleGroup && (
              <Badge variant="purple">{MUSCLE_LABELS[exercise.muscleGroup]}</Badge>
            )}
            {exercise.priority && exercise.priority !== 'primary' && (
              <Badge variant="gray">{exercise.priority === 'optional' ? 'Opcional' : 'Importante'}</Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-500 dark:text-gray-400">
            {exercise.sets && exercise.reps && (
              <span>{exercise.sets} series × {exercise.reps}</span>
            )}
            {exercise.weight && <span>{exercise.weight} kg</span>}
            {exercise.restSeconds && <span>Descanso: {exercise.restSeconds}s</span>}
          </div>
          {exercise.notes && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">{exercise.notes}</p>
          )}
          {exercise.videoUrl && (
            <a
              href={exercise.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline mt-1"
            >
              <Clapperboard size={13} /> Ver video
            </a>
          )}
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} aria-label="Editar" className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"><Pencil size={15} /></button>
          <button onClick={onDelete} aria-label="Eliminar" className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400"><Trash2 size={15} /></button>
        </div>
      </div>
    </div>
  );
}
