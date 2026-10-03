import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { Product } from '../types';
import { WEBSITE_DEMOS } from '../data/websiteDemos';

export default function PortfolioDetail() {
  const { id, slug } = useParams();
  const projectId = id || slug;
  const navigate = useNavigate();
  const [project, setProject] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProject() {
      if (!projectId) return;

      // Check if this slug or ID belongs to any website demo (all 10 categories supported)
      const matchedDemo = WEBSITE_DEMOS.find(d => d.slug === projectId || d.id === projectId);
      if (matchedDemo) {
        navigate(`/portfolio/demos/${matchedDemo.slug}`, { replace: true });
        return;
      }

      const supabase = getSupabase();
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', projectId)
          .single();
          
        if (error) throw error;
        if (!data) {
          navigate('/portfolio');
          return;
        }
        setProject(data);
      } catch (err) {
        console.error("Error fetching project:", err);
        navigate('/portfolio');
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [projectId, navigate]);

  if (loading) {
    return (
      <div className="pt-32 pb-20 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="pt-24 pb-20 lg:pt-32 lg:pb-32 bg-[#FFFFFF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Link to="/portfolio" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8 font-medium transition-colors">
          <ArrowLeft className="mr-2 w-5 h-5" /> Back to Portfolio
        </Link>

        {/* Project Header */}
        <div className="mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight"
          >
            {project.name}
          </motion.h1>
          <div className="flex flex-wrap gap-4 text-sm font-bold uppercase tracking-wider text-gray-500">
            <span className="bg-gray-100 px-3 py-1 rounded-full text-teal-600">{project.category || 'Project'}</span>
            {project.price && (
              <span className="bg-gray-100 px-3 py-1 rounded-full">Value: {project.price}</span>
            )}
          </div>
        </div>

        {/* Cover Image */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="aspect-[16/9] md:aspect-[21/9] w-full rounded-3xl overflow-hidden bg-[#F4F1EA] mb-16 shadow-2xl relative flex items-center justify-center"
        >
          {project.image ? (
            project.image.match(/\.(mp4|webm|ogg)(\?.*)?$/i) ? (
              <video 
                src={project.image} 
                className="w-full h-full object-contain"
                autoPlay muted loop playsInline controls
              />
            ) : (
              <img 
                src={project.image} 
                alt={project.name} 
                className="w-full h-full object-contain"
              />
            )
          ) : (
            <div className="text-slate-400">No media available</div>
          )}
        </motion.div>

        {/* Project Content */}
        <div className="grid lg:grid-cols-12 gap-16 mb-20">
          <div className="lg:col-span-8 space-y-12">
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Project Overview</h3>
              <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-line">
                {project.description || 'No description available for this project.'}
              </p>
            </section>
          </div>
          
          <div className="lg:col-span-4">
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 sticky top-32">
              <h4 className="text-xl font-bold text-gray-900 mb-6">Project Details</h4>
              <dl className="space-y-6">
                <div>
                  <dt className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Category</dt>
                  <dd className="text-gray-900 font-medium">{project.category}</dd>
                </div>
                {project.price && (
                  <div>
                    <dt className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Value / Price</dt>
                    <dd className="text-gray-900 font-medium">{project.price}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Status</dt>
                  <dd className="text-gray-900 font-medium">Completed & Published</dd>
                </div>
              </dl>
              
              <div className="mt-10">
                <Link to="/contact" className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-bold rounded-lg text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-md">
                  Request Similar Project
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Next/Prev Navigation */}
        <div className="border-t border-gray-200 pt-10 flex justify-between items-center">
          <Link to="/portfolio" className="inline-flex items-center text-gray-600 font-semibold hover:text-teal-600 transition-colors">
            <ArrowLeft className="mr-2 w-5 h-5" /> Back to Gallery
          </Link>
        </div>
      </div>
    </div>
  );
}
