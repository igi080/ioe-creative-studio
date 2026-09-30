import { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabase';
import { LegalPolicy } from '../types';

export function useLegalPolicy(slug: string) {
  const [policy, setPolicy] = useState<LegalPolicy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchPolicy() {
      if (!slug) {
        if (isMounted) {
          setPolicy(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const supabase = getSupabase();
        if (!supabase) {
          throw new Error('Database client configuration is missing');
        }

        const { data, error: queryError } = await supabase
          .from('legal_policies')
          .select('*')
          .eq('slug', slug.trim())
          .maybeSingle();

        if (queryError) {
          console.error(`Error fetching legal policy "${slug}":`, queryError);
          throw queryError;
        }

        if (isMounted) {
          // If document does not exist OR is_published is false, treat as offline
          if (!data || !data.is_published) {
            setPolicy(null);
          } else {
            setPolicy(data as LegalPolicy);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn(`Failed to retrieve policy "${slug}":`, err.message);
          setError(err.message || 'Failed to load policy');
          setPolicy(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchPolicy();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return { policy, loading, error };
}
