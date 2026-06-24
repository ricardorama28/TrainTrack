import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Whether Supabase credentials are present. When false the app runs fully
 * local-only (no auth UI, no cloud sync) so it never breaks without a backend.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Supabase client. Null when not configured — callers must guard with
 * `isSupabaseConfigured` before use.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // needed for the OAuth (Google) redirect
      },
    })
  : null;
