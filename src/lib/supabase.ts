import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Normalize Supabase URL so trailing slashes and unintended /rest/v1 paths are cleanly stripped
function normalizeSupabaseUrl(url?: string): string {
  if (!url) return '';
  let cleaned = url.trim().replace(/\/+$/, '');
  // Ensure the Supabase URL is the project URL, not a REST endpoint ending in /rest/v1/ or /rest/v1
  if (cleaned.endsWith('/rest/v1')) {
    cleaned = cleaned.slice(0, -'/rest/v1'.length).replace(/\/+$/, '');
  }
  return cleaned;
}

// Support primary standardized names with secondary aliases for maximum deployment compatibility
const rawSupabaseUrl = 
  (import.meta.env.VITE_SUPABASE_URL || 
   (import.meta.env as any).VITE_PUBLIC_SUPABASE_URL || 
   (import.meta.env as any).SUPABASE_URL || 
   '').trim();

const rawSupabaseKey = 
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
   (import.meta.env as any).VITE_SUPABASE_ANON_KEY || 
   (import.meta.env as any).VITE_PUBLIC_SUPABASE_ANON_KEY || 
   (import.meta.env as any).SUPABASE_ANON_KEY || 
   '').trim();

const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);
const supabasePublishableKey = rawSupabaseKey;

let supabaseInstance: SupabaseClient | null = null;

/**
 * Resilient fetch wrapper designed to handle PostgREST clock drift (PGRST303: "JWT issued at future")
 * and intermittent Supabase API gateway synchronization discrepancies.
 */
const resilientFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit,
  attempt = 0
): Promise<Response> => {
  try {
    const response = await fetch(input, init);

    // If 401 Unauthorized occurs, check if it's due to JWT clock skew (PGRST303)
    if (response.status === 401) {
      try {
        const cloned = response.clone();
        const json = await cloned.json();
        const isClockSkew =
          json?.code === 'PGRST303' ||
          (typeof json?.message === 'string' &&
            (json.message.toLowerCase().includes('jwt issued at future') ||
             json.message.toLowerCase().includes('clock skew')));

        if (isClockSkew) {
          // Retry with progressive delay so the gateway / PostgREST node clock drift clears
          if (attempt < 3) {
            const delay = 350 * (attempt + 1);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return resilientFetch(input, init, attempt + 1);
          }

          // If repeated clock skew occurs and an Authorization header was attached,
          // retry using the publishable/anon key directly without the desynchronized user JWT
          // so public table reads (testimonials, services, portfolio, settings) succeed.
          if (init?.headers) {
            const headers = new Headers(init.headers);
            if (headers.has('authorization') || headers.has('Authorization')) {
              headers.delete('authorization');
              headers.delete('Authorization');
              return fetch(input, { ...init, headers });
            }
          }
        }
      } catch {
        // If response body is not JSON or cannot be cloned, return response
      }
    }

    return response;
  } catch (networkError) {
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return resilientFetch(input, init, attempt + 1);
    }
    throw networkError;
  }
};

// We export a function to get the client, so we can throw a clear error if used without keys
export const getSupabase = () => {
  if (!supabaseUrl || !supabasePublishableKey) {
    console.warn('Supabase credentials not found. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set.');
    return null;
  }

  if (!supabaseInstance) {
    // The modern Supabase SDK fully supports the new sb_publishable_... keys as the second parameter
    supabaseInstance = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        fetch: resilientFetch,
      },
    });
  }

  return supabaseInstance;
};

