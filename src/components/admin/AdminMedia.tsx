import React, { useState, useEffect } from 'react';
import { Media } from '../../types';
import { getSupabase } from '../../lib/supabase';
import { Trash2, Copy, Image as ImageIcon, ExternalLink, Play, Film, X } from 'lucide-react';

export function AdminMedia({ setError, showSuccess }: { setError: (msg: string) => void, showSuccess: (msg: string) => void }) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<Media | null>(null);

  const isVideoFile = (item: Media) => {
    const type = (item.file_type || '').toLowerCase();
    const name = (item.file_name || '').toLowerCase();
    return type.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.webm') || name.endsWith('.mov') || name.endsWith('.mkv');
  };

  const fetchMedia = async () => {
    setLoading(true);
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('media').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setMedia(data || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching media');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const uploadMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const { uploadUrl, publicUrl, key } = await response.json();
      
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      
      const { error } = await supabase.from('media').insert([{
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_url: publicUrl,
        storage_path: key || file.name,
        alt_text: file.name
      }]);
      
      if (error) throw error;
      showSuccess("Media uploaded successfully");
      fetchMedia();
    } catch (err: any) {
      setError(err.message || "Failed to upload media");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, storagePath: string) => {
    if (!confirm('Are you sure you want to delete this media?')) return;
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && storagePath) {
        // Attempt R2 deletion
        await fetch('/api/delete-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ key: storagePath })
        }).catch(e => console.error("R2 deletion failed, ignoring", e));
      }

      const { error } = await supabase.from('media').delete().eq('id', id);
      if (error) throw error;
      showSuccess("Media deleted");
      fetchMedia();
    } catch (err: any) {
      setError(err.message || "Error deleting media");
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    showSuccess("URL copied to clipboard");
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading media library...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Media Library</h2>
        <div className="relative">
          <input type="file" accept="image/*,video/*" onChange={uploadMedia} disabled={uploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          <div className={`bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-teal-700 transition shadow-sm ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}>
            <ImageIcon className="w-4 h-4 mr-2" /> {uploading ? 'Uploading...' : 'Upload Media'}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {media.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group">
            <div className="aspect-square relative bg-slate-100 flex items-center justify-center overflow-hidden">
              {item.file_type.startsWith('image/') ? (
                <img src={item.file_url} alt={item.alt_text || item.file_name} className="w-full h-full object-cover" />
              ) : isVideoFile(item) ? (
                <div 
                  className="w-full h-full relative flex items-center justify-center bg-slate-900 cursor-pointer"
                  onClick={() => setPreviewVideo(item)}
                >
                  <video 
                    src={`${item.file_url}#t=0.001`} 
                    preload="metadata" 
                    muted 
                    playsInline 
                    onLoadedMetadata={(e) => {
                      try {
                        e.currentTarget.currentTime = 0.001;
                      } catch (_) {}
                    }}
                    className="w-full h-full object-cover pointer-events-none" 
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white border border-white/20 shadow-md">
                      <Play className="w-5 h-5 ml-0.5 fill-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 pointer-events-none">
                    <Film className="w-2.5 h-2.5" />
                    <span>{item.file_name.toLowerCase().endsWith('.webm') ? 'WEBM' : 'MP4'}</span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 font-medium text-xs">OTHER</div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                {isVideoFile(item) && (
                  <button 
                    onClick={() => setPreviewVideo(item)} 
                    className="p-2 bg-white rounded-full text-slate-800 hover:text-teal-600 transition" 
                    title="Play Video"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                )}
                <button onClick={() => copyToClipboard(item.file_url)} className="p-2 bg-white rounded-full text-slate-800 hover:text-teal-600 transition" title="Copy URL">
                  <Copy className="w-4 h-4" />
                </button>
                <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white rounded-full text-slate-800 hover:text-blue-600 transition" title="Open in new tab">
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button onClick={() => handleDelete(item.id, item.storage_path)} className="p-2 bg-white rounded-full text-slate-800 hover:text-red-600 transition" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-3">
              <p className="text-xs font-medium text-slate-800 truncate" title={item.file_name}>{item.file_name}</p>
              <p className="text-[10px] text-slate-500 mt-1">{(item.file_size / 1024).toFixed(1)} KB • {new Date(item.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
        {media.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            No media found in library.
          </div>
        )}
      </div>

      {previewVideo && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewVideo(null)}
        >
          <div 
            className="relative bg-slate-900 rounded-xl overflow-hidden max-w-3xl w-full shadow-2xl border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-800 text-white">
              <div className="flex items-center space-x-2 truncate">
                <Film className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span className="text-sm font-semibold truncate">{previewVideo.file_name}</span>
              </div>
              <button 
                onClick={() => setPreviewVideo(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-black flex items-center justify-center">
              <video 
                src={previewVideo.file_url} 
                controls 
                autoPlay 
                playsInline
                className="max-h-[70vh] w-full rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
