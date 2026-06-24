import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthPage } from '../../pages/AuthPage';
import { SyncConflictModal } from '../sync/SyncConflictModal';

/**
 * Gates the app behind authentication when Supabase is configured.
 * - Not configured → app runs fully local-only (no gate).
 * - Configured + (signed in OR local-only mode) → render the app.
 * - Otherwise → show the auth screen.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { configured, user, loading, localOnly } = useAuth();

  if (!configured) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-400 dark:text-gray-500 text-sm">Cargando…</div>
      </div>
    );
  }

  if (!user && !localOnly) return <AuthPage />;

  return (
    <>
      {children}
      <SyncConflictModal />
    </>
  );
}
