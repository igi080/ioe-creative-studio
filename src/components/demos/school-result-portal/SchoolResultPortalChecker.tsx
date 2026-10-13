import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  KeyRound, 
  Hash, 
  Calendar, 
  BookOpen, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Lock,
  Eye,
  EyeOff,
  School,
  MessageSquare,
  Users,
  Award,
  Printer,
  Settings
} from 'lucide-react';
import { 
  DEMO_CREDENTIALS, 
  AVAILABLE_SESSIONS, 
  AVAILABLE_TERMS 
} from './sampleData';
import { ResultCheckerInput } from './types';
import { trackEvent } from '../../../lib/analytics';

interface SchoolResultPortalCheckerProps {
  onSuccess: (credentials: ResultCheckerInput) => void;
}

export function SchoolResultPortalChecker({ onSuccess }: SchoolResultPortalCheckerProps) {
  const [regNumber, setRegNumber] = useState('');
  const [pin, setPin] = useState('');
  const [session, setSession] = useState('2025/2026');
  const [term, setTerm] = useState('Third Term');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [demoFilledNotice, setDemoFilledNotice] = useState(false);

  const quoteUrl = `/request-quote?service=${encodeURIComponent('School Website and Online Result Portal')}&source=${encodeURIComponent('School Result Portal Demo')}&demo=${encodeURIComponent('School Result Portal')}`;
  const studioWhatsapp = '2349040059278';
  const whatsappMsg = `Hello IOE Creative Studio! I am on the School Result Portal Demo landing screen and I would like to get this system for my school.\n\nPlease share details on features, pricing, and onboarding.`;
  const whatsappUrl = `https://wa.me/${studioWhatsapp}?text=${encodeURIComponent(whatsappMsg)}`;

  const handleFillDemo = () => {
    setRegNumber(DEMO_CREDENTIALS.registrationNumber);
    setPin(DEMO_CREDENTIALS.pin);
    setSession(DEMO_CREDENTIALS.session);
    setTerm(DEMO_CREDENTIALS.term);
    setErrorMessage(null);
    setFieldErrors({});
    setDemoFilledNotice(true);
    setTimeout(() => setDemoFilledNotice(false), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const errors: { [key: string]: string } = {};

    const cleanReg = regNumber.trim().toUpperCase();
    const cleanPin = pin.trim().toUpperCase();

    if (!cleanReg) {
      errors.regNumber = 'Please enter student registration number';
    }
    if (!cleanPin) {
      errors.pin = 'Please enter your student PIN';
    }
    if (!session) {
      errors.session = 'Please select an academic session';
    }
    if (!term) {
      errors.term = 'Please select a term';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsLoading(true);

    // Simulate verification delay
    setTimeout(() => {
      setIsLoading(false);
      // Validate credentials against demo records
      const isRegValid = cleanReg === DEMO_CREDENTIALS.registrationNumber.toUpperCase();
      const isPinValid = cleanPin === DEMO_CREDENTIALS.pin.toUpperCase();

      if (isRegValid && isPinValid) {
        onSuccess({
          registrationNumber: cleanReg,
          pin: cleanPin,
          session,
          term
        });
      } else if (!isRegValid && !isPinValid) {
        setErrorMessage(
          'Student Record & PIN not found. Please verify the credentials on your term scratch card or click "Auto-Fill Demo Credentials" below.'
        );
      } else if (!isPinValid) {
        setErrorMessage(
          'Invalid Student PIN. The PIN entered does not match student registration records for this session.'
        );
      } else {
        setErrorMessage(
          'Registration number not recognized in Greenfield International Academy database.'
        );
      }
    }, 700);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-8">
      {/* Top Proprietor Quick Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-blue-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
            <School className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">
              School Proprietor Demo
            </span>
            <strong className="text-sm sm:text-base font-extrabold text-white">
              Get This System for Your School
            </strong>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            to={quoteUrl}
            className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl text-center shadow-sm transition-all"
          >
            Request Quote
          </Link>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('whatsapp_click', { channel: 'whatsapp', source: 'School Result Portal Checker Top Banner' })}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl text-center shadow-sm transition-all flex items-center justify-center gap-1"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Portal Container Card */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden transition-all">
        {/* School Branded Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-6 sm:p-8 text-center relative overflow-hidden">
          {/* Subtle watermark crest circle */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full pointer-events-none blur-xl"></div>
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-purple-500/10 rounded-full pointer-events-none blur-xl"></div>

          {/* School Crest / Logo Placeholder */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-3 shadow-inner">
            <GraduationCap className="w-9 h-9 text-amber-300" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase drop-shadow-xs">
            Greenfield International Academy
          </h2>
          <div className="text-xs sm:text-sm font-semibold text-blue-100 tracking-wide mt-1">
            Student Result Portal
          </div>
          <div className="inline-block mt-3 px-3 py-1 bg-white/15 backdrop-blur-xs rounded-full text-[11px] font-medium text-blue-50 border border-white/20">
            Plot 18, Greenfield Crescent, Lekki Peninsula, Lagos
          </div>
        </div>

        {/* Checker Form Body */}
        <div className="p-6 sm:p-8 bg-white">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Check Terminal Examination Result
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              Check your academic result securely using your Student PIN.
            </p>
          </div>

          {/* Inline Error Alert */}
          {errorMessage && (
            <div 
              role="alert"
              className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-3 animate-fadeIn"
            >
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block text-red-900 mb-0.5">Verification Failed</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Demo Account Quick Card */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 to-purple-50/80 border border-blue-200/80 text-slate-800 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 font-bold text-blue-900 text-xs">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Demo Account</span>
                <span className="text-[10px] bg-blue-200/70 text-blue-800 font-extrabold px-1.5 py-0.5 rounded">
                  FICTIONAL DEMO DATA
                </span>
              </div>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-blue-200 hover:border-blue-300 shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                Auto-Fill Demo Credentials
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700 font-mono pt-1 border-t border-blue-100">
              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-sans">Reg No:</span>
                <strong className="text-slate-900">{DEMO_CREDENTIALS.registrationNumber}</strong>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-sans">PIN:</span>
                <strong className="text-slate-900">{DEMO_CREDENTIALS.pin}</strong>
              </div>
            </div>

            {demoFilledNotice && (
              <div className="mt-2 text-[11px] font-semibold text-emerald-700 flex items-center gap-1 animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5" /> Demo credentials loaded. Click "CHECK RESULT" below!
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field 1: Registration Number */}
            <div>
              <label 
                htmlFor="reg-number-input"
                className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5"
              >
                1. Student Registration Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  id="reg-number-input"
                  type="text"
                  value={regNumber}
                  onChange={(e) => {
                    setRegNumber(e.target.value);
                    if (fieldErrors.regNumber) {
                      setFieldErrors({ ...fieldErrors, regNumber: '' });
                    }
                  }}
                  placeholder="e.g. GIA/2026/001"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                    fieldErrors.regNumber 
                      ? 'border-red-400 bg-red-50/20 focus:ring-red-400' 
                      : 'border-stone-300 bg-stone-50/50 hover:border-stone-400 focus:border-blue-600 focus:ring-blue-500/20 focus:bg-white'
                  }`}
                />
              </div>
              {fieldErrors.regNumber && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.regNumber}</p>
              )}
            </div>

            {/* Field 2: Student PIN */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label 
                  htmlFor="pin-input"
                  className="block text-xs font-bold text-slate-800 uppercase tracking-wider"
                >
                  2. Student PIN <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500">From Scratch Card or Portal Slip</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="pin-input"
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    if (fieldErrors.pin) {
                      setFieldErrors({ ...fieldErrors, pin: '' });
                    }
                  }}
                  placeholder="e.g. IOE2026"
                  className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 transition-all ${
                    fieldErrors.pin 
                      ? 'border-red-400 bg-red-50/20 focus:ring-red-400' 
                      : 'border-stone-300 bg-stone-50/50 hover:border-stone-400 focus:border-blue-600 focus:ring-blue-500/20 focus:bg-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.pin && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.pin}</p>
              )}
            </div>

            {/* Field 3 & 4: Academic Session and Term */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label 
                  htmlFor="session-select"
                  className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5"
                >
                  3. Academic Session
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <select
                    id="session-select"
                    value={session}
                    onChange={(e) => setSession(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 bg-stone-50/50 text-sm font-medium text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all cursor-pointer"
                  >
                    {AVAILABLE_SESSIONS.map((sess) => (
                      <option key={sess} value={sess}>{sess}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label 
                  htmlFor="term-select"
                  className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5"
                >
                  4. Term
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <select
                    id="term-select"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 bg-stone-50/50 text-sm font-medium text-slate-900 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all cursor-pointer"
                  >
                    {AVAILABLE_TERMS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 text-white font-extrabold text-sm sm:text-base tracking-wide uppercase shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-wait"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Verifying Student PIN...</span>
                  </>
                ) : (
                  <>
                    <span>CHECK RESULT</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security & Authenticity Notice */}
          <div className="mt-6 pt-5 border-t border-stone-100 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 256-Bit SSL Encrypted
            </span>
            <span className="text-stone-300">·</span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-blue-600" /> Tamper-Proof PIN Verification
            </span>
          </div>
        </div>

        {/* Demo Disclaimer Footer */}
        <div className="bg-stone-50 px-6 py-3 border-t border-stone-200 text-center text-[11px] text-slate-500">
          <strong>Safe Demonstration Sandbox:</strong> Powered by IOE Creative Studio. Uses fictional sample records. Cannot expose or alter institutional records.
        </div>
      </div>

      {/* Prominent Call to Action on Landing Screen: Get This System for Your School */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-900/60">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>School Proprietor Solution</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Fast 5–7 Day Turnaround
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
          Get This System for Your School
        </h3>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
          IOE Creative Studio can build a customized school website and online result portal for your institution. Check out the proposed production features we configure for your school:
        </p>

        {/* 7 Core Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs mb-6 text-slate-200">
          <div className="flex items-start gap-2 bg-white/5 border border-white/10 p-2.5 rounded-xl">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-semibold">Online Result Checking</strong>
              <span className="text-[11px] text-slate-300">Secure student PIN and registration number authentication.</span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-white/5 border border-white/10 p-2.5 rounded-xl">
            <School className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-semibold">Custom School Branding</strong>
              <span className="text-[11px] text-slate-300">Your school crest, colors, motto, and principal stamps.</span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-white/5 border border-white/10 p-2.5 rounded-xl">
            <Users className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-semibold">Central Student Records</strong>
              <span className="text-[11px] text-slate-300">Directory with registration numbers, classes, and bio-data.</span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-white/5 border border-white/10 p-2.5 rounded-xl">
            <Calendar className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-semibold">Academic Sessions & Terms</strong>
              <span className="text-[11px] text-slate-300">1st, 2nd, and 3rd term scheduling with past session archives.</span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-white/5 border border-white/10 p-2.5 rounded-xl">
            <Award className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-semibold">Subject Scores & Grading</strong>
              <span className="text-[11px] text-slate-300">CA (30) + Exam (70), WAEC/NECO grading, and automated totals.</span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-white/5 border border-white/10 p-2.5 rounded-xl">
            <Printer className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-semibold">Printable Terminal Results</strong>
              <span className="text-[11px] text-slate-300">Clean, official A4 format for physical printing and PDF saving.</span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-white/5 border border-white/10 p-2.5 rounded-xl sm:col-span-2">
            <Settings className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-semibold">Administrator Management Desk</strong>
              <span className="text-[11px] text-slate-300">Protected portal for teachers and proprietors to upload scores, issue PINs, and publish results.</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to={quoteUrl}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-600 hover:via-indigo-700 hover:to-purple-700 text-white font-extrabold rounded-xl shadow-lg shadow-blue-500/25 transition-all text-xs sm:text-sm"
          >
            <span>Get This System for Your School</span>
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('whatsapp_click', { channel: 'whatsapp', source: 'School Result Portal Checker Bottom CTA' })}
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all text-xs sm:text-sm shadow-sm"
          >
            <MessageSquare className="mr-1.5 w-4 h-4" />
            <span>Chat via WhatsApp</span>
          </a>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 text-[10px] text-slate-400 text-center">
          *Proposed production software specifications. Fictional data in demo. Real school records are protected on isolated cloud databases.
        </div>
      </div>
    </div>
  );
}
