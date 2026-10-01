import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { getSupabase } from '../lib/supabase';
import { Product } from '../types';
import { AnimatedLogo } from '../components/AnimatedLogo';
import { ProfilePhoto } from '../components/ProfilePhoto';
import { TestimonialsSection } from '../components/TestimonialsSection';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useHomeSections } from '../hooks/useHomeSections';
import { 
  ArrowRight, Palette, Code, Video, Sparkles, Monitor, Layers, 
  Image as ImageIcon, Box, Megaphone, Smartphone, CheckCircle2 
} from 'lucide-react';

export default function Home() {
  const [featuredProjects, setFeaturedProjects] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings: homeSettings } = useSiteSettings('home');
  const { sections: homeSections, sectionsList: homeSectionsList } = useHomeSections();
  const { settings: aboutSettings } = useSiteSettings('about');

  useEffect(() => {
    async function fetchFeatured() {
      const supabase = getSupabase();
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('isPublished', true)
          .eq('isFeatured', true)
          .order('order', { ascending: true })
          .limit(3);
        if (error) throw error;
        setFeaturedProjects(data || []);
      } catch (err) {
        console.error("Error fetching featured", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  return (
    <div className="min-h-screen">
      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-40 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-300/30 blur-[120px]"></div>
          <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[100px]"></div>
          <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[120px]"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mb-8"
            >
              <AnimatedLogo className="w-24 h-24 mx-auto md:w-32 md:h-32" />
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#0A1128] mb-6 leading-tight"
            >
              {homeSections.hero?.title ? (
                <span dangerouslySetInnerHTML={{ __html: homeSections.hero.title }} />
              ) : homeSettings.home_hero_title_html ? (
                <div dangerouslySetInnerHTML={{ __html: homeSettings.home_hero_title_html }} />
              ) : (
                <>
                  PREMIUM DIGITAL <br className="hidden md:block" />
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">EXCELLENCE</span>
                </>
              )}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-xl text-slate-700 mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              {homeSections.hero?.subtitle || homeSettings.home_hero_subtitle || 'A leading Nigerian Creative Studio combining stunning visual identity, motion graphics, animation and full-stack web development.'}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-5 justify-center"
            >
              <Link
                to="/portfolio"
                className="relative group overflow-hidden inline-flex justify-center items-center px-8 py-4 text-base font-bold rounded-full text-[#0A1128] bg-[#F4F1EA] border border-stone-200 hover:bg-slate-100 backdrop-blur-sm transition-all hover:scale-105"
              >
                VIEW OUR WORK
              </Link>
              <Link
                to={homeSections.hero?.button_url || homeSettings.home_primary_btn_url || "/contact"}
                className="relative group overflow-hidden inline-flex justify-center items-center px-8 py-4 text-base font-bold rounded-full text-white bg-gradient-to-r from-teal-600 to-blue-600 shadow-[0_8px_20px_rgba(13,148,136,0.2)] hover:shadow-[0_12px_25px_rgba(37,99,235,0.3)] transition-all hover:scale-105"
              >
                {homeSections.hero?.button_text || homeSettings.home_primary_btn_text || "START A PROJECT"} <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"></div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* RECENT WORK / SHOWCASE */}
      <section className="py-24 relative border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <h2 className="text-sm font-bold text-teal-600 tracking-widest uppercase mb-2">Our Showcase</h2>
              <h3 className="text-3xl font-extrabold text-[#0A1128]">Featured Projects</h3>
            </div>
            <Link to="/portfolio" className="hidden md:inline-flex items-center text-slate-700 hover:text-[#0A1128] font-medium transition-colors">
              Explore All <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-full flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : featuredProjects.length === 0 ? (
              <div className="col-span-full text-center text-slate-500 py-10 bg-slate-50 rounded-2xl border border-stone-200">
                No featured projects currently available.
              </div>
            ) : featuredProjects.map((project, index) => (
              <motion.div 
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group relative rounded-2xl overflow-hidden border border-stone-200 hover:border-blue-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl shadow-blue-500/10 flex flex-col h-full"
              >
                <div className="aspect-[4/3] bg-[#F4F1EA] relative overflow-hidden flex items-center justify-center">
                  {project.image ? (
                    project.image.match(/\.(mp4|webm|ogg)(\?.*)?$/i) ? (
                      <video 
                        src={project.image} 
                        className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                        autoPlay muted loop playsInline
                      />
                    ) : (
                      <img 
                        src={project.image} 
                        alt={project.name} 
                        className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== '/images/ioe_branding_showcase.jpg') {
                            target.src = '/images/ioe_branding_showcase.jpg';
                          }
                        }}
                      />
                    )
                  ) : (
                    <ImageIcon className="w-12 h-12 text-slate-400" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-90"></div>
                </div>
                
                <div className="p-6 flex-grow flex flex-col relative z-10 bg-white">
                  <span className="inline-block px-3 py-1 bg-slate-100 border border-stone-200 rounded-full text-[10px] font-bold text-blue-600 tracking-wider uppercase mb-3 self-start">
                    {project.category || 'Project'}
                  </span>
                  <h4 className="text-xl font-bold text-[#0A1128] mb-2 group-hover:text-teal-600 transition-colors">
                    {project.name}
                  </h4>
                  <p className="text-[#334155] text-sm line-clamp-2 leading-relaxed mb-4">
                    {project.description}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-stone-200">
                    <Link 
                      to={`/portfolio/${project.id}`}
                      className="inline-flex items-center text-sm font-semibold text-[#0A1128] group-hover:text-teal-600 transition-colors"
                    >
                      View Project Details <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link to="/portfolio" className="inline-flex items-center text-slate-700 hover:text-[#0A1128] font-medium transition-colors">
              Explore All Projects <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="py-24 relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-blue-900/10 to-transparent pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative w-full flex justify-center lg:block mb-10 lg:mb-0"
            >
              <ProfilePhoto className="w-64 h-64 sm:w-80 sm:h-80 lg:w-full lg:max-w-md aspect-square" />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-sm font-bold text-teal-600 tracking-widest uppercase mb-2">About Us</h2>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-[#0A1128] mb-6 leading-tight">
                {aboutSettings.about_name || "Where Creative Art Design Meets Modern Web Development"}
              </h3>
              <p className="text-lg text-[#334155] mb-8 leading-relaxed">
                {aboutSettings.about_bio_intro || "IOE Creative Studio is a professional digital agency specializing in crafting premium visual identities and building robust technical solutions. We blend aesthetics with functionality to deliver measurable impact."}
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                {[
                  'Creative Art Design',
                  'Motion Graphics & Animation',
                  'Full-Stack Web Dev',
                  'Brand Architecture'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 hover:border-blue-500/30 transition-colors">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
                    <span className="font-medium text-slate-800 text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <Link
                to="/about"
                className="inline-flex items-center text-teal-600 font-bold hover:text-blue-300 transition-colors"
              >
                Learn More About Us <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section className="py-24 border-t border-b border-stone-200 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-indigo-600/5 blur-[150px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold text-teal-600 tracking-widest uppercase mb-2">Professional Services</h2>
            <p className="text-3xl font-extrabold text-[#0A1128] sm:text-4xl mb-4">Comprehensive Digital Solutions</p>
            <p className="text-lg text-[#334155]">From visual brand identities to robust software architecture, we deliver end-to-end creative and technical excellence.</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Creative Art Design', icon: Palette, desc: 'Premium visual identities and branding materials.' },
              { title: 'Motion Graphics', icon: Video, desc: 'Engaging animated content for marketing.' },
              { title: 'Full-Stack Dev', icon: Code, desc: 'Robust web applications and SaaS platforms.' },
              { title: 'Brand Identity', icon: Layers, desc: 'Cohesive branding systems and guidelines.' },
            ].map((service, index) => (
              <motion.div 
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative rounded-2xl p-6 border border-stone-200 hover:border-indigo-500/50 hover:bg-[#0c1222] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_-10px_rgba(79,70,229,0.3)]"
              >
                <div className="w-12 h-12 bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-500 group-hover:text-[#0A1128] transition-colors duration-300">
                  <service.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0A1128] mb-3">{service.title}</h3>
                <p className="text-[#334155] text-sm leading-relaxed">{service.desc}</p>
                <div className="mt-6 flex justify-end">
                  <ArrowRight className="w-5 h-5 text-[#334155] group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Link
              to="/services"
              className="inline-flex justify-center items-center px-8 py-3.5 border border-stone-200 text-base font-medium rounded-full text-[#0A1128] bg-[#F4F1EA] hover:bg-slate-100 transition-colors backdrop-blur-sm"
            >
              Explore All Services
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <TestimonialsSection />

      {/* CUSTOM HOME SECTIONS (configured in Admin Home) */}
      {homeSectionsList && homeSectionsList.filter(s => s.section_key !== 'hero' && s.section_key !== 'cta').map((sec) => (
        <section key={sec.id} className="py-20 border-t border-stone-200 relative overflow-hidden bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className={`grid ${sec.image ? 'lg:grid-cols-2 gap-12' : 'max-w-4xl mx-auto text-center'} items-center`}>
              {sec.image && (
                <div className="rounded-2xl overflow-hidden shadow-lg border border-stone-200">
                  <img src={sec.image} alt={sec.title || sec.section_key} className="w-full h-auto object-cover max-h-[450px]" />
                </div>
              )}
              <div>
                {sec.subtitle && (
                  <h2 className="text-sm font-bold text-teal-600 tracking-widest uppercase mb-2">{sec.subtitle}</h2>
                )}
                {sec.title && (
                  <h3 className="text-3xl sm:text-4xl font-extrabold text-[#0A1128] mb-6 leading-tight">
                    <span dangerouslySetInnerHTML={{ __html: sec.title }} />
                  </h3>
                )}
                {sec.content && (
                  <p className="text-lg text-[#334155] mb-8 leading-relaxed whitespace-pre-line">{sec.content}</p>
                )}
                {sec.button_text && (
                  <Link
                    to={sec.button_url || "/contact"}
                    className="inline-flex items-center px-8 py-3.5 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-bold rounded-full shadow hover:shadow-lg transition-all hover:scale-105"
                  >
                    {sec.button_text} <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* CTA SECTION */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-blue-50"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-300/30 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0A1128] mb-6 tracking-tight"
          >
            {homeSections.cta?.title || 'Ready to Bring Your Ideas to Life?'}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-slate-700 mb-10 max-w-2xl mx-auto"
          >
            {homeSections.cta?.content || homeSections.cta?.subtitle || "Let's discuss how our creative design and technical expertise can help your business thrive."}
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to={homeSections.cta?.button_url || "/contact"}
              className="inline-flex justify-center items-center px-8 py-4 text-base font-bold rounded-full text-white bg-gradient-to-r from-teal-600 to-blue-600 shadow-[0_8px_20px_rgba(13,148,136,0.2)] hover:shadow-[0_12px_25px_rgba(37,99,235,0.3)] transition-all hover:scale-105"
            >
              {homeSections.cta?.button_text || "START A PROJECT"}
            </Link>
            <Link
              to="/contact"
              className="inline-flex justify-center items-center px-8 py-4 border border-slate-300 text-base font-bold rounded-full text-[#0A1128] hover:bg-slate-100 backdrop-blur-sm transition-all"
            >
              CONTACT US
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
