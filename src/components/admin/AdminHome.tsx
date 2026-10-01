import React, { useState, useEffect } from 'react';
import { HomeSection } from '../../types';
import { getSupabase } from '../../lib/supabase';
import { Edit2, Eye, EyeOff, Check, X, Image as ImageIcon, Plus, Trash2, AlertCircle } from 'lucide-react';

export function AdminHome({ setError, showSuccess }: { setError: (msg: string | null) => void, showSuccess: (msg: string) => void }) {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState<Partial<HomeSection>>({});
  const [uploading, setUploading] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dbPermissionError, setDbPermissionError] = useState<string | null>(null);

  const fetchSections = async () => {
    setLoading(true);
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('home_sections')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) {
        if (error.code === '42501' || error.message.includes('permission denied')) {
          setDbPermissionError('permission denied for table home_sections');
        }
        throw error;
      }
      
      setDbPermissionError(null);
      setSections(data || []);
    } catch (err: any) {
      console.error('Error fetching home sections:', err);
      setError(err.message || 'Error fetching home sections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error("Supabase client not initialized");
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ filename: `home/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`, contentType: file.type })
      });
      if (!response.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, publicUrl } = await response.json();
      const uploadRes = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!uploadRes.ok) throw new Error('Failed to upload image file to storage');
      setCurrent(prev => ({ ...prev, image: publicUrl }));
      showSuccess("Image uploaded successfully");
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const supabase = getSupabase();
    if (!supabase) {
      setError('Database client not initialized');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        section_key: (current.section_key || `section_${Date.now()}`).trim(),
        title: current.title?.trim() || null,
        subtitle: current.subtitle?.trim() || null,
        content: current.content?.trim() || null,
        button_text: current.button_text?.trim() || null,
        button_url: current.button_url?.trim() || null,
        image: current.image || null,
        is_active: current.is_active ?? true,
        display_order: Number(current.display_order) || 0,
        updated_at: new Date().toISOString()
      };

      if (current.id) {
        const { data, error } = await supabase
          .from('home_sections')
          .update(payload)
          .eq('id', current.id)
          .select();
        
        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error('Update failed: Record not found or blocked by Row Level Security (RLS).');
        }
        showSuccess("Section updated successfully");
      } else {
        const { data, error } = await supabase
          .from('home_sections')
          .insert([payload])
          .select();
        
        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error('Insert failed: Blocked by Row Level Security (RLS).');
        }
        showSuccess("Section added successfully");
      }
      setIsEditing(false);
      setCurrent({});
      await fetchSections();
    } catch (err: any) {
      console.error('Error saving home section:', err);
      setError(err.message || "Error saving section");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (item: HomeSection) => {
    setError(null);
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const nextStatus = !item.is_active;
      const { data, error } = await supabase
        .from('home_sections')
        .update({ is_active: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', item.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Status update failed: Blocked by Row Level Security (RLS).');
      }
      setSections(prev => prev.map(s => s.id === item.id ? { ...s, is_active: nextStatus } : s));
      showSuccess(`Section marked as ${nextStatus ? 'Active' : 'Hidden'}`);
    } catch (err: any) {
      console.error('Error updating section status:', err);
      setError(err.message || 'Error updating status');
    }
  };

  const executeDelete = async () => {
    if (!sectionToDelete) return;
    const id = sectionToDelete;
    setDeleting(true);
    setError(null);
    const supabase = getSupabase();
    if (!supabase) {
      setError('Database client not initialized');
      setDeleting(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('home_sections')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Deletion failed: Record not found or blocked by Row Level Security (RLS).');
      }
      setSections(prev => prev.filter(s => s.id !== id));
      showSuccess("Section deleted successfully");
      setSectionToDelete(null);
      await fetchSections();
    } catch (err: any) {
      console.error('Error deleting section:', err);
      setError(err.message || "Error deleting section");
    } finally {
      setDeleting(false);
      setSectionToDelete(null);
    }
  };

  if (loading && !isEditing && sections.length === 0) {
    return <div className="p-8 text-center text-slate-500">Loading home sections...</div>;
  }

  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{current.id ? 'Edit Section' : 'Add Section'}</h2>
          <button 
            type="button"
            onClick={() => { setIsEditing(false); setCurrent({}); }} 
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Section Key (e.g. hero, cta) *</label>
              <input 
                required 
                type="text" 
                value={current.section_key || ''} 
                onChange={e => setCurrent({...current, section_key: e.target.value})} 
                placeholder="e.g. hero, cta, features"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none" 
              />
              <p className="text-xs text-slate-500 mt-1">Use 'hero' to override home banner, 'cta' to override bottom banner, or a custom identifier.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Display Order</label>
              <input 
                type="number" 
                value={current.display_order ?? 0} 
                onChange={e => setCurrent({...current, display_order: parseInt(e.target.value) || 0})} 
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input 
                type="text" 
                value={current.title || ''} 
                onChange={e => setCurrent({...current, title: e.target.value})} 
                placeholder="Section title"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subtitle</label>
              <input 
                type="text" 
                value={current.subtitle || ''} 
                onChange={e => setCurrent({...current, subtitle: e.target.value})} 
                placeholder="Section subtitle"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Content / Description</label>
              <textarea 
                value={current.content || ''} 
                onChange={e => setCurrent({...current, content: e.target.value})} 
                rows={4} 
                placeholder="Detailed text or content for this section"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Button Text</label>
              <input 
                type="text" 
                value={current.button_text || ''} 
                onChange={e => setCurrent({...current, button_text: e.target.value})} 
                placeholder="e.g. START A PROJECT"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Button URL</label>
              <input 
                type="text" 
                value={current.button_url || ''} 
                onChange={e => setCurrent({...current, button_url: e.target.value})} 
                placeholder="e.g. /contact or https://..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Section Image</label>
              <div className="flex items-center space-x-4">
                {current.image && (
                  <div className="relative group">
                    <img src={current.image} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-slate-200" />
                    <button
                      type="button"
                      onClick={() => setCurrent({ ...current, image: undefined })}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700 transition"
                      title="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={uploadImage} 
                    disabled={uploading} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                  <div className={`px-4 py-2 border border-slate-300 rounded-lg flex items-center justify-center space-x-2 ${uploading ? 'bg-slate-100' : 'bg-white hover:bg-slate-50'}`}>
                    <ImageIcon className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">{uploading ? 'Uploading to R2...' : 'Choose Image'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={current.is_active ?? true} 
                  onChange={e => setCurrent({...current, is_active: e.target.checked})} 
                  className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4" 
                />
                <span className="text-sm text-slate-700 font-medium">Active (Visible on Website)</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => { setIsEditing(false); setCurrent({}); }}
              className="px-5 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving || uploading} 
              className="bg-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-700 transition disabled:opacity-50 flex items-center"
            >
              {saving ? 'Saving...' : 'Save Section'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Manage Home Sections</h2>
          <p className="text-sm text-slate-500">Configure content sections, banners, and call-to-action blocks for the homepage.</p>
        </div>
        <button 
          onClick={() => { 
            setCurrent({ is_active: true, display_order: sections.length + 1 }); 
            setIsEditing(true); 
          }} 
          className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-teal-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Section
        </button>
      </div>

      {dbPermissionError && (
        <div className="mb-6 bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-800 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Supabase Permission Notice: "permission denied for table home_sections"</p>
            <p className="mt-1 text-amber-700">
              The PostgreSQL role lacks table privileges or RLS policies for <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">home_sections</code>.
              To apply the required privileges, run the script in <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">FIX_HOME_SECTIONS_PERMISSIONS.sql</code> in your Supabase SQL Editor.
            </p>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Section Key & Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[170px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sections.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {item.image ? (
                        <img className="h-10 w-10 rounded-lg object-cover border border-slate-200" src={item.image} alt={item.title || item.section_key} />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-slate-900">{item.section_key}</div>
                        <div className="text-sm text-slate-500 truncate max-w-[240px]">{item.title || '(No title)'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleStatus(item)}
                      title="Click to toggle status"
                      className="inline-flex items-center transition hover:opacity-80 focus:outline-none cursor-pointer"
                    >
                      {item.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3 mr-1" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          <EyeOff className="w-3 h-3 mr-1" /> Hidden
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                    {item.display_order}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium min-w-[170px]">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        type="button"
                        onClick={() => { setCurrent(item); setIsEditing(true); }} 
                        className="inline-flex items-center justify-center px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-300 rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                        title="Edit section"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                        <span>Edit</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setSectionToDelete(item.id)} 
                        className="inline-flex items-center justify-center px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                        title="Delete section"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sections.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500">
                    <div className="max-w-sm mx-auto">
                      <p className="font-medium text-slate-700 mb-1">No home sections found</p>
                      <p className="text-slate-400 text-xs mb-4">Add your first section (e.g. 'hero' or 'cta') to customize the homepage.</p>
                      <button 
                        onClick={() => { setCurrent({ is_active: true, display_order: 1 }); setIsEditing(true); }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-xs font-medium rounded-lg text-white bg-teal-600 hover:bg-teal-700 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 mr-1.5" /> Add Section
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safe Custom Delete Confirmation Modal (Iframe-Safe, avoids window.confirm) */}
      {sectionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Section</h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete this home section? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setSectionToDelete(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={executeDelete}
                className="px-5 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
