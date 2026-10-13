import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  MessageSquare, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  School,
  Lock,
  FileText,
  Users,
  Calendar,
  Award,
  Printer,
  Settings
} from 'lucide-react';
import { trackEvent } from '../../../lib/analytics';

export function SchoolResultPortalSalesCTA() {
  const quoteUrl = `/request-quote?service=${encodeURIComponent('School Website and Online Result Portal')}&source=${encodeURIComponent('School Result Portal Demo')}&demo=${encodeURIComponent('School Result Portal')}`;
  
  // IOE Creative Studio official WhatsApp (+234 904 005 9278)
  const studioWhatsapp = '2349040059278';
  const whatsappMsg = `Hello IOE Creative Studio! I tested the School Result Portal Demo and I would like to get a customized School Website & Online Result Portal for my school.\n\nPlease share details on pricing, setup timeline, and student PIN management.`;
  const whatsappUrl = `https://wa.me/${studioWhatsapp}?text=${encodeURIComponent(whatsappMsg)}`;

  const proposedFeatures = [
    {
      icon: Lock,
      title: 'Online Result Checking',
      desc: 'Secure parent and student login using unique student PIN and registration number on smartphones and computers.'
    },
    {
      icon: School,
      title: 'Custom School Branding',
      desc: 'Full brand customization featuring your official school crest, motto, brand colors, contact addresses, and digital stamps.'
    },
    {
      icon: Users,
      title: 'Central Student Records',
      desc: 'Structured student directory with registration numbers, classes, arms (SS 1–3, JSS 1–3, Primary), and student bio-data.'
    },
    {
      icon: Calendar,
      title: 'Academic Sessions & Terms',
      desc: 'Complete multi-term support for First Term, Second Term, and Third Term across academic sessions with archive lookups.'
    },
    {
      icon: Award,
      title: 'Subject Scores & Grading',
      desc: 'Continuous Assessment (CA) and terminal examination scores with automated aggregate totals, WAEC/NECO grading, and remarks.'
    },
    {
      icon: Printer,
      title: 'Printable & Downloadable Results',
      desc: 'Official high-resolution A4 terminal report card layout engineered for clean physical printing and PDF saving.'
    },
    {
      icon: Settings,
      title: 'Administrator Management Desk',
      desc: 'Protected portal for school staff and proprietors to enter/edit scores, batch-generate PINs, manage classes, and publish results.'
    }
  ];

  const handleWhatsAppClick = () => {
    trackEvent('whatsapp_click', {
      channel: 'whatsapp',
      label: 'School Result Portal Demo Sales CTA',
      source: 'School Result Portal Demo'
    });
  };

  return (
    <div className="print:hidden mt-12 sm:mt-16 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-10 md:p-12 relative overflow-hidden shadow-2xl border border-blue-900/50">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5 text-blue-300" />
          <span>Tailored For Nigerian Private Schools, Colleges & Academies</span>
        </div>

        <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
          Get This System for Your School
        </h3>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto mb-8">
          IOE Creative Studio can build a customized school website and online result portal for your institution.
        </p>

        {/* Proposed Features Grid */}
        <div className="text-left mb-8">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-300 mb-3 text-center sm:text-left flex items-center justify-center sm:justify-start gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Proposed Production Features for Your Customized System</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {proposedFeatures.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div key={idx} className="bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-xs flex flex-col justify-start">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300 shrink-0">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <strong className="text-xs sm:text-sm text-white font-bold">{feat.title}</strong>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-6">
          <Link
            to={quoteUrl}
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-600 hover:via-indigo-700 hover:to-purple-700 text-white font-extrabold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all text-sm sm:text-base cursor-pointer"
          >
            <span>Get This System for Your School</span>
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>

          <Link
            to="/contact"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all text-sm cursor-pointer"
          >
            Contact IOE Creative Studio
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsAppClick}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm hover:-translate-y-0.5 transition-all text-sm cursor-pointer"
          >
            <MessageSquare className="mr-2 w-4 h-4" />
            Chat via WhatsApp
          </a>
        </div>

        {/* Safe Sandbox & Demonstration Data Notice */}
        <div className="pt-4 border-t border-white/10 text-[11px] text-slate-400 max-w-2xl mx-auto leading-relaxed">
          <p>
            <strong>Safe Demonstration Sandbox:</strong> Daniel Adekunle, registration number <code className="text-blue-300">GIA/2026/001</code>, and Greenfield International Academy are fictional demo assets. This demo does not connect to real student databases or expose personal records. Production systems are separately provisioned on dedicated, secure databases.
          </p>
        </div>
      </div>
    </div>
  );
}
