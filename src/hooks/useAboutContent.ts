import { useState, useEffect } from 'react';
import { AboutContent } from '../types';
import { getSupabase } from '../lib/supabase';

export function useAboutContent() {
  const [sections, setSections] = useState<Record<string, AboutContent>>({});
  const [sectionsList, setSectionsList] = useState<AboutContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      const supabase = getSupabase();
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('about_content')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        const mapped = (data || []).reduce((acc: Record<string, AboutContent>, section) => {
          const key = section.section_key;
          if (key) {
            acc[key] = section;
            acc[key.toLowerCase()] = section;
          }
          return acc;
        }, {});
        
        setSections(mapped);
        setSectionsList(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  return { sections, sectionsList, loading, error };
}
