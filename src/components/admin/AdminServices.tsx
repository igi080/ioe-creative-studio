import React, { useState, useEffect } from 'react';
import { Service } from '../../types';
import { getSupabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export function AdminServices({ setError, showSuccess }: { setError: (msg: string | null) => void, showSuccess: (msg: string) => void }) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentService, setCurrentService] = useState<Partial<Service>>({});
  const [newFeature, setNewFeature] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('services').select('*').order('display_order', { ascending: true });
      if (error) throw error;
      setServices(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const payload = { ...currentService };
      // Omit color_gradient as it doesn't exist in the current DB schema and we cannot run a migration
      delete payload.color_gradient;

      if (editingId) {
        const updatePayload = { ...payload };
        delete updatePayload.id;
        delete updatePayload.created_at;
        delete updatePayload.updated_at;
        
        const { data, error } = await supabase.from('services').update(updatePayload).eq('id', editingId).select();
        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error("Update failed: Record not found or blocked by Row Level Security (RLS). Please ensure you are an authorized admin.");
        }
        await fetchServices();
        showSuccess('Service updated successfully.');
        setIsEditing(false);
      } else {
        const insertPayload = { ...payload };
        delete insertPayload.id;
        const { error } = await supabase.from('services').insert([insertPayload]);
        if (error) throw error;
        await fetchServices();
        showSuccess('Service added successfully.');
        setIsEditing(false);
      }
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      setError('Error saving service: ' + err.message);
    }
  };

  const confirmDelete = (id: string) => {
    setServiceToDelete(id);
  };

  const executeDelete = async () => {
    if (!serviceToDelete) return;
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('services').delete().eq('id', serviceToDelete).select();
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Deletion failed: Record not found or blocked by Row Level Security (RLS). Please ensure you are an authorized admin.");
      }
      setServiceToDelete(null);
      await fetchServices();
      showSuccess('Service deleted successfully.');
    } catch (err: any) {
      console.error(err);
      setError('Error deleting service: ' + err.message);
    } finally {
      setServiceToDelete(null);
    }
  };

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be smaller than 5MB");
      return;
    }
    setUploadingImage(true);
    setError(null);
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error("No supabase instance");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Authentication error");

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
      const uniqueName = `services/${uuidv4()}-${sanitizedName}`;

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
         setCurrentService(prev => ({ ...prev, image: publicUrl }));
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setCurrentService(prev => ({ ...prev, features: [...(prev.features || []), newFeature.trim()] }));
    setNewFeature('');
  };

  const removeFeature = (index: number) => {
    setCurrentService(prev => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index)
    }));
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading services...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Manage Services</h2>
        {!isEditing && (
          <button onClick={() => { setEditingId(null); setCurrentService({ is_active: true, display_order: 0, features: [] }); setIsEditing(true); }} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-teal-700 transition">
            <Plus className="w-4 h-4 mr-2" /> Add Service
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
          <h3 className="text-lg font-bold mb-4">{editingId ? 'Edit Service' : 'Add Service'}</h3>
          <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
              <input required type="text" className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500" value={currentService.title || ''} onChange={e => setCurrentService({...currentService, title: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Icon Name (lucide-react)</label>
              <input type="text" className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500" value={currentService.icon || ''} onChange={e => setCurrentService({...currentService, icon: e.target.value})} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
              <textarea rows={2} className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500" value={currentService.description || ''} onChange={e => setCurrentService({...currentService, description: e.target.value})} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Image URL or Upload</label>
              <div className="mt-1 flex items-center space-x-4">
                <input type="text" className="w-full border border-slate-300 rounded-xl p-3" value={currentService.image || ''} placeholder="https://..." onChange={e => setCurrentService({...currentService, image: e.target.value})} />
                <span className="text-slate-500">OR</span>
                <input type="file" accept="image/*" onChange={uploadImage} disabled={uploadingImage} className="block w-full text-sm text-slate-500 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-700 cursor-pointer" />
              </div>
              {uploadingImage && <p className="text-sm text-blue-600 mt-2">Uploading...</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Display Order</label>
              <input type="number" className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500" value={currentService.display_order || 0} onChange={e => setCurrentService({...currentService, display_order: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Color Gradient (Tailwind)</label>
              <input type="text" className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500" value={currentService.color_gradient || ''} onChange={e => setCurrentService({...currentService, color_gradient: e.target.value})} />
            </div>
            <div className="sm:col-span-2 mt-4 p-4 border border-slate-300 rounded-md bg-slate-50">
              <label className="block text-sm font-medium text-slate-700 mb-2">Features</label>
              <ul className="space-y-2 mb-4">
                {(currentService.features || []).map((feat, idx) => (
                  <li key={idx} className="flex justify-between items-center p-2 border border-slate-300 rounded bg-white text-sm">
                    <span className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> {feat}</span>
                    <button type="button" onClick={() => removeFeature(idx)} className="text-red-500"><X className="w-4 h-4" /></button>
                  </li>
                ))}
              </ul>
              <div className="flex space-x-2">
                <input type="text" className="flex-grow border border-slate-300 rounded-xl px-4 py-2" value={newFeature} onChange={e => setNewFeature(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); addFeature(); } }} />
                <button type="button" onClick={addFeature} className="bg-teal-600/20 text-teal-600 px-4 py-2 rounded-xl text-sm font-bold">Add</button>
              </div>
            </div>
            <div className="flex items-center space-x-6 sm:col-span-2 mt-2">
              <label className="flex items-center">
                <input type="checkbox" className="rounded text-teal-600 mr-2" checked={currentService.is_active || false} onChange={e => setCurrentService({...currentService, is_active: e.target.checked})} />
                Active (Visible)
              </label>
            </div>
            <div className="sm:col-span-2 flex justify-end space-x-3 mt-4">
              <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border rounded-md">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium">Save Service</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[160px]">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {services.map(svc => (
                  <tr key={svc.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {svc.image ? (
                          <img src={svc.image} alt={svc.title} className="h-10 w-10 rounded-lg object-cover mr-3" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center mr-3 text-slate-400 text-xs text-center border border-slate-200">No Img</div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-slate-900">{svc.title}</div>
                          <div className="text-sm text-slate-500">{svc.icon}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${svc.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                        {svc.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{svc.display_order}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium min-w-[160px]">
                      <div 
                        className="flex items-center justify-end space-x-3"
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'flex-end', 
                          alignItems: 'center', 
                          gap: '12px' 
                        }}
                      >
                        <button 
                          type="button" 
                          onClick={() => { setEditingId(svc.id!); setCurrentService(svc); setIsEditing(true); }} 
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
                        >
                          Edit
                        </button>
                        <button 
                          type="button" 
                          onClick={() => confirmDelete(svc.id!)} 
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
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {services.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-slate-500 text-sm">No services found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Service Delete Confirmation Modal */}
      {serviceToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Delete</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete the service <strong>{services.find(s => s.id === serviceToDelete)?.title}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                type="button"
                onClick={() => setServiceToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
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
