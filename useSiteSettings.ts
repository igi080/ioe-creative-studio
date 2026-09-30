import { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabase';

export function useSiteSettings(category?: string) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      const supabase = getSupabase();
      if (!supabase) return;
      try {
        let query = supabase.from('site_settings').select('*');
        if (category) {
          query = query.eq('category', category);
        }
        const { data, error } = await query;
        if (error) throw error;
        
        const settingsMap: Record<string, string> = {};
        data?.forEach(s => {
          settingsMap[s.setting_key] = s.setting_value;
        });
        setSettings(settingsMap);
      } catch (err) {
        console.error('Error fetching site settings:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSettings();
  }, [category]);

  return { settings, loading };
}
