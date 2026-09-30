import { useState, useEffect } from 'react';
import { HomeSection } from '../types';
import { getSupabase } from '../lib/supabase';

export function useHomeSections() {
  const [sections, setSections] = useState<Record<string, HomeSection>>({});
  const [sectionsList, setSectionsList] = useState<HomeSection[]>([]);
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
          .from('home_sections')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        
        if (error) throw error;
        
        const list = data || [];
        const mapped = list.reduce((acc: Record<string, HomeSection>, section) => {
          acc[section.section_key] = section;
          return acc;
        }, {});
        
        setSections(mapped);
        setSectionsList(list);
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
