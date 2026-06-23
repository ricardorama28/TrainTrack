import { useState, useCallback } from 'react';
import { storage } from '../lib/storage';
import type { WorkoutLog } from '../types';

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useWorkouts() {
  const [logs, setLogs] = useState<WorkoutLog[]>(() => storage.getWorkoutLogs());

  const save = useCallback((updated: WorkoutLog[]) => {
    storage.setWorkoutLogs(updated);
    setLogs(updated);
  }, []);

  const addOrUpdateLog = useCallback((log: Omit<WorkoutLog, 'id'> & { id?: string }) => {
    const current = storage.getWorkoutLogs();
    const existing = current.findIndex(l => l.date === log.date);
    let updated: WorkoutLog[];
    if (existing >= 0) {
      updated = current.map((l, i) =>
        i === existing ? { ...log, id: l.id } : l
      );
    } else {
      updated = [...current, { ...log, id: log.id ?? newId() }];
    }
    save(updated);
  }, [save]);

  const deleteLog = useCallback((id: string) => {
    save(storage.getWorkoutLogs().filter(l => l.id !== id));
  }, [save]);

  const getLogByDate = useCallback((date: string): WorkoutLog | undefined => {
    return logs.find(l => l.date === date);
  }, [logs]);

  const refresh = useCallback(() => {
    setLogs(storage.getWorkoutLogs());
  }, []);

  return { logs, addOrUpdateLog, deleteLog, getLogByDate, refresh };
}
