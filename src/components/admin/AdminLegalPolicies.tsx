import React, { useState, useEffect } from 'react';
import { LegalPolicy, LegalHighlight } from '../../types';
import { getSupabase } from '../../lib/supabase';
import { 
  Scale, 
  FileText, 
  Shield, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  ArrowLeft, 
  Calendar, 
  ExternalLink, 
  AlertTriangle,
  Sparkles,
  Save,
  Clock
} from 'lucide-react';

interface AdminLegalPoliciesProps {
  setError: (msg: string | null) => void;
  showSuccess: (msg: string) => void;
}

export function AdminLegalPolicies({ setError, showSuccess }: AdminLegalPoliciesProps) {
  const [policies, setPolicies] = useState<LegalPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Current policy being edited/created
  const [currentPolicy, setCurrentPolicy] = useState<Partial<LegalPolicy>>({});
  const [highlights, setHighlights] = useState<LegalHighlight[]>([]);
  
  // Safe delete state
  const [policyToDelete, setPolicyToDelete] = useState<LegalPolicy | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Active view tab in editor (edit or preview)
  const [editorTab, setEditorTab] = useState<'form' | 'preview'>('form');

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setError('Database client not initialized');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('legal_policies')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          throw new Error('Table "public.legal_policies" was not found in database. Please run the schema SQL.');
        }
        throw error;
      }

      setPolicies(data || []);
    } catch (err: any) {
      console.error('Error fetching legal policies:', err);
      setError(err.message || 'Error fetching legal policies');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (policy: LegalPolicy) => {
    setCurrentPolicy({ ...policy });
    setHighlights(Array.isArray(policy.key_highlights) ? [...policy.key_highlights] : []);
    setIsEditing(true);
    setEditorTab('form');
  };

  const handleAddNewClick = () => {
    const today = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());
    setCurrentPolicy({
      slug: '',
      title: '',
      badge_text: '',
      subtitle: '',
      content: '',
      last_updated: today,
      is_published: true
    });
    setHighlights([]);
    setIsEditing(true);
    setEditorTab('form');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setCurrentPolicy({});
    setHighlights([]);
  };

  // Helper for setting today's date
  const handleSetTodayDate = () => {
    const today = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());
    setCurrentPolicy(prev => ({ ...prev, last_updated: today }));
  };

  // Highlights handlers
  const handleAddHighlight = () => {
    setHighlights(prev => [...prev, { icon: 'FileText', title: '', description: '' }]);
  };

  const handleUpdateHighlight = (index: number, field: keyof LegalHighlight, value: string) => {
    setHighlights(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveHighlight = (index: number) => {
    setHighlights(prev => prev.filter((_, i) => i !== index));
  };

  // Toggle publish directly from list
  const handleTogglePublish = async (policy: LegalPolicy) => {
    const supabase = getSupabase();
    if (!supabase) return;

    const newStatus = !policy.is_published;
    try {
      const { data, error } = await supabase
        .from('legal_policies')
        .update({ is_published: newStatus, updated_at: new Date().toISOString() })
        .eq('id', policy.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Update blocked by security policies. Ensure you are signed in as an active administrator.');
      }

      setPolicies(prev => prev.map(p => p.id === policy.id ? { ...p, is_published: newStatus } : p));
      showSuccess(`"${policy.title}" has been ${newStatus ? 'published' : 'unpublished'}.`);
    } catch (err: any) {
      console.error('Error toggling policy publication:', err);
      setError(err.message || 'Failed to update publication status');
    }
  };

  // Save changes (insert or update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const supabase = getSupabase();
    if (!supabase) {
      setError('Database client not initialized');
      return;
    }

    if (!currentPolicy.title?.trim()) {
      setError('Document title is required.');
      return;
    }

    if (!currentPolicy.slug?.trim()) {
      setError('URL slug is required.');
      return;
    }

    if (!currentPolicy.content?.trim()) {
      setError('Document content cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      // Clean highlights (remove empty items)
      const validHighlights = highlights.filter(h => h.title.trim() || h.description.trim());

      const payload = {
        slug: currentPolicy.slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
        title: currentPolicy.title.trim(),
        badge_text: currentPolicy.badge_text?.trim() || null,
        subtitle: currentPolicy.subtitle?.trim() || null,
        content: currentPolicy.content.trim(),
        key_highlights: validHighlights,
        last_updated: currentPolicy.last_updated?.trim() || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        is_published: currentPolicy.is_published !== undefined ? currentPolicy.is_published : true,
        updated_at: new Date().toISOString()
      };

      if (currentPolicy.id) {
        // Update
        const { data, error } = await supabase
          .from('legal_policies')
          .update(payload)
          .eq('id', currentPolicy.id)
          .select();

        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error('Update failed: Record not found or blocked by Row Level Security (RLS). Please ensure you are an authorized administrator.');
        }

        showSuccess(`"${payload.title}" updated successfully.`);
      } else {
        // Insert
        const { data, error } = await supabase
          .from('legal_policies')
          .insert([payload])
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            throw new Error(`A policy with slug "${payload.slug}" already exists. Please choose a unique slug.`);
          }
          throw error;
        }

        showSuccess(`"${payload.title}" created successfully.`);
      }

      setIsEditing(false);
      setCurrentPolicy({});
      setHighlights([]);
      await fetchPolicies();
    } catch (err: any) {
      console.error('Error saving policy:', err);
      setError(err.message || 'Failed to save policy');
    } finally {
      setSaving(false);
    }
  };

  // Safe delete execution
  const executeDelete = async () => {
    if (!policyToDelete) return;

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
        .from('legal_policies')
        .delete()
        .eq('id', policyToDelete.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Deletion failed: Record blocked by Row Level Security (RLS). Please ensure you are an authorized administrator.');
      }

      setPolicies(prev => prev.filter(p => p.id !== policyToDelete.id));
      showSuccess(`"${policyToDelete.title}" was successfully deleted.`);
      setPolicyToDelete(null);
    } catch (err: any) {
      console.error('Error deleting policy:', err);
      setError(err.message || 'Failed to delete policy');
    } finally {
      setDeleting(false);
    }
  };

  // Link helper for previewing public page
  const getPublicPath = (slug: string) => {
    if (slug === 'privacy-policy') return '/privacy';
    if (slug === 'terms-of-service') return '/terms';
    if (slug === 'client-agreement') return '/agreement';
    return slug ? `/legal/${slug}` : null;
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-3"></div>
        <p className="text-sm font-medium">Loading legal documents...</p>
      </div>
    );
  }

  // ==========================================
  // 1. EDIT / CREATE VIEW
  // ==========================================
  if (isEditing) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-300 p-4 sm:p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Back to policies list"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                {currentPolicy.id ? `Edit: ${currentPolicy.title || 'Legal Document'}` : 'New Legal Document'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Configure content, highlights, publication state, and last updated timestamp.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setEditorTab('form')}
                className={`px-3 py-1.5 rounded-md transition ${editorTab === 'form' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Editor Form
              </button>
              <button
                type="button"
                onClick={() => setEditorTab('preview')}
                className={`px-3 py-1.5 rounded-md transition ${editorTab === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Preview Content
              </button>
            </div>
          </div>
        </div>

        {editorTab === 'preview' ? (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs uppercase tracking-wider font-bold text-teal-700 bg-teal-100 px-2.5 py-1 rounded-full">
                {currentPolicy.badge_text || 'Legal Document'}
              </span>
              <h1 className="text-2xl font-bold text-slate-900 mt-3">{currentPolicy.title || 'Untitled Document'}</h1>
              {currentPolicy.subtitle && (
                <p className="text-slate-600 mt-2 text-sm">{currentPolicy.subtitle}</p>
              )}
              <div className="text-xs text-slate-500 mt-4 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Last Updated: {currentPolicy.last_updated || 'Not set'}
              </div>
            </div>

            {highlights.length > 0 && (
              <div>
                <h4 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-3">Key Highlights ({highlights.length})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {highlights.map((h, i) => (
                    <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg">
                      <div className="font-semibold text-slate-900 text-sm">{h.title || 'Untitled Card'}</div>
                      <p className="text-xs text-slate-600 mt-1">{h.description || 'No description'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Content Preview</h4>
              <div className="p-4 bg-slate-900 text-slate-100 rounded-xl max-h-[500px] overflow-y-auto whitespace-pre-wrap font-mono text-xs leading-relaxed">
                {currentPolicy.content || '// Document content is currently empty.'}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setEditorTab('form')}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900"
              >
                Back to Edit Form
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Top Metas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Document Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Privacy Policy"
                  className="w-full border border-slate-300 rounded-xl p-3 text-slate-900 text-sm focus:ring-2 focus:ring-teal-600 focus:border-teal-600 bg-white"
                  value={currentPolicy.title || ''}
                  onChange={e => setCurrentPolicy({ ...currentPolicy, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  URL Slug <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(currentPolicy.id)}
                  placeholder="e.g. privacy-policy"
                  className="w-full border border-slate-300 rounded-xl p-3 text-slate-900 text-sm focus:ring-2 focus:ring-teal-600 focus:border-teal-600 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                  value={currentPolicy.slug || ''}
                  onChange={e => setCurrentPolicy({ ...currentPolicy, slug: e.target.value })}
                />
                {currentPolicy.id && (
                  <p className="text-[11px] text-slate-400 mt-1">Slug is locked for existing documents to maintain routing stability.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Badge Text (Category Pill)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Privacy & Data Protection"
                  className="w-full border border-slate-300 rounded-xl p-3 text-slate-900 text-sm focus:ring-2 focus:ring-teal-600 focus:border-teal-600 bg-white"
                  value={currentPolicy.badge_text || ''}
                  onChange={e => setCurrentPolicy({ ...currentPolicy, badge_text: e.target.value })}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Last Updated Date <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSetTodayDate}
                    className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Set Today
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. September 19, 2026"
                  className="w-full border border-slate-300 rounded-xl p-3 text-slate-900 text-sm focus:ring-2 focus:ring-teal-600 focus:border-teal-600 bg-white"
                  value={currentPolicy.last_updated || ''}
                  onChange={e => setCurrentPolicy({ ...currentPolicy, last_updated: e.target.value })}
                />
              </div>
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Document Subtitle / Lead Paragraph
              </label>
              <textarea
                rows={2}
                placeholder="A concise summary of what this document covers..."
                className="w-full border border-slate-300 rounded-xl p-3 text-slate-900 text-sm focus:ring-2 focus:ring-teal-600 focus:border-teal-600 bg-white"
                value={currentPolicy.subtitle || ''}
                onChange={e => setCurrentPolicy({ ...currentPolicy, subtitle: e.target.value })}
              />
            </div>

            {/* Published Status Toggle */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900 text-sm">Published Status</div>
                <p className="text-xs text-slate-500 mt-0.5">
                  When enabled, this document is visible to public visitors. When disabled, only administrators can access it.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px]">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={currentPolicy.is_published ?? true}
                  onChange={e => setCurrentPolicy({ ...currentPolicy, is_published: e.target.checked })}
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[12px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            {/* Highlights Editor */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    Key Highlights Cards ({highlights.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Shown as prominent visual highlight cards at the top of the legal document.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddHighlight}
                  className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 min-h-[44px] sm:min-h-[36px]"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Highlight
                </button>
              </div>

              {highlights.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs bg-white rounded-lg border border-dashed border-slate-300">
                  No highlight cards defined. Click "Add Highlight" above if you wish to display overview summary cards.
                </div>
              ) : (
                <div className="space-y-3">
                  {highlights.map((highlight, index) => (
                    <div key={index} className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase">Card #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveHighlight(index)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 min-h-[36px] min-w-[36px] flex items-center justify-center"
                          aria-label={`Remove highlight ${index + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <input
                            type="text"
                            placeholder="Lucide Icon (e.g. Shield, Scale)"
                            className="w-full border border-slate-300 rounded-md p-2 text-xs text-slate-900 focus:ring-1 focus:ring-teal-600 bg-white"
                            value={highlight.icon || ''}
                            onChange={e => handleUpdateHighlight(index, 'icon', e.target.value)}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Card Title (e.g. Data Protection)"
                            className="w-full border border-slate-300 rounded-md p-2 text-xs font-medium text-slate-900 focus:ring-1 focus:ring-teal-600 bg-white"
                            value={highlight.title}
                            onChange={e => handleUpdateHighlight(index, 'title', e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <textarea
                          rows={2}
                          placeholder="Card Description..."
                          className="w-full border border-slate-300 rounded-md p-2 text-xs text-slate-800 focus:ring-1 focus:ring-teal-600 bg-white"
                          value={highlight.description}
                          onChange={e => handleUpdateHighlight(index, 'description', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Document Content */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Full Document Content (Markdown Supported) <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs text-slate-400">
                  {(currentPolicy.content || '').length.toLocaleString()} characters
                </span>
              </div>
              <textarea
                required
                rows={18}
                placeholder="## 1. Section Title&#10;&#10;Enter policy clauses and provisions here..."
                className="w-full border border-slate-300 rounded-xl p-4 text-slate-900 text-sm font-mono leading-relaxed focus:ring-2 focus:ring-teal-600 focus:border-teal-600 bg-white"
                value={currentPolicy.content || ''}
                onChange={e => setCurrentPolicy({ ...currentPolicy, content: e.target.value })}
              />
              <p className="text-xs text-slate-500 mt-1">
                Supports headings (<code>##</code>, <code>###</code>), bold text (<code>**text**</code>), lists (<code>- item</code>), and dividers (<code>---</code>).
              </p>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 transition flex items-center justify-center shadow-sm disabled:opacity-50 min-h-[44px]"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving Document...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Legal Policy
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // ==========================================
  // 2. LIST VIEW
  // ==========================================
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Scale className="w-6 h-6 text-teal-600" />
            Legal & Policy Documents
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage Privacy Policy, Terms of Service, Client Agreements, and custom studio policies.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddNewClick}
          className="bg-teal-600 text-white px-4 py-2.5 rounded-lg flex items-center hover:bg-teal-700 transition shadow-sm font-semibold text-sm min-h-[44px]"
        >
          <Plus className="w-4 h-4 mr-2" /> Add New Policy
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Documents</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{policies.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Published</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {policies.filter(p => p.is_published).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">Draft / Hidden</div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {policies.filter(p => !p.is_published).length}
          </div>
        </div>
      </div>

      {/* Policies List */}
      {policies.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-300 p-12 text-center">
          <Scale className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Legal Policies Found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            There are currently no legal documents stored in the database. You can create a new document or verify that the seed SQL was executed.
          </p>
          <button
            type="button"
            onClick={handleAddNewClick}
            className="bg-teal-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-teal-700 transition"
          >
            Create First Document
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {policies.map(policy => {
            const publicPath = getPublicPath(policy.slug);

            return (
              <div
                key={policy.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Meta */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{policy.title}</h3>
                    
                    {/* Badge Pill */}
                    {policy.badge_text && (
                      <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                        {policy.badge_text}
                      </span>
                    )}

                    {/* Status Pill */}
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        policy.is_published
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {policy.is_published ? (
                        <>
                          <Check className="w-3 h-3" /> Published
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" /> Draft / Hidden
                        </>
                      )}
                    </span>
                  </div>

                  {policy.subtitle && (
                    <p className="text-xs text-slate-600 line-clamp-2 max-w-3xl">
                      {policy.subtitle}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                      slug: {policy.slug}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Updated: {policy.last_updated}
                    </span>
                    {Array.isArray(policy.key_highlights) && policy.key_highlights.length > 0 && (
                      <span className="flex items-center gap-1 text-teal-700 font-medium">
                        <Sparkles className="w-3 h-3" />
                        {policy.key_highlights.length} highlight cards
                      </span>
                    )}
                    <span>
                      {(policy.content || '').length.toLocaleString()} chars
                    </span>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {publicPath && (
                    <a
                      href={publicPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="View public page in new tab"
                      aria-label={`View public ${policy.title}`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  {/* Toggle Publish */}
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(policy)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition min-h-[44px] ${
                      policy.is_published
                        ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                        : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                    title={policy.is_published ? 'Unpublish document' : 'Publish document'}
                  >
                    {policy.is_published ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" /> Publish
                      </>
                    )}
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => handleEditClick(policy)}
                    className="px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition flex items-center gap-1.5 min-h-[44px]"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => setPolicyToDelete(policy)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="Delete document"
                    aria-label={`Delete ${policy.title}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Safe Delete Confirmation Modal */}
      {policyToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-3 bg-rose-100 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Delete Legal Document?</h3>
            </div>

            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900 font-semibold">"{policyToDelete.title}"</strong> (
              <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">{policyToDelete.slug}</code>
              )? This action will remove it from the database and cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPolicyToDelete(null)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 text-white font-semibold text-sm hover:bg-rose-700 transition flex items-center shadow-sm disabled:opacity-50 min-h-[44px]"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
