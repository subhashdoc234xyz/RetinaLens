import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  const url =
    ((import.meta as any).env?.VITE_SUPABASE_URL as string) ||
    ((import.meta as any).env?.SUPABASE_URL as string) ||
    '';
  const anonKey =
    ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) ||
    ((import.meta as any).env?.SUPABASE_ANON_KEY as string) ||
    '';

  const isConfigured = Boolean(url && anonKey && url.startsWith('http'));
  return { url, anonKey, isConfigured };
}

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) {
    console.warn('[RetinaLens] Supabase NOT configured. URL:', url ? '✓' : '✗', 'AnonKey:', anonKey ? '✓' : '✗');
    return null;
  }

  if (!supabaseClient) {
    try {
      console.log('[RetinaLens] Initializing Supabase client with URL:', url);
      supabaseClient = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      console.log('[RetinaLens] Supabase client created successfully');
    } catch (err) {
      console.warn('Could not initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseClient;
}

export function resetSupabaseClient(): void {
  supabaseClient = null;
}

