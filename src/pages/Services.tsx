import { motion } from 'motion/react';
import { Palette, PenTool, Video, Aperture, Layers, Code, Layout, Sparkles, ArrowRight, MonitorSmartphone, Cpu, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabase';
import { Service } from '../types';
import { trackServiceView, trackCtaClick } from '../lib/analytics';

const iconMap: Record<string, any> = {
  Palette, PenTool, Video, Aperture, Layers, Code, Layout, Cpu, MonitorSmartphone
};

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchServices() {
      const supabase = getSupabase();
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        if (error) throw error;
        setServices(data || []);
      } catch (err) {
        console.error("Error fetching services", err);
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
    trackServiceView('All Services');
  }, []);

  return (
    <div className="pt-24 pb-24 min-h-screen relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-teal-600/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-sm font-bold text-teal-600 tracking-widest uppercase mb-3">Our Capabilities</h2>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
              Professional Services
            </h1>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Comprehensive digital solutions blending creative artistry with robust full-stack development.
            </p>
          </motion.div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading services...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {services.map((service, index) => {
              const Icon = iconMap[service.icon] || CheckCircle;
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: Math.min(index * 0.1, 0.5) }}
                  className="group relative rounded-3xl p-8 border border-stone-200 hover:border-stone-200 overflow-hidden hover:-translate-y-2 transition-all duration-300"
                >
                  {/* Hover Gradient Background */}
                  <div className={`absolute inset-0 pointer-events-none bg-gradient-to-br ${service.color_gradient || 'from-slate-100 to-slate-200'} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`}></div>
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="w-14 h-14 bg-[#F4F1EA] border border-stone-200 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                      {service.image ? (
                        <img 
                          src={service.image} 
                          alt={service.title} 
                          className="w-full h-full object-cover rounded-2xl" 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== '/images/ioe_branding_showcase.jpg') {
                              target.src = '/images/ioe_branding_showcase.jpg';
                            }
                          }}
                        />
                      ) : (
                        <Icon className="w-6 h-6 text-slate-900" />
                      )}
                      <div className={`absolute inset-0 bg-gradient-to-br ${service.color_gradient || 'from-slate-100 to-slate-200'} opacity-20 blur-md rounded-2xl`}></div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all">
                      {service.title}
                    </h3>
                    <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                      {service.description}
                    </p>
                    
                    <div className="space-y-2 mb-8">
                      {(service.features || []).map((feature, i) => (
                        <div key={i} className="flex items-center text-xs text-slate-700">
                          <Sparkles className="w-3 h-3 mr-2 text-teal-600 opacity-70 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-stone-200">
                      <Link 
                        to={`/portfolio?category=${encodeURIComponent(service.title)}`}
                        onClick={() => window.scrollTo(0, 0)}
                        className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors relative z-20"
                      >
                        View Work
                      </Link>
                      <Link 
                        to={`/contact?service=${encodeURIComponent(service.title)}`}
                        onClick={() => {
                          trackCtaClick(`Request Service: ${service.title}`, 'services_grid');
                          window.scrollTo(0, 0);
                        }}
                        className="flex items-center text-sm font-semibold text-teal-600 hover:text-blue-300 transition-colors group/btn relative z-20"
                      >
                        Request
                        <ArrowRight className="ml-1 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
