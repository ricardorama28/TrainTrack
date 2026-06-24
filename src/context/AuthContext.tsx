import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { pullFromCloud, pushToCloud, cloudHasData, resetSyncState } from '../lib/cloudSync';
import { storage } from '../lib/storage';

const LOCAL_ONLY_KEY = 'traintrack_local_only';

/** Pending data-migration decision surfaced to the UI after sign-in (only when both sides have data). */
export type MigrationPrompt = { kind: 'caseC'; userId: string };

export type MigrationChoice =
  | 'use-cloud' // replace local with cloud
  | 'upload-local' // replace cloud with local
  | 'keep-local'; // do nothing now; auto-sync picks it up later

interface AuthContextValue {
  configured: boolean;
  user: User | null;
  loading: boolean;
  localOnly: boolean;
  migrationPrompt: MigrationPrompt | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  enterLocalOnly: () => void;
  resolveMigration: (choice: MigrationChoice) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [localOnly, setLocalOnly] = useState(
    () => localStorage.getItem(LOCAL_ONLY_KEY) === 'true',
  );
  const [migrationPrompt, setMigrationPrompt] = useState<MigrationPrompt | null>(null);

  // Track which user id we already ran migration for, so token refreshes
  // (which re-fire onAuthStateChange) don't repeat the migration.
  const migratedFor = useRef<string | null>(null);

  const runMigration = useCallback(async (userId: string) => {
    const localHas = storage.hasLocalData();
    const cloudHas = await cloudHasData(userId);

    if (cloudHas && !localHas) {
      await pullFromCloud(userId); // Case B: cloud → local, silent
    } else if (!cloudHas && localHas) {
      await pushToCloud(userId); // Case A: local → cloud, automatic (no prompt)
    } else if (cloudHas && localHas) {
      setMigrationPrompt({ kind: 'caseC', userId }); // Case C: conflict, ask
    }
    // both empty → nothing to do
  }, []);

  useEffect(() => {
    if (!supabase) return;

    // Initial session check
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Single source of truth for auth state (covers email/password AND Google).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setLoading(false);

      if (nextUser) {
        // Run migration once per real sign-in, not on token refresh.
        if (migratedFor.current !== nextUser.id) {
          migratedFor.current = nextUser.id;
          void runMigration(nextUser.id);
        }
      } else {
        migratedFor.current = null;
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [runMigration]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase no está configurado.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase no está configurado.');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) throw new Error('Supabase no está configurado.');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    // NOTE: localStorage is intentionally preserved as a local cache.
    resetSyncState();
    migratedFor.current = null;
    // Leaving local-only mode disabled so the auth screen shows again.
    localStorage.removeItem(LOCAL_ONLY_KEY);
    setLocalOnly(false);
  }, []);

  const enterLocalOnly = useCallback(() => {
    localStorage.setItem(LOCAL_ONLY_KEY, 'true');
    setLocalOnly(true);
  }, []);

  const resolveMigration = useCallback(async (choice: MigrationChoice) => {
    const prompt = migrationPrompt;
    setMigrationPrompt(null);
    if (!prompt) return;
    switch (choice) {
      case 'upload-local':
        await pushToCloud(prompt.userId);
        break;
      case 'use-cloud':
        await pullFromCloud(prompt.userId);
        break;
      case 'keep-local':
        break;
    }
  }, [migrationPrompt]);

  const value: AuthContextValue = {
    configured: isSupabaseConfigured,
    user,
    loading,
    localOnly,
    migrationPrompt,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    enterLocalOnly,
    resolveMigration,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
