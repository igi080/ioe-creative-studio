import { motion } from 'motion/react';
import { TestimonialsSection } from '../components/TestimonialsSection';
import { MessageSquare } from 'lucide-react';

export default function Testimonials() {
  return (
    <div className="pt-24 pb-16 min-h-screen">
      {/* Header Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center justify-center p-2 px-4 bg-teal-50 border border-teal-200 rounded-full text-teal-700 text-xs font-bold uppercase tracking-wider mb-4">
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Client Reviews & Feedback
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#0A1128] tracking-tight mb-4">
            What Clients Say About IOE Studio
          </h1>
          <p className="text-slate-600 text-base md:text-lg">
            Real feedback from business leaders, creative directors, and founders we have had the pleasure to build for.
          </p>
        </motion.div>
      </div>

      {/* Main Section */}
      <TestimonialsSection />
    </div>
  );
}
