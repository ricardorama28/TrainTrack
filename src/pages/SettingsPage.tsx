import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Wordmark } from '../components/brand/Wordmark';
import { DataManagement } from '../components/settings/DataManagement';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { getSyncState, onSyncStateChange, pushToCloud, type SyncState } from '../lib/cloudSync';
import type { Settings } from '../types';

interface SettingsPageProps {
  settings: Settings;
  onUpdate: (updates: Partial<Settings>) => void;
  onDataChange: () => void;
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
        checked ? 'bg-content' : 'bg-surface-3'
      }`}
    >
      <div className={`w-5 h-5 bg-canvas rounded-full shadow mt-0.5 transition-transform ${
        checked ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
      }`} />
    </div>
  );
}

function relativeTime(iso: string | null): string {
  if (!iso) return 'todavía no sincronizado';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

function AccountSection() {
  const { configured, user, localOnly, signOut } = useAuth();
  const [sync, setSync] = useState<SyncState>(getSyncState());

  useEffect(() => onSyncStateChange(setSync), []);

  // Supabase not configured → no account features at all.
  if (!configured) return null;

  return (
    <Card>
      <h2 className="section-label mb-4">Cuenta</h2>

      {user ? (
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-200">{user.email}</p>
            <p className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {sync.error ? (
                <><AlertTriangle size={12} className="text-red-500" /> Error de sincronización</>
              ) : sync.syncing ? (
                'Sincronizando…'
              ) : (
                `Sincronizado ${relativeTime(sync.lastSyncedAt)}`
              )}
            </p>
            {sync.error && (
              <p className="text-xs text-red-500 mt-1 font-mono break-all">{sync.error}</p>
            )}
          </div>
          {sync.error && !sync.syncing && (
            <Button variant="secondary" fullWidth onClick={() => void pushToCloud(user.id)}>
              <RefreshCw size={15} /> Reintentar sincronización
            </Button>
          )}
          <Button variant="secondary" fullWidth onClick={() => void signOut()}>
            Cerrar sesión
          </Button>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Cerrar sesión no borra los datos de este dispositivo. Para eliminarlos, usá "Borrar todos los datos" más abajo.
          </p>
        </div>
      ) : localOnly ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Estás usando la app sin cuenta. Tus datos se guardan solo en este dispositivo.
          </p>
          <Button fullWidth onClick={() => void signOut()}>
            Iniciar sesión para sincronizar
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

export function SettingsPage({ settings, onUpdate, onDataChange }: SettingsPageProps) {
  function toggleRestDay(day: number) {
    const current = settings.restDays;
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day];
    onUpdate({ restDays: updated });
  }

  function toggleDarkMode() {
    const newMode = !settings.darkMode;
    onUpdate({ darkMode: newMode });
    if (newMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }

  return (
    <div className="space-y-6">
      <h1 className="mb-12 text-display text-content">Ajustes</h1>

      {/* Account & sync */}
      <AccountSection />

      {/* Weekly goal */}
      <Card>
        <h2 className="section-label mb-4">Objetivo semanal</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-300">Entrenamientos por semana:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdate({ weeklyGoal: Math.max(1, settings.weeklyGoal - 1) })}
              className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-content-muted transition-colors hover:bg-surface-3 hover:text-content"
            >
              −
            </button>
            <span className="w-8 text-center font-mono text-metric-lg text-content">
              {settings.weeklyGoal}
            </span>
            <button
              onClick={() => onUpdate({ weeklyGoal: Math.min(7, settings.weeklyGoal + 1) })}
              className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-content-muted transition-colors hover:bg-surface-3 hover:text-content"
            >
              +
            </button>
          </div>
        </div>
      </Card>

      {/* Rest days */}
      <Card>
        <h2 className="section-label mb-4">Días de descanso habituales</h2>
        <div className="flex gap-1.5">
          {DAY_NAMES.map((d, i) => (
            <button
              key={i}
              onClick={() => toggleRestDay(i)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                settings.restDays.includes(i)
                  ? 'bg-sea-500/15 text-sea-700 dark:text-sea-300 ring-1 ring-inset ring-sea-500/25'
                  : 'bg-surface-2 text-content-subtle hover:bg-surface-3'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </Card>

      {/* Streak options */}
      <Card>
        <h2 className="section-label mb-4">Racha</h2>
        <label className="flex items-start gap-3 cursor-pointer">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={settings.restDaysKeepStreak}
              onChange={e => onUpdate({ restDaysKeepStreak: e.target.checked })}
              className="sr-only"
            />
            <div
              onClick={() => onUpdate({ restDaysKeepStreak: !settings.restDaysKeepStreak })}
              className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${
                settings.restDaysKeepStreak ? 'bg-content' : 'bg-surface-3'
              }`}
            >
              <div className={`w-5 h-5 bg-canvas rounded-full shadow mt-0.5 transition-transform ${
                settings.restDaysKeepStreak ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
              }`} />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Los descansos mantienen la racha</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Los días marcados como descanso o descanso activo no rompen la racha.
            </p>
          </div>
        </label>
      </Card>

      {/* Dark mode */}
      <Card>
        <h2 className="section-label mb-4">Apariencia</h2>
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Modo oscuro</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Cambia el tema de la app</p>
          </div>
          <div
            onClick={toggleDarkMode}
            className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${
              settings.darkMode ? 'bg-content' : 'bg-surface-3'
            }`}
          >
            <div className={`w-5 h-5 bg-canvas rounded-full shadow mt-0.5 transition-transform ${
              settings.darkMode ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
            }`} />
          </div>
        </label>
      </Card>

      {/* Exercise references */}
      <Card>
        <h2 className="section-label mb-4">Referencias de ejercicios</h2>

        <div className="space-y-4">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Enriquecimiento automático</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Al crear o importar, completa descripción, músculos, instrucciones y referencia desde la base local.
              </p>
            </div>
            <Toggle checked={settings.autoEnrich} onChange={v => onUpdate({ autoEnrich: v })} />
          </label>

          <label className="flex items-center justify-between gap-3 cursor-not-allowed opacity-60">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Búsqueda externa automática</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Requiere un backend/serverless con API key (no configurado). Sin esto, la app usa la base local y la búsqueda manual.
              </p>
            </div>
            <Toggle checked={settings.externalSearch} onChange={() => { /* gated until backend exists */ }} />
          </label>

          <p className="text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700 pt-3">
            Los ejercicios se completan automáticamente desde la base local al crearlos o importarlos. Nunca se pisan links ni datos cargados a mano.
          </p>
        </div>
      </Card>

      {/* Data management */}
      <Card>
        <h2 className="section-label mb-4">Datos</h2>
        <DataManagement onDataChange={onDataChange} />
      </Card>

      {/* About */}
      <div className="flex flex-col items-center py-4 text-xs text-gray-400 dark:text-gray-600">
        <Wordmark className="mb-2 text-lg" />
        <p>v1.1</p>
        <p className="mt-1">Todos los datos se guardan en tu dispositivo.</p>
      </div>
    </div>
  );
}
