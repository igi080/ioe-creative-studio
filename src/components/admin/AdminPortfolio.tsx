import React, { useState, useEffect } from 'react';
import { PortfolioProject } from '../../types';
import { getSupabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, Check, X, Image as ImageIcon } from 'lucide-react';

export function AdminPortfolio({ setError, showSuccess }: { setError: (msg: string) => void, showSuccess: (msg: string) => void }) {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState<Partial<PortfolioProject>>({});
  const [uploading, setUploading] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('portfolio').select('*').order('display_order', { ascending: true });
      if (error) throw error;
      setProjects(data || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching portfolio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
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
      setCurrent({ ...current, image: publicUrl });
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
        const { error } = await supabase.from('portfolio').update({
          title: current.title,
          category: current.category,
          description: current.description,
          project_url: current.project_url,
          image: current.image,
          video_url: current.video_url,
          is_featured: current.is_featured,
          is_published: current.is_published,
          display_order: current.display_order
        }).eq('id', current.id);
        if (error) throw error;
        showSuccess("Project updated");
      } else {
        const { error } = await supabase.from('portfolio').insert([{
          title: current.title,
          category: current.category || 'General',
          description: current.description,
          project_url: current.project_url,
          image: current.image,
          video_url: current.video_url,
          is_featured: current.is_featured || false,
          is_published: current.is_published || true,
          display_order: current.display_order || 0
        }]);
        if (error) throw error;
        showSuccess("Project added");
      }
      setIsEditing(false);
      setCurrent({});
      fetchProjects();
    } catch (err: any) {
      setError(err.message || "Error saving project");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { error } = await supabase.from('portfolio').delete().eq('id', id);
      if (error) throw error;
      showSuccess("Project deleted");
      fetchProjects();
    } catch (err: any) {
      setError(err.message || "Error deleting project");
    }
  };

  if (loading && !isEditing) return <div className="p-8 text-center text-slate-500">Loading portfolio...</div>;

  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{current.id ? 'Edit Project' : 'Add Project'}</h2>
          <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-slate-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <input required type="text" value={current.title || ''} onChange={e => setCurrent({...current, title: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
              <input required type="text" value={current.category || ''} onChange={e => setCurrent({...current, category: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea value={current.description || ''} onChange={e => setCurrent({...current, description: e.target.value})} rows={3} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Project URL</label>
              <input type="text" value={current.project_url || ''} onChange={e => setCurrent({...current, project_url: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Video URL (Optional)</label>
              <input type="text" value={current.video_url || ''} onChange={e => setCurrent({...current, video_url: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Display Order</label>
              <input type="number" value={current.display_order || 0} onChange={e => setCurrent({...current, display_order: parseInt(e.target.value)})} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Project Image</label>
              <div className="flex items-center space-x-4">
                {current.image && (
                  <img src={current.image} alt="Preview" className="w-24 h-24 object-cover rounded-lg border" />
                )}
                <div className="relative">
                  <input type="file" accept="image/*" onChange={uploadImage} disabled={uploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className={`px-4 py-2 border border-slate-300 rounded-lg flex items-center justify-center space-x-2 ${uploading ? 'bg-slate-100' : 'bg-white hover:bg-slate-50'}`}>
                    <ImageIcon className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">{uploading ? 'Uploading...' : 'Choose Image'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:col-span-2 flex space-x-6">
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={current.is_published ?? true} onChange={e => setCurrent({...current, is_published: e.target.checked})} className="rounded text-teal-600" />
                <span className="text-sm text-slate-700">Published</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" checked={current.is_featured ?? false} onChange={e => setCurrent({...current, is_featured: e.target.checked})} className="rounded text-teal-600" />
                <span className="text-sm text-slate-700">Featured</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t">
            <button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-700 transition">Save Project</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Manage Portfolio</h2>
        <button onClick={() => { setCurrent({ is_published: true, is_featured: false, display_order: 0 }); setIsEditing(true); }} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-teal-700 transition shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Project
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Order</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {projects.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {item.image ? (
                      <img className="h-10 w-10 rounded object-cover border border-slate-200" src={item.image} alt={item.title} />
                    ) : (
                      <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center border border-slate-200">
                        <ImageIcon className="h-5 w-5 text-slate-400" />
                      </div>
                    )}
                    <div className="ml-4">
                      <div className="text-sm font-medium text-slate-900">{item.title}</div>
                      <div className="text-sm text-slate-500">{item.category}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    {item.is_published ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                        <Check className="w-3 h-3 mr-1" /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                        <EyeOff className="w-3 h-3 mr-1" /> Draft
                      </span>
                    )}
                    {item.is_featured && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                        <Star className="w-3 h-3 mr-1" /> Featured
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {item.display_order}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => { setCurrent(item); setIsEditing(true); }} className="text-blue-600 hover:text-blue-900 mr-4 transition-colors">
                    <Edit2 className="w-4 h-4 inline" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900 transition-colors">
                    <Trash2 className="w-4 h-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                  No portfolio projects found. Add one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
