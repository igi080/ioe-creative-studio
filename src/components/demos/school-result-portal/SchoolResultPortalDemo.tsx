import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  Monitor, 
  Sparkles, 
  ShieldCheck, 
  School,
  RefreshCw
} from 'lucide-react';
import { SchoolResultPortalChecker } from './SchoolResultPortalChecker';
import { SchoolResultSheet } from './SchoolResultSheet';
import { SchoolResultPortalSalesCTA } from './SchoolResultPortalSalesCTA';
import { DEMO_RESULT_REPORT, DEMO_CREDENTIALS } from './sampleData';
import { ResultCheckerInput } from './types';

interface SchoolResultPortalDemoProps {
  initialMode?: 'mobile' | 'desktop';
  showDeviceSwitcher?: boolean;
}

export function SchoolResultPortalDemo({ 
  initialMode = 'desktop',
  showDeviceSwitcher = true 
}: SchoolResultPortalDemoProps) {
  const [step, setStep] = useState<'checker' | 'result'>('checker');
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'desktop'>(initialMode);
  const [checkedCredentials, setCheckedCredentials] = useState<ResultCheckerInput | null>(null);

  const handleCheckerSuccess = (creds: ResultCheckerInput) => {
    setCheckedCredentials(creds);
    setStep('result');
    // Scroll to top of result
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCheckAnother = () => {
    setStep('checker');
    setCheckedCredentials(null);
  };

  return (
    <div className="w-full">
      {/* Device Frame Switcher Banner (hidden in print) */}
      {showDeviceSwitcher && (
        <div className="print:hidden flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Live Interactive Result Portal Demo
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Experience how parents & students check terminal results on their smartphones or computers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => setDeviceMode('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  deviceMode === 'desktop'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span className="hidden sm:inline">Desktop View</span>
                <span className="sm:hidden">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceMode('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  deviceMode === 'mobile'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span className="hidden sm:inline">Smartphone View</span>
                <span className="sm:hidden">Mobile</span>
              </button>
            </div>

            {step === 'result' && (
              <button
                type="button"
                onClick={handleCheckAnother}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-700 hover:text-blue-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
                title="Reset to Checker"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Interactive Stage */}
      {deviceMode === 'mobile' ? (
        <div className="flex justify-center py-4 bg-stone-100/70 rounded-3xl border border-stone-200 px-3 sm:px-6">
          {/* Android / iPhone Smartphone Shell */}
          <div className="w-full max-w-[400px] bg-slate-900 rounded-[48px] p-3.5 shadow-2xl border-4 border-slate-800">
            {/* Phone Screen Container */}
            <div className="w-full bg-white rounded-[38px] overflow-hidden flex flex-col min-h-[640px] max-h-[820px] overflow-y-auto no-scrollbar">
              {/* Smartphone Status Bar / Notch */}
              <div className="sticky top-0 z-30 pt-3 pb-2 px-6 flex items-center justify-between bg-slate-950 text-white text-[10px] font-semibold">
                <span>9:41</span>
                <div className="w-20 h-4 bg-slate-800 rounded-full"></div>
                <span>5G · 100%</span>
              </div>

              {/* Smartphone Browser Bar */}
              <div className="bg-stone-100 px-4 py-2 border-b border-stone-200 flex items-center justify-between text-[11px] font-mono text-slate-600">
                <span className="truncate">portal.greenfieldacademy.edu.ng</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />
              </div>

              {/* Mobile View Content */}
              <div className="p-4 flex-1">
                <AnimatePresence mode="wait">
                  {step === 'checker' ? (
                    <motion.div
                      key="mobile-checker"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SchoolResultPortalChecker onSuccess={handleCheckerSuccess} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="mobile-result"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SchoolResultSheet 
                        report={DEMO_RESULT_REPORT} 
                        onCheckAnother={handleCheckAnother} 
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Full Desktop / Standard Responsive View */
        <div className="w-full">
          <AnimatePresence mode="wait">
            {step === 'checker' ? (
              <motion.div
                key="desktop-checker"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SchoolResultPortalChecker onSuccess={handleCheckerSuccess} />
              </motion.div>
            ) : (
              <motion.div
                key="desktop-result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <SchoolResultSheet 
                  report={DEMO_RESULT_REPORT} 
                  onCheckAnother={handleCheckAnother} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Sales CTA Section at the bottom */}
      <SchoolResultPortalSalesCTA />
    </div>
  );
}
