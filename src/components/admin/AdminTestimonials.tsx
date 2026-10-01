import React, { useState, useEffect } from 'react';
import { Testimonial } from '../../types';
import { getSupabase } from '../../lib/supabase';
import { Plus, Star, X, Upload, Video as VideoIcon, Image as ImageIcon, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface AdminTestimonialsProps {
  setError: (msg: string | null) => void;
  showSuccess: (msg: string) => void;
}

export function AdminTestimonials({ setError, showSuccess }: AdminTestimonialsProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentTestimonial, setCurrentTestimonial] = useState<Partial<Testimonial>>({
    rating: 5,
    display_order: 0,
    is_active: true,
  });
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;

      // Normalize fields so both testimonial/content and client_image/image exist
      const normalized: Testimonial[] = (data || []).map((item: any) => ({
        ...item,
        content: item.testimonial || item.content || '',
        testimonial: item.testimonial || item.content || '',
        image: item.client_image || item.image || '',
        client_image: item.client_image || item.image || '',
        client_role: item.client_role || '',
        rating: Number(item.rating) || 5,
        display_order: Number(item.display_order) || 0,
        is_active: Boolean(item.is_active),
      }));

      setTestimonials(normalized);
    } catch (err: any) {
      console.error('Error fetching testimonials:', err);
      setError(err.message || 'Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  const isVideoUrl = (url?: string) => {
    if (!url) return false;
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
  };

  const startAdd = () => {
    setEditingId(null);
    setCurrentTestimonial({
      client_name: '',
      client_role: '',
      testimonial: '',
      content: '',
      rating: 5,
      client_image: '',
      image: '',
      display_order: testimonials.length,
      is_active: true,
    });
    setIsEditing(true);
  };

  const startEdit = (t: Testimonial) => {
    setEditingId(t.id);
    setCurrentTestimonial({
      ...t,
      testimonial: t.testimonial || t.content || '',
      content: t.testimonial || t.content || '',
      client_image: t.client_image || t.image || '',
      image: t.client_image || t.image || '',
      client_role: t.client_role || '',
    });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setCurrentTestimonial({});
    setError(null);
  };

  const uploadMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File size exceeds limit: maximum ${isVideo ? '50MB for videos' : '5MB for images'}.`);
      return;
    }

    setUploadingMedia(true);
    setError(null);

    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Authentication session required for upload.');

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
      const uniqueName = `testimonials/${uuidv4()}-${sanitizedName}`;

      const urlResponse = await fetch('/api/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ filename: uniqueName, contentType: file.type }),
      });

      if (!urlResponse.ok) {
        const errorData = await urlResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate upload URL');
      }

      const { uploadUrl, publicUrl } = await urlResponse.json();

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage');
      }

      if (publicUrl) {
        setCurrentTestimonial(prev => ({
          ...prev,
          client_image: publicUrl,
          image: publicUrl,
        }));
        showSuccess(`${isVideo ? 'Video' : 'Image'} uploaded successfully.`);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload media');
    } finally {
      setUploadingMedia(false);
      // Reset input value so same file can be re-selected if desired
      e.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const supabase = getSupabase();
    if (!supabase) {
      setError('Database client not ready.');
      return;
    }

    const clientName = currentTestimonial.client_name?.trim();
    const reviewText = (currentTestimonial.testimonial || currentTestimonial.content || '').trim();

    if (!clientName) {
      setError('Client Name is required.');
      return;
    }
    if (!reviewText) {
      setError('Review Text (Content) is required.');
      return;
    }

    const mediaUrl = currentTestimonial.client_image || currentTestimonial.image || null;

    // Database schema uses `testimonial` (review text) and `client_image` (media URL)
    const dbPayload: Record<string, any> = {
      client_name: clientName,
      client_role: currentTestimonial.client_role?.trim() || null,
      testimonial: reviewText,
      rating: Math.min(5, Math.max(1, Number(currentTestimonial.rating) || 5)),
      client_image: mediaUrl,
      display_order: Number(currentTestimonial.display_order) || 0,
      is_active: currentTestimonial.is_active ?? true,
    };

    try {
      if (editingId) {
        const { data, error } = await supabase
          .from('testimonials')
          .update(dbPayload)
          .eq('id', editingId)
          .select();

        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error('Update failed: Record not found or blocked by Row Level Security (RLS). Please verify admin authorization.');
        }

        showSuccess('Testimonial updated successfully.');
      } else {
        const { data, error } = await supabase
          .from('testimonials')
          .insert([dbPayload])
          .select();

        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error('Insert failed: Record was blocked by Row Level Security (RLS).');
        }

        showSuccess('Testimonial added successfully.');
      }

      setIsEditing(false);
      setEditingId(null);
      setCurrentTestimonial({});
      await fetchTestimonials();
    } catch (err: any) {
      console.error('Error saving testimonial:', err);
      setError('Error saving testimonial: ' + err.message);
    }
  };

  const executeDelete = async () => {
    if (!testimonialToDelete) return;
    const supabase = getSupabase();
    if (!supabase) return;

    setDeleting(true);
    try {
      const itemToDelete = testimonials.find(t => t.id === testimonialToDelete);
      const { data, error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', testimonialToDelete)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Deletion failed: Record not found or blocked by Row Level Security (RLS).');
      }

      // Cleanup media from R2 if applicable
      const mediaUrl = itemToDelete?.client_image || itemToDelete?.image;
      if (mediaUrl) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            const match = mediaUrl.match(/testimonials\/[^?]+/);
            if (match) {
              await fetch('/api/delete-media', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ key: match[0] }),
              }).catch(() => {});
            }
          }
        } catch (e) {
          // Media deletion error is non-blocking
        }
      }

      setTestimonialToDelete(null);
      await fetchTestimonials();
      showSuccess('Testimonial deleted successfully.');
    } catch (err: any) {
      console.error('Error deleting testimonial:', err);
      setError('Error deleting testimonial: ' + err.message);
    } finally {
      setDeleting(false);
      setTestimonialToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-3"></div>
        <p>Loading testimonials...</p>
      </div>
    );
  }

  const currentMediaUrl = currentTestimonial.client_image || currentTestimonial.image;
  const isCurrentVideo = isVideoUrl(currentMediaUrl);

  return (
    <div>
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manage Testimonials</h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage client reviews, ratings, and media displayed on the public website.
          </p>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={startAdd}
            className="bg-teal-600 text-white px-4 py-2.5 rounded-lg flex items-center hover:bg-teal-700 transition font-medium shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Testimonial
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {isEditing ? (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 mb-8">
          <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {editingId ? 'Edit Testimonial' : 'Add New Testimonial'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Fill in the client information, rating, review text, and optional media.
              </p>
            </div>
            <button
              type="button"
              onClick={cancelEdit}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-5">
              {/* Client Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
                  value={currentTestimonial.client_name || ''}
                  onChange={e => setCurrentTestimonial({ ...currentTestimonial, client_name: e.target.value })}
                />
              </div>

              {/* Client Role / Organization */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Client Role / Company <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. CMO at TechWave"
                  className="w-full border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
                  value={currentTestimonial.client_role || ''}
                  onChange={e => setCurrentTestimonial({ ...currentTestimonial, client_role: e.target.value })}
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Rating (1–5 Stars)
                </label>
                <div className="flex items-center space-x-3">
                  <select
                    className="border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 bg-white"
                    value={currentTestimonial.rating || 5}
                    onChange={e => setCurrentTestimonial({ ...currentTestimonial, rating: Number(e.target.value) })}
                  >
                    <option value="5">5 - Excellent ★★★★★</option>
                    <option value="4">4 - Very Good ★★★★☆</option>
                    <option value="3">3 - Good ★★★☆☆</option>
                    <option value="2">2 - Fair ★★☆☆☆</option>
                    <option value="1">1 - Poor ★☆☆☆☆</option>
                  </select>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${star <= (currentTestimonial.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
                  value={currentTestimonial.display_order ?? 0}
                  onChange={e => setCurrentTestimonial({ ...currentTestimonial, display_order: Number(e.target.value) })}
                />
              </div>

              {/* Content / Review Text */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Review Text (Testimonial Content) <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share what the client said about their experience..."
                  className="w-full border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
                  value={currentTestimonial.testimonial || currentTestimonial.content || ''}
                  onChange={e => setCurrentTestimonial({
                    ...currentTestimonial,
                    testimonial: e.target.value,
                    content: e.target.value,
                  })}
                />
              </div>

              {/* Media Upload (Image or Video) */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Client Image or Video <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Upload a photo (PNG, JPG, WebP up to 5MB) or video testimonial (MP4, WebM up to 50MB) via Cloudflare R2 storage.
                </p>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm text-slate-800"
                      value={currentMediaUrl || ''}
                      placeholder="Public URL or upload file below..."
                      onChange={e => setCurrentTestimonial({
                        ...currentTestimonial,
                        client_image: e.target.value,
                        image: e.target.value,
                      })}
                    />
                  </div>

                  <label className="relative inline-flex items-center px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl border border-slate-300 cursor-pointer transition-colors flex-shrink-0">
                    <Upload className="w-4 h-4 mr-2 text-slate-500" />
                    <span>{uploadingMedia ? 'Uploading...' : 'Choose File'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml,video/mp4,video/webm"
                      onChange={uploadMedia}
                      disabled={uploadingMedia}
                      className="sr-only"
                    />
                  </label>

                  {currentMediaUrl && (
                    <button
                      type="button"
                      onClick={() => setCurrentTestimonial({ ...currentTestimonial, client_image: '', image: '' })}
                      className="text-xs text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remove media"
                    >
                      Remove Media
                    </button>
                  )}
                </div>

                {uploadingMedia && (
                  <div className="flex items-center mt-2 text-sm text-teal-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600 mr-2"></div>
                    Uploading media to Cloudflare R2 storage...
                  </div>
                )}

                {/* Live Preview of Uploaded Media */}
                {currentMediaUrl && !uploadingMedia && (
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl inline-flex items-center space-x-3">
                    {isCurrentVideo ? (
                      <div className="relative">
                        <video
                          src={currentMediaUrl}
                          className="w-20 h-20 object-cover rounded-lg border border-slate-300 bg-black"
                          controls
                        />
                        <span className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded flex items-center">
                          <VideoIcon className="w-3 h-3 mr-0.5" /> Video
                        </span>
                      </div>
                    ) : (
                      <img
                        src={currentMediaUrl}
                        alt="Media Preview"
                        className="w-20 h-20 object-cover rounded-lg border border-slate-300"
                      />
                    )}
                    <div className="text-xs text-slate-600 max-w-xs break-all">
                      <p className="font-semibold text-slate-800 mb-0.5">Media Preview:</p>
                      <p className="truncate">{currentMediaUrl}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Active Toggle */}
              <div className="sm:col-span-2 pt-2">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
                    checked={currentTestimonial.is_active ?? true}
                    onChange={e => setCurrentTestimonial({ ...currentTestimonial, is_active: e.target.checked })}
                  />
                  <span className="ml-2.5 text-sm font-semibold text-slate-800">
                    Active (Visible on public website)
                  </span>
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-5 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 shadow-sm transition cursor-pointer"
              >
                Save Testimonial
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Testimonials Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Media
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Client & Rating
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Review Text
                </th>
                <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {testimonials.map(t => {
                const mediaUrl = t.client_image || t.image;
                const isVideo = isVideoUrl(mediaUrl);
                const reviewText = t.testimonial || t.content || '';

                return (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Media Thumbnail */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {mediaUrl ? (
                        isVideo ? (
                          <div className="relative w-12 h-12 rounded-lg bg-black border border-slate-200 overflow-hidden flex items-center justify-center">
                            <video src={mediaUrl} className="w-full h-full object-cover" muted />
                            <VideoIcon className="absolute w-4 h-4 text-white drop-shadow" />
                          </div>
                        ) : (
                          <img
                            src={mediaUrl}
                            alt={t.client_name}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                          />
                        )
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                    </td>

                    {/* Client & Rating */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900">{t.client_name}</div>
                      {t.client_role && (
                        <div className="text-xs text-slate-500">{t.client_role}</div>
                      )}
                      <div className="flex items-center text-amber-400 mt-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${star <= (t.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                          />
                        ))}
                        <span className="ml-1.5 text-xs font-semibold text-slate-600">
                          {t.rating || 5}/5
                        </span>
                      </div>
                    </td>

                    {/* Review Text */}
                    <td className="px-6 py-4 max-w-sm">
                      <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        {reviewText || <span className="text-slate-400 italic">No content</span>}
                      </p>
                    </td>

                    {/* Display Order */}
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-slate-600">
                      {t.display_order ?? 0}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-2.5 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                          t.is_active
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {t.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </td>

                    {/* Actions: Distinct Visible Buttons */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="inline-flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => startEdit(t)}
                          className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-300 rounded-lg hover:bg-teal-100 transition-colors shadow-xs cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setTestimonialToDelete(t.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 transition-colors shadow-xs cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {testimonials.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <p className="text-base font-medium text-slate-700">No testimonials found.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click "Add Testimonial" above to create your first client review.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal (Custom Modal, NOT native window.confirm) */}
      {testimonialToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 mb-4 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Confirm Deletion</h3>
            </div>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Are you sure you want to permanently delete the testimonial for{' '}
              <strong className="text-slate-900 font-semibold">
                {testimonials.find(t => t.id === testimonialToDelete)?.client_name || 'this client'}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setTestimonialToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={executeDelete}
                className="px-5 py-2 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Testimonial'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
