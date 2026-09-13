import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

let runtimeUrl = '';
let runtimeAnonKey = '';

export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  const url =
    ((import.meta as any).env?.VITE_SUPABASE_URL as string) ||
    ((import.meta as any).env?.SUPABASE_URL as string) ||
    runtimeUrl ||
    (typeof window !== 'undefined' ? sessionStorage.getItem('retinalens_sb_url') || '' : '') ||
    '';
  const anonKey =
    ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) ||
    ((import.meta as any).env?.SUPABASE_ANON_KEY as string) ||
    runtimeAnonKey ||
    (typeof window !== 'undefined' ? sessionStorage.getItem('retinalens_sb_key') || '' : '') ||
    '';

  const isConfigured = Boolean(url && anonKey && url.startsWith('http'));
  return { url, anonKey, isConfigured };
}

export async function ensureSupabaseClient(): Promise<SupabaseClient | null> {
  let client = getSupabase();
  if (client) return client;

  try {
    const res = await fetch('/api/auth-config');
    if (res.ok) {
      const data = await res.json();
      if (data.supabaseUrl && data.supabaseAnonKey) {
        runtimeUrl = data.supabaseUrl;
        runtimeAnonKey = data.supabaseAnonKey;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('retinalens_sb_url', runtimeUrl);
          sessionStorage.setItem('retinalens_sb_key', runtimeAnonKey);
        }
        return getSupabase();
      }
    }
  } catch (err) {
    console.warn('[RetinaLens] Failed to fetch auth config from server:', err);
  }

  return getSupabase();
}

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) {
    return null;
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
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

