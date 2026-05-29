import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (import.meta.env.DEV && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error(
    'Missing Supabase environment variables. Copy .env.example to apps/web/.env and fill in your values.',
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      /* Persistent login: session is written to localStorage on every
       * change, restored on app boot. In Electron this lives under
       * %APPDATA%/tenK/ so it survives across launches. Cleared only by
       * an explicit supabase.auth.signOut(). */
      persistSession:     true,
      autoRefreshToken:   true,
      detectSessionInUrl: true,
      storage:            typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey:         'tenk-auth',
      flowType:           'pkce',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  },
);
