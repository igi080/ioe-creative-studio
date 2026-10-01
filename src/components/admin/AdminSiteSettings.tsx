import React, { useState, useEffect } from 'react';
import { SiteSetting } from '../../types';
import { getSupabase } from '../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface SettingsFieldProps {
  key?: string;
  label: string;
  settingKey: string;
  type: 'text' | 'textarea' | 'image';
  value: string;
  onChange: (key: string, value: string) => void;
  onUpload: (key: string, file: File) => void;
  isUploading: boolean;
}

function SettingsField({
  label,
  settingKey,
  type,
  value,
  onChange,
  onUpload,
  isUploading
}: SettingsFieldProps) {
  const inputId = `setting-${settingKey}`;
  return (
    <div className="mb-4">
      <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700 mb-1">
        {label}
      </label>
      {type === 'text' && (
        <input
          id={inputId}
          type="text"
          className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={value}
          onChange={e => onChange(settingKey, e.target.value)}
        />
      )}
      {type === 'textarea' && (
        <textarea
          id={inputId}
          rows={3}
          className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={value}
          onChange={e => onChange(settingKey, e.target.value)}
        />
      )}
      {type === 'image' && (
        <div className="flex items-center space-x-4">
          <input
            id={inputId}
            type="text"
            className="flex-grow border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={value}
            onChange={e => onChange(settingKey, e.target.value)}
            placeholder="https://..."
          />
          <input
            id={`${inputId}-file`}
            type="file"
            accept="image/*"
            onChange={e => e.target.files?.[0] && onUpload(settingKey, e.target.files[0])}
            disabled={isUploading}
            className="block w-48 text-sm text-slate-500 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-700 cursor-pointer"
          />
          {isUploading && <span className="text-sm text-blue-600">Uploading...</span>}
        </div>
      )}
    </div>
  );
}

export function AdminSiteSettings({ category, setError, showSuccess }: { category: string, setError: (msg: string | null) => void, showSuccess: (msg: string) => void }) {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [uploadingKeys, setUploadingKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSettings();
  }, [category]);

  const fetchSettings = async () => {
    setLoading(true);
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('site_settings').select('*').eq('category', category);
      if (error) throw error;
      setSettings(data || []);
      const initialValues: Record<string, string> = {};
      data?.forEach(s => {
        initialValues[s.setting_key] = s.setting_value;
      });
      setFormValues(initialValues);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = React.useCallback((key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const uploadImage = React.useCallback(async (key: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be smaller than 5MB");
      return;
    }
    setUploadingKeys(prev => ({ ...prev, [key]: true }));
    setError(null);
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error("No supabase instance");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Authentication error");

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
      const uniqueName = `${category}/${uuidv4()}-${sanitizedName}`;

      const urlResponse = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ filename: uniqueName, contentType: file.type })
      });
      if (!urlResponse.ok) throw new Error("Failed to generate upload URL");
      
      const { uploadUrl, publicUrl } = await urlResponse.json();
      
      const uploadResponse = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!uploadResponse.ok) throw new Error("Failed to upload to R2");
      
      if (publicUrl) {
        setFormValues(prev => ({ ...prev, [key]: publicUrl }));
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploadingKeys(prev => ({ ...prev, [key]: false }));
    }
  }, [category, setError]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const updates = Object.keys(formValues).map(key => {
        const existing = settings.find(s => s.setting_key === key);
        if (existing) {
          return supabase.from('site_settings').update({ setting_value: formValues[key], updated_at: new Date().toISOString() }).eq('setting_key', key);
        } else {
          return supabase.from('site_settings').insert([{ setting_key: key, setting_value: formValues[key], category }]);
        }
      });
      await Promise.all(updates);
      showSuccess(`${category} settings saved successfully.`);
      fetchSettings();
    } catch (err: any) {
      console.error(err);
      setError('Error saving settings: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to render correct fields based on category
  const renderField = (label: string, settingKey: string, type: 'text' | 'textarea' | 'image') => (
    <SettingsField
      key={settingKey}
      label={label}
      settingKey={settingKey}
      type={type}
      value={formValues[settingKey] || ''}
      onChange={handleChange}
      onUpload={uploadImage}
      isUploading={Boolean(uploadingKeys[settingKey])}
    />
  );

  const renderFields = () => {
    if (category === 'home') {
      return (
        <>
          {renderField("Hero Title (HTML supported)", "home_hero_title_html", "textarea")}
          {renderField("Hero Subtitle", "home_hero_subtitle", "textarea")}
          {renderField("Primary Button Text", "home_primary_btn_text", "text")}
          {renderField("Primary Button URL", "home_primary_btn_url", "text")}
          {renderField("Hero Background/Image URL", "home_hero_image", "image")}
        </>
      );
    }
    if (category === 'about') {
      return (
        <>
          {renderField("Name", "about_name", "text")}
          {renderField("Bio Intro", "about_bio_intro", "textarea")}
          {renderField("Bio Outro", "about_bio_outro", "textarea")}
          {renderField("Profile Image URL", "about_profile_image", "image")}
        </>
      );
    }
    if (category === 'contact') {
      return (
        <>
          {renderField("Business Email", "contact_email", "text")}
          {renderField("Phone Number", "contact_phone", "text")}
          {renderField("WhatsApp Number", "contact_whatsapp", "text")}
          {renderField("Address", "contact_address", "text")}
          {renderField("Facebook URL", "social_facebook", "text")}
          {renderField("Instagram URL", "social_instagram", "text")}
          {renderField("LinkedIn URL", "social_linkedin", "text")}
          {renderField("YouTube URL", "social_youtube", "text")}
        </>
      );
    }
    if (category === 'branding') {
      return (
        <>
          {renderField("Site Title / Brand Name", "site_name", "text")}
          {renderField("Logo Image URL", "brand_logo", "image")}
          {renderField("Favicon URL", "brand_favicon", "image")}
          {renderField("Footer Description", "footer_description", "textarea")}
        </>
      );
    }
    return <p>Select a valid category.</p>;
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading settings...</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-6 capitalize">{category} Settings</h2>
      <form onSubmit={handleSave}>
        {renderFields()}
        <div className="flex justify-end mt-6 pt-4 border-t border-slate-200">
          <button type="submit" disabled={isSaving} className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50">
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
