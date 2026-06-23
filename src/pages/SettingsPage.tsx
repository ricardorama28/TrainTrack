import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DataManagement } from '../components/settings/DataManagement';
import type { Settings } from '../types';

interface SettingsPageProps {
  settings: Settings;
  onUpdate: (updates: Partial<Settings>) => void;
  onDataChange: () => void;
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

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
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ajustes</h1>

      {/* Weekly goal */}
      <Card>
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Objetivo semanal</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-300">Entrenamientos por semana:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdate({ weeklyGoal: Math.max(1, settings.weeklyGoal - 1) })}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              −
            </button>
            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400 w-8 text-center">
              {settings.weeklyGoal}
            </span>
            <button
              onClick={() => onUpdate({ weeklyGoal: Math.min(7, settings.weeklyGoal + 1) })}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              +
            </button>
          </div>
        </div>
      </Card>

      {/* Rest days */}
      <Card>
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Días de descanso habituales</h2>
        <div className="flex gap-1.5">
          {DAY_NAMES.map((d, i) => (
            <button
              key={i}
              onClick={() => toggleRestDay(i)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                settings.restDays.includes(i)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </Card>

      {/* Streak options */}
      <Card>
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Racha</h2>
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
                settings.restDaysKeepStreak ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-transform ${
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
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Apariencia</h2>
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Modo oscuro</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Cambia el tema de la app</p>
          </div>
          <div
            onClick={toggleDarkMode}
            className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${
              settings.darkMode ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-transform ${
              settings.darkMode ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
            }`} />
          </div>
        </label>
      </Card>

      {/* Data management */}
      <Card>
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Datos</h2>
        <DataManagement onDataChange={onDataChange} />
      </Card>

      {/* About */}
      <div className="text-center py-4 text-xs text-gray-400 dark:text-gray-600">
        <p>TrainTrack v1.0</p>
        <p className="mt-1">Todos los datos se guardan en tu dispositivo.</p>
      </div>
    </div>
  );
}
