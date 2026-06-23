import { useState, useCallback } from 'react';
import { storage } from '../lib/storage';
import type { Settings } from '../types';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => storage.getSettings());

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    const current = storage.getSettings();
    const updated = { ...current, ...updates };
    storage.setSettings(updated);
    setSettings(updated);
    return updated;
  }, []);

  const refresh = useCallback(() => {
    setSettings(storage.getSettings());
  }, []);

  return { settings, updateSettings, refresh };
}
