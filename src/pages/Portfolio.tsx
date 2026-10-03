import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  Image as ImageIcon, 
  Sparkles, 
  Eye, 
  CheckCircle2, 
  Globe, 
  LayoutGrid, 
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { getSupabase } from '../lib/supabase';
import { Product } from '../types';
import { WEBSITE_DEMOS, DEMO_CATEGORIES, WebsiteDemo } from '../data/websiteDemos';

const clientCategories = [
  'All',
  'Graphic Design',
  'Branding',
  'Motion Graphics',
  'Animation',
  'Web Development',
  'Creative Projects'
];

/**
 * Normalizes category string by trimming, lowercasing, and standardizing separators.
 */
function normalizeCategory(value: string | null | undefined): string {
  if (!value) return '';
  return value.trim().toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ');
}

/**
 * Compares a project's category against the selected category.
 * Case-insensitive, whitespace-tolerant, and handles common variations and category keywords.
 */
function matchesCategory(projectCategory: string | null | undefined, selectedCategory: string): boolean {
  if (selectedCategory === 'All') return true;
  const pNorm = normalizeCategory(projectCategory);
  const sNorm = normalizeCategory(selectedCategory);

  if (!pNorm) return false;
  if (pNorm === sNorm) return true;

  switch (sNorm) {
    case 'graphic design':
      return pNorm === 'graphic design' || pNorm === 'graphic' || pNorm === 'graphics' || pNorm.includes('graphic');
    case 'branding':
      return pNorm === 'branding' || pNorm === 'brand' || pNorm === 'brand identity' || pNorm.includes('brand');
    case 'motion graphics':
      return pNorm === 'motion graphics' || pNorm === 'motion' || pNorm === 'motion graphic' || pNorm.includes('motion');
    case 'animation':
      return pNorm === 'animation' || pNorm === '2d animation' || pNorm === '3d animation' || pNorm === 'anim' || pNorm.includes('animat');
    case 'web development':
      return pNorm === 'web development' || pNorm === 'web dev' || pNorm === 'webdev' || pNorm === 'website' || pNorm === 'web' || pNorm === 'web design' || pNorm.includes('web');
    case 'creative projects':
      return pNorm === 'creative projects' || pNorm === 'creative project' || pNorm === 'creative' || pNorm.includes('creative');
    default:
      return pNorm === sNorm;
  }
}

export default function Portfolio() {
  const [searchParams, setSearchParams] = useSearchParams();

  // SECTION 1: Client Work Category Filter
  const [activeCategory, setActiveCategory] = useState<string>(() => {
    const param = searchParams.get('category');
    if (param) {
      const match = clientCategories.find(c => normalizeCategory(c) === normalizeCategory(param));
      if (match) return match;
    }
    return 'All';
  });

  // SECTION 2: Website Demos Category Filter
  const [activeDemoCategory, setActiveDemoCategory] = useState<string>(() => {
    return searchParams.get('demoCategory') || 'all';
  });

  const [projects, setProjects] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // SEO setup
  useEffect(() => {
    document.title = 'Portfolio & Website Demos | IOE Creative Studio';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Explore client portfolio projects and browse sample website designs created by IOE Creative Studio. Choose a design direction and let us customize it for your business.'
      );
    }
  }, []);

  // Sync state if category param in URL changes
  useEffect(() => {
    const param = searchParams.get('category');
    if (param) {
      const match = clientCategories.find(c => normalizeCategory(c) === normalizeCategory(param));
      if (match && match !== activeCategory) {
        setActiveCategory(match);
      }
    }
    const demoCatParam = searchParams.get('demoCategory');
    if (demoCatParam && demoCatParam !== activeDemoCategory) {
      setActiveDemoCategory(demoCatParam);
    }
  }, [searchParams, activeCategory, activeDemoCategory]);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const supabase = getSupabase(); 
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('isPublished', true)
        .order('order', { ascending: true });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSelectCategory = (category: string) => {
    setActiveCategory(category);
    const newParams = new URLSearchParams(searchParams);
    if (category === 'All') {
      newParams.delete('category');
    } else {
      newParams.set('category', category);
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleSelectDemoCategory = (slug: string) => {
    setActiveDemoCategory(slug);
    const newParams = new URLSearchParams(searchParams);
    if (slug === 'all') {
      newParams.delete('demoCategory');
    } else {
      newParams.set('demoCategory', slug);
    }
    setSearchParams(newParams, { replace: true });
  };

  // Real client-side filtering on existing category field
  const filteredProjects = activeCategory === 'All' 
    ? projects 
    : projects.filter(p => matchesCategory(p.category, activeCategory));

  // Filter website demos
  const filteredDemos = activeDemoCategory === 'all'
    ? WEBSITE_DEMOS
    : WEBSITE_DEMOS.filter(d => d.categorySlug === activeDemoCategory);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="pt-24 pb-24 min-h-screen bg-white relative overflow-hidden">
      {/* Subtle background ambient gradients */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[140px] rounded-full pointer-events-none -z-10"></div>
      <div className="absolute top-[40%] left-0 w-[600px] h-[600px] bg-purple-600/5 blur-[160px] rounded-full pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>IOE Showcase</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mb-4">
              Our <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Portfolio</span> & Website Demos
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8">
              Explore completed client solutions from IOE Creative Studio or browse our live website demo concepts ready to be customized for your organization.
            </p>

            {/* Quick Section Switcher Buttons */}
            <div className="inline-flex items-center p-1.5 bg-stone-100 rounded-2xl border border-stone-200 shadow-sm">
              <button
                type="button"
                onClick={() => scrollToSection('our-work')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-600 hover:bg-white transition-all cursor-pointer"
              >
                <LayoutGrid className="w-4 h-4 text-blue-600" />
                <span>Section 1: Our Work</span>
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('website-demos')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white text-blue-700 shadow-sm border border-stone-200 hover:bg-blue-50 transition-all cursor-pointer"
              >
                <Globe className="w-4 h-4 text-purple-600" />
                <span>Section 2: Website Demos</span>
                <span className="text-[10px] font-extrabold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md">NEW</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1 — OUR WORK (Dynamic from Supabase `products` table)             */}
        {/* ========================================================================= */}
        <section id="our-work" className="pt-8 pb-20 border-b border-stone-200 scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-1">
                Section 1 · Client Case Studies
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Our Work
              </h2>
              <p className="text-slate-600 text-sm mt-1 max-w-xl">
                Real client projects engineered and delivered across branding, web development, motion graphics, and creative technology.
              </p>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
            </div>
          </div>

          {/* Client Project Category Filter */}
          <div className="flex flex-wrap gap-2 mb-10">
            {clientCategories.map((category) => {
              const isSelected = activeCategory === category;
              const categoryId = category.toLowerCase().replace(/\s+/g, '-');
              return (
                <button
                  type="button"
                  id={`filter-category-${categoryId}`}
                  key={category}
                  onClick={() => handleSelectCategory(category)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
                      : 'bg-stone-50 text-slate-600 hover:text-slate-900 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {/* Client Projects Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-stone-50 border border-stone-200 rounded-3xl p-12 text-center max-w-xl mx-auto">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Our Creative Showcase</h3>
              <p className="text-slate-600 text-sm mb-6">
                Client projects will appear here as they are published from the IOE Studio Dashboard.
              </p>
              <Link
                to="/request-quote"
                className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all"
              >
                Start Your Project
              </Link>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="bg-stone-50 border border-stone-200 rounded-3xl p-12 text-center max-w-xl mx-auto">
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                No projects in "{activeCategory}" yet
              </h3>
              <p className="text-slate-600 text-sm mb-6">
                Try selecting another category or browse our sample website demos below.
              </p>
              <button
                type="button"
                onClick={() => handleSelectCategory('All')}
                className="px-5 py-2 bg-stone-200 text-slate-800 text-xs font-bold rounded-xl hover:bg-stone-300 transition-colors"
              >
                View All Categories
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, delay: index * 0.02 }}
                    className="group rounded-2xl overflow-hidden border border-stone-200 hover:border-blue-300 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col bg-white"
                  >
                    <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden flex items-center justify-center">
                      {project.image ? (
                        project.image.match(/\.(mp4|webm|ogg)(\?.*)?$/i) ? (
                          <video 
                            src={project.image} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            autoPlay muted loop playsInline
                          />
                        ) : (
                          <img 
                            src={project.image} 
                            alt={project.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (target.src !== '/images/ioe_branding_showcase.jpg') {
                                target.src = '/images/ioe_branding_showcase.jpg';
                              }
                            }}
                          />
                        )
                      ) : (
                        <ImageIcon className="w-10 h-10 text-slate-400" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-80"></div>
                      <span className="absolute bottom-3 left-3 text-[11px] font-bold text-white uppercase tracking-wider bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-md">
                        {project.category || 'Client Project'}
                      </span>
                    </div>
                    
                    <div className="p-6 flex-grow flex flex-col">
                      <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {project.name}
                      </h3>
                      <p className="text-slate-600 mb-5 line-clamp-2 text-xs leading-relaxed">
                        {project.description}
                      </p>
                      
                      <div className="mt-auto pt-3 border-t border-stone-100">
                        <Link 
                          to={`/portfolio/${project.id}`}
                          className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          View Project Details <ArrowRight className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2 — WEBSITE DEMOS (Interactive concepts with dedicated previews)  */}
        {/* ========================================================================= */}
        <section id="website-demos" className="pt-20 scroll-mt-24">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold uppercase tracking-wider mb-3">
              <Globe className="w-3.5 h-3.5 text-purple-600" />
              <span>Section 2 · Ready-to-Customize</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Website Demos
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Explore sample website designs created by IOE Creative Studio. Choose a design direction and let us customize it for your business.
            </p>
          </div>

          {/* 10 Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar justify-start sm:justify-center">
            {DEMO_CATEGORIES.map((cat) => {
              const isSelected = activeDemoCategory === cat.slug;
              return (
                <button
                  type="button"
                  key={cat.slug}
                  onClick={() => handleSelectDemoCategory(cat.slug)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 font-bold'
                      : 'bg-stone-50 text-slate-600 hover:text-slate-900 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Website Demo Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDemos.map((demo, idx) => {
              const quoteUrl = `/request-quote?demo=${encodeURIComponent(demo.title)}&category=${encodeURIComponent(demo.category)}`;
              const detailUrl = `/portfolio/demos/${demo.slug}`;

              return (
                <motion.div
                  key={demo.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="group rounded-3xl overflow-hidden border border-stone-200 hover:border-blue-400 bg-white shadow-md hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
                >
                  {/* Card Visual Header with Badge */}
                  <div className="aspect-[16/10] bg-stone-100 relative overflow-hidden">
                    <img
                      src={demo.image}
                      alt={demo.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== '/images/ioe_web_showcase.jpg') {
                          target.src = '/images/ioe_web_showcase.jpg';
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>

                    {/* Small Label: DEMO or CONCEPT */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-md bg-white/95 backdrop-blur-md text-blue-700 font-extrabold text-[10px] tracking-wider uppercase shadow-sm">
                        {demo.badge}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-white font-medium text-[10px]">
                        Sample Design
                      </span>
                    </div>

                    {/* Category Overlay */}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <span className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider block mb-1">
                        {demo.category}
                      </span>
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-200 transition-colors leading-snug drop-shadow-sm">
                        {demo.title}
                      </h3>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-grow flex flex-col">
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-5">
                      {demo.shortDescription}
                    </p>

                    {/* Key Features Chips */}
                    <div className="mb-6">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Features Included:
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {demo.features.slice(0, 6).map((feat, fIdx) => (
                          <div key={fIdx} className="flex items-center gap-1.5 text-[11px] text-slate-700">
                            <CheckCircle2 className="w-3 h-3 text-blue-600 shrink-0" />
                            <span className="truncate">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-auto pt-4 border-t border-stone-100 flex items-center gap-2.5">
                      {demo.isAvailable ? (
                        <>
                          <Link
                            to={detailUrl}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800 text-xs font-bold text-center transition-colors flex items-center justify-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Demo</span>
                          </Link>
                          <Link
                            to={quoteUrl}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold text-center shadow-sm hover:shadow transition-all flex items-center justify-center gap-1"
                          >
                            <span>Request This</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </>
                      ) : (
                        <Link
                          to={quoteUrl}
                          className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <span>Request Custom Build</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Help Banner at the Bottom of Demos */}
          <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/80 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">Need a unique website outside these demos?</h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  We build fully custom websites with specialized workflows, databases, APIs, and payment systems.
                </p>
              </div>
            </div>
            <Link
              to="/request-quote"
              className="whitespace-nowrap px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Request Custom Website</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
