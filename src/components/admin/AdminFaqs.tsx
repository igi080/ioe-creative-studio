import React, { useState, useEffect } from 'react';
import { Faq } from '../../types';
import { getSupabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export function AdminFaqs({ setError, showSuccess }: { setError: (msg: string | null) => void, showSuccess: (msg: string) => void }) {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentFaq, setCurrentFaq] = useState<Partial<Faq>>({});
  const [faqToDelete, setFaqToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('faqs').select('*').order('display_order', { ascending: true });
      if (error && error.code !== '42P01') throw error; // Ignore table missing error during init
      setFaqs(data || []);
    } catch (err: any) {
      console.error('Error fetching FAQs:', err);
      setError(err.message || 'Error fetching FAQs');
    } finally {
      setLoading(false);
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
      if (currentFaq.id) {
        const updatePayload = {
          question: currentFaq.question?.trim(),
          answer: currentFaq.answer?.trim(),
          category: currentFaq.category?.trim() || null,
          display_order: Number(currentFaq.display_order) || 0,
          is_active: currentFaq.is_active ?? true,
          updated_at: new Date().toISOString()
        };
        const { data, error } = await supabase
          .from('faqs')
          .update(updatePayload)
          .eq('id', currentFaq.id)
          .select();
        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error('Update failed: Record not found or blocked by Row Level Security (RLS). Please ensure you are an authorized admin.');
        }
        showSuccess('FAQ updated successfully.');
      } else {
        const insertPayload = {
          question: currentFaq.question?.trim(),
          answer: currentFaq.answer?.trim(),
          category: currentFaq.category?.trim() || null,
          display_order: Number(currentFaq.display_order) || 0,
          is_active: currentFaq.is_active ?? true
        };
        const { data, error } = await supabase
          .from('faqs')
          .insert([insertPayload])
          .select()
          .single();
        if (error) throw error;
        showSuccess('FAQ added successfully.');
      }
      setIsEditing(false);
      setCurrentFaq({});
      await fetchFaqs();
    } catch (err: any) {
      console.error('Error saving FAQ:', err);
      setError('Error saving FAQ: ' + (err.message || 'Failed to save FAQ'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setFaqToDelete(id);
  };

  const executeDelete = async () => {
    if (!faqToDelete) return;
    const id = faqToDelete;
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
        .from('faqs')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Deletion failed: Record not found or blocked by Row Level Security (RLS). Please ensure you are an authorized admin.');
      }
      setFaqs(prev => prev.filter(f => f.id !== id));
      showSuccess('FAQ deleted successfully.');
      setFaqToDelete(null);
      await fetchFaqs();
    } catch (err: any) {
      console.error('Error deleting FAQ:', err);
      setError('Error deleting FAQ: ' + (err.message || 'Failed to delete FAQ'));
    } finally {
      setDeleting(false);
      setFaqToDelete(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading FAQs...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Manage FAQs</h2>
        {!isEditing && (
          <button onClick={() => { setCurrentFaq({ is_active: true, display_order: 0 }); setIsEditing(true); }} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-teal-700 transition">
            <Plus className="w-4 h-4 mr-2" /> Add FAQ
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
          <h3 className="text-lg font-bold mb-4">{currentFaq.id ? 'Edit FAQ' : 'Add FAQ'}</h3>
          <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Question</label>
              <input required type="text" className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500" value={currentFaq.question || ''} onChange={e => setCurrentFaq({...currentFaq, question: e.target.value})} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Answer</label>
              <textarea required rows={4} className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500" value={currentFaq.answer || ''} onChange={e => setCurrentFaq({...currentFaq, answer: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Category (Optional)</label>
              <input type="text" className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500" value={currentFaq.category || ''} onChange={e => setCurrentFaq({...currentFaq, category: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Display Order</label>
              <input type="number" className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500" value={currentFaq.display_order || 0} onChange={e => setCurrentFaq({...currentFaq, display_order: Number(e.target.value)})} />
            </div>
            <div className="flex items-center space-x-6 sm:col-span-2 mt-2">
              <label className="flex items-center">
                <input type="checkbox" className="rounded text-teal-600 mr-2" checked={currentFaq.is_active || false} onChange={e => setCurrentFaq({...currentFaq, is_active: e.target.checked})} />
                Active (Visible)
              </label>
            </div>
            <div className="sm:col-span-2 flex justify-end space-x-3 mt-4">
              <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border rounded-md">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Save FAQ'}</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Question</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {faqs.map(f => (
                <tr key={f.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{f.question}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${f.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                      {f.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => { setCurrentFaq(f); setIsEditing(true); }} className="text-teal-600 hover:text-blue-900 mr-4 p-2">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteClick(f.id)} className="text-red-600 hover:text-red-900 p-2" title="Delete FAQ">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {faqs.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-slate-500 text-sm">No FAQs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal (Custom Modal, NOT native window.confirm) */}
      {faqToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Delete</h3>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete this FAQ?
              {faqs.find(f => f.id === faqToDelete)?.question && (
                <span className="block mt-2 font-semibold text-slate-800 italic">
                  "{faqs.find(f => f.id === faqToDelete)?.question}"
                </span>
              )}
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setFaqToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={executeDelete}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-50"
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
