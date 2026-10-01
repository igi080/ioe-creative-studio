import { motion } from 'motion/react';
import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Showreel() {
  return (
    <div className="pt-24 pb-24 min-h-screen relative overflow-hidden flex flex-col justify-center">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[400px] bg-teal-600/10 blur-[150px] rounded-full pointer-events-none -z-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mb-4">
              Creative Showreel
            </h1>
            <p className="text-lg text-slate-600">
              A cinematic compilation of our best motion graphics and animation work.
            </p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="aspect-video max-w-5xl mx-auto bg-[#F4F1EA] border border-stone-200 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(37,99,235,0.15)] relative group flex items-center justify-center"
        >
          {/* Empty State / Coming Soon */}
          <div className="text-center p-8 z-10">
            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-blue-500/30">
              <Play className="w-8 h-8 text-teal-600 ml-1" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">YOUR CREATIVE SHOWreel</h3>
            <p className="text-slate-600 max-w-md mx-auto">
              Your motion graphics, animation and visual storytelling showcase will appear here once uploaded via the dashboard.
            </p>
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80 pointer-events-none"></div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Link
            to="/portfolio"
            className="inline-flex justify-center items-center px-8 py-3 border border-stone-200 text-slate-700 font-bold rounded-full hover:bg-[#F4F1EA] hover:text-slate-900 transition-all"
          >
            Explore Portfolio Images
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
