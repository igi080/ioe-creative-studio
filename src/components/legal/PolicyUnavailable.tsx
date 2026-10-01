import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, ArrowLeft, Mail, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PolicyUnavailableProps {
  slug?: string;
  title?: string;
}

export const PolicyUnavailable: React.FC<PolicyUnavailableProps> = ({ slug, title }) => {
  return (
    <div id="policy-unavailable-state" className="pt-24 pb-24 min-h-[75vh] flex items-center justify-center relative overflow-hidden bg-[#FAFAF8]">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -right-[15%] w-[450px] h-[450px] bg-amber-500/5 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-1/3 -left-[15%] w-[450px] h-[450px] bg-slate-500/5 blur-[140px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-xl mx-auto px-4 sm:px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-[#FFFFFF] border border-stone-200 rounded-3xl p-8 sm:p-12 shadow-sm"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-6 text-amber-600 shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/80 px-3.5 py-1.5 rounded-full mb-4">
            Document Offline
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
            {title ? `${title} Unavailable` : 'Policy Currently Unavailable'}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-8 max-w-md mx-auto">
            This document is currently unpublished or undergoing administrative review. Please check back shortly or get in touch with IOE Creative Studio directly for any inquiries.
          </p>

          {slug && (
            <div className="mb-6 inline-block bg-slate-50 border border-stone-200 rounded-lg px-3 py-1 text-xs font-mono text-slate-500">
              document ref: {slug}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              id="btn-policy-offline-home"
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800 transition min-h-[44px]"
            >
              <Home className="w-4 h-4" />
              Return Home
            </Link>

            <Link
              id="btn-policy-offline-contact"
              to="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FFFFFF] border border-stone-300 text-slate-700 rounded-full text-xs font-semibold hover:bg-stone-50 transition min-h-[44px]"
            >
              <Mail className="w-4 h-4" />
              Contact Studio
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
