import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check 1 & Check 7: Strict environment variable check and TLS/SSL enforcement
function validateEnvironment(): { url: string; anonKey: string } {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    throw new Error(
      'CRITICAL CONFIGURATION ERROR: VITE_SUPABASE_URL is not set in environment variables. Application refused to start.'
    );
  }

  if (rawUrl.includes('your-project-ref')) {
    throw new Error(
      'CRITICAL CONFIGURATION ERROR: VITE_SUPABASE_URL is set to default placeholder "your-project-ref". Please configure a valid URL.'
    );
  }

  if (!rawUrl.startsWith('https://')) {
    throw new Error(
      'CRITICAL SECURITY ERROR: VITE_SUPABASE_URL must use encrypted TLS/SSL (https://). Plain http connections are forbidden in production.'
    );
  }

  if (!rawAnonKey || typeof rawAnonKey !== 'string' || !rawAnonKey.trim()) {
    throw new Error(
      'CRITICAL CONFIGURATION ERROR: VITE_SUPABASE_ANON_KEY is not set in environment variables. Application refused to start.'
    );
  }

  if (rawAnonKey.includes('your-anon-or-publishable-key')) {
    throw new Error(
      'CRITICAL CONFIGURATION ERROR: VITE_SUPABASE_ANON_KEY is set to default placeholder. Please configure a valid API key.'
    );
  }

  return { url: rawUrl.trim(), anonKey: rawAnonKey.trim() };
}

const { url: supabaseUrl, anonKey: supabaseAnonKey } = validateEnvironment();

export { supabaseUrl, supabaseAnonKey };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
