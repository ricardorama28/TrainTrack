import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

/**
 * Surfaces the data-migration decision after sign-in.
 * - Case A: cloud empty, local has data → offer to upload.
 * - Case C: both have data → let the user choose which wins.
 * Closing without choosing keeps local data untouched (safe default).
 */
export function SyncConflictModal() {
  const { migrationPrompt, resolveMigration } = useAuth();
  if (!migrationPrompt) return null;

  const isCaseA = migrationPrompt.kind === 'caseA';

  return (
    <Modal
      open
      onClose={() => resolveMigration(isCaseA ? 'skip' : 'keep-local')}
      title={isCaseA ? 'Datos locales encontrados' : 'Conflicto de datos'}
    >
      {isCaseA ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Encontramos datos en este dispositivo y tu cuenta en la nube está vacía.
            ¿Querés subir estos datos a tu cuenta para sincronizarlos?
          </p>
          <div className="space-y-2">
            <Button fullWidth onClick={() => resolveMigration('upload')}>
              ☁️ Subir mis datos a la nube
            </Button>
            <Button variant="secondary" fullWidth onClick={() => resolveMigration('skip')}>
              Mantener solo en este dispositivo
            </Button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Si elegís mantenerlos solo localmente, no se sincronizarán hasta que hagas un cambio o subas tus datos manualmente.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Hay datos en este dispositivo <strong>y</strong> datos guardados en tu cuenta.
            ¿Qué querés hacer?
          </p>
          <div className="space-y-2">
            <Button fullWidth onClick={() => resolveMigration('use-cloud')}>
              ☁️ Usar los datos de la nube
            </Button>
            <Button variant="secondary" fullWidth onClick={() => resolveMigration('upload-local')}>
              📲 Subir los datos de este dispositivo (reemplaza la nube)
            </Button>
            <Button variant="ghost" fullWidth onClick={() => resolveMigration('keep-local')}>
              Mantener datos locales por ahora
            </Button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            "Usar los datos de la nube" reemplaza lo que tenés en este dispositivo. Ninguna opción borra datos sin tu confirmación.
          </p>
        </div>
      )}
    </Modal>
  );
}
