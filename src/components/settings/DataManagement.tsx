import { useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { storage } from '../../lib/storage';
import type { AppData } from '../../types';

interface DataManagementProps {
  onDataChange: () => void;
}

export function DataManagement({ onDataChange }: DataManagementProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [importError, setImportError] = useState('');

  function handleExport() {
    const json = storage.exportAll();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traintrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as AppData;
        if (!data.workoutLogs && !data.routines) {
          setImportError('El archivo no parece ser un backup de TrainTrack.');
          return;
        }
        storage.importAll(data);
        onDataChange();
        setImportError('');
        alert('Datos importados correctamente.');
      } catch {
        setImportError('El archivo no es JSON válido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleClearAll() {
    storage.clearAll();
    onDataChange();
    setConfirmClear(false);
    window.location.reload();
  }

  return (
    <div className="space-y-3">
      <Button variant="secondary" fullWidth onClick={handleExport}>
        📤 Exportar datos (JSON)
      </Button>

      <div>
        <Button variant="secondary" fullWidth onClick={() => fileInputRef.current?.click()}>
          📥 Importar datos (JSON)
        </Button>
        <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImportFile} />
        {importError && <p className="text-xs text-red-500 mt-1">{importError}</p>}
      </div>

      <Button variant="danger" fullWidth onClick={() => setConfirmClear(true)}>
        🗑️ Borrar todos los datos
      </Button>

      <Modal open={confirmClear} onClose={() => setConfirmClear(false)} title="Borrar todos los datos">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            ¿Estás segura de que querés borrar <strong>todos los datos</strong>? Esta acción no se puede deshacer.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Se eliminarán todos los entrenamientos registrados, rutinas y ajustes.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setConfirmClear(false)} fullWidth>Cancelar</Button>
            <Button variant="danger" onClick={handleClearAll} fullWidth>Sí, borrar todo</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
