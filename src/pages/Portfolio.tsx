import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { getSupabase } from '../lib/supabase';
import { Product } from '../types';

const categories = [
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
  const [activeCategory, setActiveCategory] = useState<string>(() => {
    const param = searchParams.get('category');
    if (param) {
      const match = categories.find(c => normalizeCategory(c) === normalizeCategory(param));
      if (match) return match;
    }
    return 'All';
  });
  const [projects, setProjects] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync state if category param in URL changes
  useEffect(() => {
    const param = searchParams.get('category');
    if (param) {
      const match = categories.find(c => normalizeCategory(c) === normalizeCategory(param));
      if (match && match !== activeCategory) {
        setActiveCategory(match);
      }
    }
  }, [searchParams, activeCategory]);

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
    if (category === 'All') {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('category');
      setSearchParams(newParams, { replace: true });
    } else {
      setSearchParams({ category }, { replace: true });
    }
  };

  // Real client-side filtering on existing category field
  const filteredProjects = activeCategory === 'All' 
    ? projects 
    : projects.filter(p => matchesCategory(p.category, activeCategory));

  return (
    <div className="pt-24 pb-24 min-h-screen relative overflow-hidden">
      <div className="absolute top-1/4 -right-[20%] w-[600px] h-[600px] bg-violet-600/10 blur-[150px] rounded-full pointer-events-none -z-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
              Our <span className="bg-gradient-to-r from-teal-600 via-blue-600 to-violet-600 bg-clip-text text-transparent">Portfolio</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
              Explore a curated selection of our finest creative designs and technical implementations.
            </p>
          </motion.div>
        </div>

        {/* Category Filter Controls */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {categories.map((category) => {
            const isSelected = activeCategory === category;
            const categoryId = category.toLowerCase().replace(/\s+/g, '-');
            return (
              <button
                type="button"
                id={`filter-category-${categoryId}`}
                key={category}
                onClick={() => handleSelectCategory(category)}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'bg-teal-600 text-slate-900 shadow-[0_0_15px_rgba(37,99,235,0.4)] font-bold'
                    : 'bg-[#FFFFFF] text-slate-600 hover:text-slate-900 hover:bg-[#F4F1EA] border border-stone-200'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : projects.length === 0 ? (
          <div 
            key="empty-projects-global"
            className="bg-[#FFFFFF] border border-stone-200 shadow-sm rounded-3xl p-16 text-center max-w-2xl mx-auto shadow-2xl"
          >
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-teal-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Our Creative Showcase</h3>
            <p className="text-slate-600 mb-8 text-lg">
              Portfolio projects will appear here as they are published from the IOE Studio Dashboard.
            </p>
            <Link
              to="/contact"
              className="inline-flex justify-center items-center px-8 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-slate-900 font-bold rounded-full hover:shadow-[0_8px_20px_rgba(13,148,136,0.2)] transition-all"
            >
              Start Your Project
            </Link>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div 
            key={`empty-category-${activeCategory}`}
            id="empty-category-notice"
            className="bg-[#FFFFFF] border border-stone-200 shadow-sm rounded-3xl p-16 text-center max-w-2xl mx-auto shadow-2xl"
          >
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-teal-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">
              No projects in this category yet.
            </h3>
            <p className="text-slate-600 mb-8 text-lg">
              Explore other categories to see our creative work, or start a new project with our team.
            </p>
            <Link
              to="/contact"
              className="inline-flex justify-center items-center px-8 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-slate-900 font-bold rounded-full hover:shadow-[0_8px_20px_rgba(13,148,136,0.2)] transition-all"
            >
              Start Your Project
            </Link>
          </div>
        ) : (
          <div key="portfolio-projects-grid" className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                  className="group relative rounded-3xl overflow-hidden border border-stone-200 shadow-lg hover:shadow-xl shadow-blue-500/10 hover:-translate-y-2 transition-all duration-500 flex flex-col"
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
                      <ImageIcon className="w-12 h-12 text-slate-700" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90"></div>
                  </div>
                  
                  <div className="p-8 flex-grow flex flex-col relative z-10 -mt-6">
                    <span className="inline-block px-3 py-1 bg-slate-100 backdrop-blur-md border border-stone-200 rounded-full text-[10px] font-bold text-teal-700 tracking-wider uppercase mb-4 self-start">
                      {project.category || 'Project'}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-teal-600 transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-slate-600 mb-6 line-clamp-2 text-sm leading-relaxed">
                      {project.description}
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-stone-200">
                      <Link 
                        to={`/portfolio/${project.id}`}
                        className="inline-flex items-center text-sm font-semibold text-slate-900 group-hover:text-teal-600 transition-colors"
                      >
                        View Project Details <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
