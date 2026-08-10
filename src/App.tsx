import { useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/ui/BottomNav';
import { Dashboard } from './pages/Dashboard';
import { CalendarPage } from './pages/CalendarPage';
import { RoutinesPage } from './pages/RoutinesPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';
import { useWorkouts } from './hooks/useWorkouts';
import { useRoutines } from './hooks/useRoutines';
import { useExercises } from './hooks/useExercises';
import { useSettings } from './hooks/useSettings';
import { storage } from './lib/storage';
import { buildSampleData } from './lib/sampleData';
import { enrichExerciseFromKnowledgeBase } from './lib/enrichExercise';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthGate } from './components/auth/AuthGate';
import { schedulePush } from './lib/cloudSync';

function AppShell() {
  const { logs, addOrUpdateLog, deleteLog, refresh: refreshLogs } = useWorkouts();
  const { routines, addRoutine, updateRoutine, deleteRoutine, duplicateRoutine, moveRoutine, refresh: refreshRoutines } = useRoutines();
  const { exercises, getOrCreate, updateExercise, enrichExisting, refresh: refreshExercises } = useExercises();
  const { settings, updateSettings, refresh: refreshSettings } = useSettings();
  const { user } = useAuth();

  // Load sample data on first run (routines + derived exercise library)
  useEffect(() => {
    if (!storage.isInitialized()) {
      const { routines: sampleRoutines, exercises: sampleExercises } = buildSampleData();
      storage.setRoutines(sampleRoutines);
      // Enrich sample library from the local knowledge base on first run.
      storage.setExercises(sampleExercises.map(enrichExerciseFromKnowledgeBase));
      storage.markInitialized();
      refreshRoutines();
      refreshExercises();
    }
  }, []);

  // Keep the exercise library enriched automatically from the local knowledge
  // base. enrichExisting only fills empty fields, never overwrites manual/
  // accepted references, and only saves when something changed — so it's
  // idempotent and converges (no loop). Runs on mount and whenever the
  // exercise list changes (e.g. after a cloud pull brings un-enriched data).
  useEffect(() => {
    enrichExisting();
  }, [exercises, enrichExisting]);

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

  // Keep the UI in sync with local writes (including those from a cloud pull),
  // and push local changes to the cloud when signed in (debounced; a pull
  // suppresses the push internally to avoid a feedback loop).
  useEffect(() => {
    return storage.onChange(() => {
      handleDataChange();
      if (user) schedulePush(user.id);
    });
  }, [user, handleDataChange]);

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
                  exercises={exercises}
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
                  exercises={exercises}
                  logs={logs}
                  onAdd={addRoutine}
                  onUpdate={updateRoutine}
                  onDelete={deleteRoutine}
                  onDuplicate={duplicateRoutine}
                  onMove={moveRoutine}
                  getOrCreateExercise={getOrCreate}
                  onSaveLog={addOrUpdateLog}
                  autoEnrich={settings.autoEnrich}
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
              path="/progreso"
              element={
                <ProgressPage
                  logs={logs}
                  exercises={exercises}
                  settings={settings}
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

export default function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <AppShell />
      </AuthGate>
    </AuthProvider>
  );
}
