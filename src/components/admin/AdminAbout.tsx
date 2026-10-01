import React, { useState, useEffect } from 'react';
import { AboutContent } from '../../types';
import { getSupabase } from '../../lib/supabase';
import { Edit2, X, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';

export function AdminAbout({ setError, showSuccess }: { setError: (msg: string) => void, showSuccess: (msg: string) => void }) {
  const [sections, setSections] = useState<AboutContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState<Partial<AboutContent>>({});
  const [uploading, setUploading] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<AboutContent | null>(null);

  const fetchSections = async () => {
    setLoading(true);
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('about_content')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setSections(data || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching about content');
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
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error("Supabase client not initialized");
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ filename: file.name, contentType: file.type })
      });
      if (!response.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, publicUrl } = await response.json();
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
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
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      if (current.id) {
        const { data, error } = await supabase
          .from('about_content')
          .update({
            section_key: current.section_key,
            title: current.title,
            subtitle: current.subtitle,
            content: current.content,
            image: current.image,
            updated_at: new Date().toISOString()
          })
          .eq('id', current.id)
          .select();
        if (error) throw error;
        showSuccess("Section updated successfully");
      } else {
        const { data, error } = await supabase
          .from('about_content')
          .insert([{
            section_key: current.section_key || `section_${Date.now()}`,
            title: current.title,
            subtitle: current.subtitle,
            content: current.content,
            image: current.image
          }])
          .select();
        if (error) throw error;
        showSuccess("Section added successfully");
      }
      setIsEditing(false);
      setCurrent({});
      fetchSections();
    } catch (err: any) {
      setError(err.message || "Error saving section");
    }
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('about_content')
        .delete()
        .eq('id', itemToDelete.id)
        .select();
      if (error) throw error;
      showSuccess("Section deleted successfully");
      setItemToDelete(null);
      fetchSections();
    } catch (err: any) {
      setError(err.message || "Error deleting section");
      setItemToDelete(null);
    }
  };

  if (loading && !isEditing) return <div className="p-8 text-center text-slate-500">Loading about content...</div>;

  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{current.id ? 'Edit About Section' : 'Add About Section'}</h2>
          <button 
            type="button" 
            onClick={() => { setIsEditing(false); setCurrent({}); }} 
            className="text-slate-500 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Section Key (e.g. bio, bio_outro, our_story) *</label>
              <input 
                required 
                type="text" 
                value={current.section_key || ''} 
                onChange={e => setCurrent({...current, section_key: e.target.value})} 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none" 
                placeholder="e.g. bio" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input 
                type="text" 
                value={current.title || ''} 
                onChange={e => setCurrent({...current, title: e.target.value})} 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none" 
                placeholder="Section Title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subtitle</label>
              <input 
                type="text" 
                value={current.subtitle || ''} 
                onChange={e => setCurrent({...current, subtitle: e.target.value})} 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none" 
                placeholder="Section Subtitle"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Content / Biography</label>
              <textarea 
                value={current.content || ''} 
                onChange={e => setCurrent({...current, content: e.target.value})} 
                rows={6} 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none" 
                placeholder="Detailed text content..."
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
                      onClick={() => setCurrent({...current, image: undefined})}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700 transition"
                      title="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="relative">
                  <input type="file" accept="image/*" onChange={uploadImage} disabled={uploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className={`px-4 py-2 border border-slate-300 rounded-lg flex items-center justify-center space-x-2 ${uploading ? 'bg-slate-100' : 'bg-white hover:bg-slate-50 cursor-pointer'}`}>
                    <ImageIcon className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">{uploading ? 'Uploading...' : 'Choose Image'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
            <button 
              type="button" 
              onClick={() => { setIsEditing(false); setCurrent({}); }} 
              className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="bg-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-700 transition shadow-sm"
            >
              {current.id ? 'Update Section' : 'Save Section'}
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
          <h2 className="text-xl font-bold text-slate-800">Manage About Content</h2>
          <p className="text-sm text-slate-500 mt-0.5">Customize your story, bio, and studio introduction</p>
        </div>
        <button 
          onClick={() => { setCurrent({}); setIsEditing(true); }} 
          className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-teal-700 transition shadow-sm font-medium"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Section
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Section Key</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Title & Subtitle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[170px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sections.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {item.image ? (
                        <img className="h-10 w-10 rounded object-cover border border-slate-200 flex-shrink-0" src={item.image} alt={item.title || item.section_key} />
                      ) : (
                        <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center border border-slate-200 flex-shrink-0">
                          <ImageIcon className="h-5 w-5 text-slate-400" />
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-slate-900">{item.section_key}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{item.title || '—'}</div>
                    {item.subtitle && (
                      <div className="text-xs text-slate-500 truncate max-w-xs">{item.subtitle}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium min-w-[170px]">
                    <div 
                      className="flex items-center justify-end space-x-2"
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'flex-end', 
                        alignItems: 'center', 
                        gap: '8px' 
                      }}
                    >
                      <button 
                        type="button"
                        onClick={() => { setCurrent(item); setIsEditing(true); }} 
                        className="inline-flex items-center justify-center px-3.5 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-300 rounded-md font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px 14px',
                          backgroundColor: '#f0fdfa',
                          color: '#0f766e',
                          border: '1px solid #14b8a6',
                          borderRadius: '6px',
                          fontWeight: 600,
                          fontSize: '13px',
                          cursor: 'pointer',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                        }}
                        title="Edit Section"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1.5" style={{ width: '14px', height: '14px', marginRight: '6px' }} />
                        Edit
                      </button>
                      <button 
                        type="button"
                        onClick={() => setItemToDelete(item)} 
                        className="inline-flex items-center justify-center px-3.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-300 rounded-md font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px 14px',
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #f87171',
                          borderRadius: '6px',
                          fontWeight: 600,
                          fontSize: '13px',
                          cursor: 'pointer',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                        }}
                        title="Delete Section"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" style={{ width: '14px', height: '14px', marginRight: '6px' }} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sections.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                    No about sections found. Add one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safe In-App Delete Confirmation Modal (no native browser dialog) */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Delete</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete section <strong>{itemToDelete.section_key}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={executeDelete}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
