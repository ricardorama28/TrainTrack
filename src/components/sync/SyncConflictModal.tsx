import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

/**
 * Shown only when both local and cloud have data (Case C).
 * Cases A and B are handled automatically on sign-in.
 */
export function SyncConflictModal() {
  const { migrationPrompt, resolveMigration } = useAuth();
  if (!migrationPrompt) return null;

  return (
    <Modal
      open
      onClose={() => resolveMigration('keep-local')}
      title="Datos en conflicto"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Encontramos datos guardados en este dispositivo y también en tu cuenta.
          ¿Cuáles querés usar?
        </p>
        <div className="space-y-2">
          <Button fullWidth onClick={() => resolveMigration('upload-local')}>
            📲 Usar los de este dispositivo
          </Button>
          <Button variant="secondary" fullWidth onClick={() => resolveMigration('use-cloud')}>
            ☁️ Usar los de la nube
          </Button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          La opción elegida reemplaza la otra. Cerrar sin elegir mantiene los datos locales sin cambios.
        </p>
      </div>
    </Modal>
  );
}
