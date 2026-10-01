import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Star, Quote, Video as VideoIcon } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { Testimonial } from '../types';

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTestimonials() {
      const supabase = getSupabase();
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;

        const formatted = (data || []).map((t: any) => ({
          ...t,
          content: t.testimonial || t.content || '',
          testimonial: t.testimonial || t.content || '',
          image: t.client_image || t.image || '',
          client_image: t.client_image || t.image || '',
        }));

        setTestimonials(formatted);
      } catch (err) {
        console.error('Error loading testimonials for public view:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTestimonials();
  }, []);

  const isVideoUrl = (url?: string) => {
    if (!url) return false;
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
  };

  // If loading, show clean subtle skeleton or return null
  if (loading) {
    return (
      <section id="testimonials" className="py-24 relative border-t border-stone-200 overflow-hidden bg-[#FDFBF7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-sm text-slate-500">Loading client testimonials...</p>
        </div>
      </section>
    );
  }

  // If no active testimonials exist, display clean appropriate empty state gracefully
  if (testimonials.length === 0) {
    return (
      <section id="testimonials" className="py-20 relative border-t border-stone-200 overflow-hidden bg-[#FDFBF7]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-sm font-bold text-teal-600 tracking-widest uppercase mb-2">Client Testimonials</h2>
          <h3 className="text-3xl font-extrabold text-[#0A1128] mb-4">What Our Clients Say</h3>
          <p className="text-slate-600 text-sm max-w-md mx-auto">
            Client reviews and case highlights are being curated. Check back soon or contact us to hear directly from our partners.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="testimonials" className="py-24 relative border-t border-stone-200 overflow-hidden bg-[#FDFBF7]">
      {/* Background accents */}
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-bold text-teal-600 tracking-widest uppercase mb-2">
            Client Testimonials
          </h2>
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0A1128] tracking-tight mb-4">
            Trusted by Creators & Visionaries
          </h3>
          <p className="text-lg text-slate-600 leading-relaxed">
            Read firsthand experiences from our partners who have collaborated with IOE Creative Studio for branding, visual identity, and software development.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((t, index) => {
            const mediaUrl = t.client_image || t.image;
            const isVideo = isVideoUrl(mediaUrl);
            const reviewText = t.testimonial || t.content || '';
            const rating = Math.min(5, Math.max(1, t.rating || 5));

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-7 border border-stone-200 hover:border-teal-500/40 hover:shadow-xl shadow-slate-900/5 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Quote Icon & Stars */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                      <Quote className="w-5 h-5 fill-teal-600/20" />
                    </div>
                    <div className="flex items-center space-x-0.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Video Media if attached */}
                  {mediaUrl && isVideo && (
                    <div className="mb-5 rounded-xl overflow-hidden border border-stone-200 bg-black aspect-video relative group/video">
                      <video
                        src={mediaUrl}
                        controls
                        playsInline
                        className="w-full h-full object-cover"
                        preload="metadata"
                      />
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-full flex items-center pointer-events-none">
                        <VideoIcon className="w-3 h-3 mr-1" /> Client Video
                      </div>
                    </div>
                  )}

                  {/* Review text */}
                  <p className="text-slate-700 text-base leading-relaxed mb-6 italic">
                    "{reviewText}"
                  </p>
                </div>

                {/* Client info footer */}
                <div className="pt-5 border-t border-stone-100 flex items-center space-x-3.5 mt-auto">
                  {mediaUrl && !isVideo ? (
                    <img
                      src={mediaUrl}
                      alt={t.client_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-teal-500/20 shadow-xs flex-shrink-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== '/images/ioe_client_1.jpg') {
                          target.src = '/images/ioe_client_1.jpg';
                        }
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm shadow-xs">
                      {t.client_name
                        .split(' ')
                        .map(n => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase() || 'C'}
                    </div>
                  )}

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight group-hover:text-teal-600 transition-colors">
                      {t.client_name}
                    </h4>
                    {t.client_role ? (
                      <p className="text-xs text-slate-500 mt-0.5">{t.client_role}</p>
                    ) : (
                      <p className="text-xs text-teal-600 font-medium mt-0.5">Verified Client</p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
