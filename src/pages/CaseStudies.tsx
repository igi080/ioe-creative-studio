import { motion } from 'motion/react';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CaseStudies() {
  return (
    <div className="pt-24 pb-24 min-h-screen relative overflow-hidden flex flex-col justify-center">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-600/10 blur-[150px] rounded-full pointer-events-none -z-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-[#FFFFFF] border border-stone-200 shadow-sm shadow-sm rounded-3xl p-12 md:p-20 text-center max-w-3xl mx-auto shadow-2xl"
        >
          <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-blue-500/20">
            <BookOpen className="w-10 h-10 text-teal-600" />
          </div>
          
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            CASE STUDIES <br/><span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">COMING SOON</span>
          </h1>
          
          <p className="text-slate-600 mb-10 text-lg md:text-xl leading-relaxed">
            Detailed project case studies, process breakdowns, and client success stories will be published here as our portfolio grows.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/portfolio"
              className="inline-flex justify-center items-center px-8 py-3.5 bg-gradient-to-r from-teal-600 to-blue-600 text-slate-900 font-bold rounded-full hover:shadow-[0_8px_20px_rgba(13,148,136,0.2)] transition-all hover:scale-105"
            >
              View Portfolio
            </Link>
            <Link
              to="/"
              className="inline-flex justify-center items-center px-8 py-3.5 border border-stone-200 text-slate-900 font-bold rounded-full hover:bg-[#F4F1EA] transition-all"
            >
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
