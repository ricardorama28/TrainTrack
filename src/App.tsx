import { useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/ui/BottomNav';
import { Dashboard } from './pages/Dashboard';
import { CalendarPage } from './pages/CalendarPage';
import { RoutinesPage } from './pages/RoutinesPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { SettingsPage } from './pages/SettingsPage';
import { useWorkouts } from './hooks/useWorkouts';
import { useRoutines } from './hooks/useRoutines';
import { useExercises } from './hooks/useExercises';
import { useSettings } from './hooks/useSettings';
import { storage } from './lib/storage';
import { buildSampleData } from './lib/sampleData';

export default function App() {
  const { logs, addOrUpdateLog, deleteLog, refresh: refreshLogs } = useWorkouts();
  const { routines, addRoutine, updateRoutine, deleteRoutine, duplicateRoutine, refresh: refreshRoutines } = useRoutines();
  const { exercises, getOrCreate, updateExercise, refresh: refreshExercises } = useExercises();
  const { settings, updateSettings, refresh: refreshSettings } = useSettings();

  // Load sample data on first run (routines + derived exercise library)
  useEffect(() => {
    if (!storage.isInitialized()) {
      const { routines: sampleRoutines, exercises: sampleExercises } = buildSampleData();
      storage.setRoutines(sampleRoutines);
      storage.setExercises(sampleExercises);
      storage.markInitialized();
      refreshRoutines();
      refreshExercises();
    }
  }, []);

  // Apply dark mode on mount and when it changes
  useEffect(() => {
    if (settings.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [settings.darkMode]);

  const handleDataChange = useCallback(() => {
    refreshLogs();
    refreshRoutines();
    refreshExercises();
    refreshSettings();
  }, [refreshLogs, refreshRoutines, refreshExercises, refreshSettings]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="page-container">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  logs={logs}
                  routines={routines}
                  settings={settings}
                />
              }
            />
            <Route
              path="/calendar"
              element={
                <CalendarPage
                  logs={logs}
                  routines={routines}
                  onSaveLog={addOrUpdateLog}
                  onDeleteLog={deleteLog}
                />
              }
            />
            <Route
              path="/routines"
              element={
                <RoutinesPage
                  routines={routines}
                  onAdd={addRoutine}
                  onUpdate={updateRoutine}
                  onDelete={deleteRoutine}
                  onDuplicate={duplicateRoutine}
                  getOrCreateExercise={getOrCreate}
                />
              }
            />
            <Route
              path="/exercises"
              element={
                <ExercisesPage
                  logs={logs}
                  routines={routines}
                  exercises={exercises}
                  onUpdateExercise={updateExercise}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <SettingsPage
                  settings={settings}
                  onUpdate={updateSettings}
                  onDataChange={handleDataChange}
                />
              }
            />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
