import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client conditionally based on the presence of environment variables.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

let supabaseInstance: any = null;

// We export a function to get the client, so we can throw a clear error if used without keys
export const getSupabase = () => {
  if (!supabaseUrl || !supabasePublishableKey) {
    console.warn('Supabase credentials not found. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set.');
    return null;
  }
  
  if (!supabaseInstance) {
    // The modern Supabase SDK fully supports the new sb_publishable_... keys as the second parameter
    supabaseInstance = createClient(supabaseUrl, supabasePublishableKey);
  }
  
  return supabaseInstance;
};
