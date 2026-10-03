import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Monitor, 
  Smartphone, 
  Sparkles, 
  Clock, 
  Layers, 
  MessageSquare, 
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { WEBSITE_DEMOS, WebsiteDemo } from '../data/websiteDemos';

export default function WebsiteDemoDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [demo, setDemo] = useState<WebsiteDemo | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'preview'>('overview');

  useEffect(() => {
    if (!slug) {
      navigate('/portfolio');
      return;
    }

    const found = WEBSITE_DEMOS.find(d => d.slug === slug || d.id === slug);
    if (found) {
      setDemo(found);
      // SEO tags update
      document.title = `${found.title} — Website Demo Concept | IOE Creative Studio`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', `${found.title}: ${found.shortDescription} Customized for your business by IOE Creative Studio.`);
      }
    } else {
      navigate('/portfolio');
    }
  }, [slug, navigate]);

  if (!demo) {
    return (
      <div className="pt-32 pb-20 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const origin = typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null'
    ? window.location.origin
    : 'https://ioecreativestudio.com';
  const demoUrl = `${origin}/portfolio/demos/${demo.slug}`;
  const quoteUrl = `/request-quote?demo=${encodeURIComponent(demo.title)}&category=${encodeURIComponent(demo.category)}`;
  
  // IOE Creative Studio official WhatsApp number (+234 904 005 9278)
  const studioWhatsapp = '2349040059278';
  const whatsappMessage = `Hello IOE Creative Studio! I am interested in customizing the "${demo.title}" (${demo.category}) concept for my business.\n\nDescription: ${demo.shortDescription}\n\n👉 View Demo: ${demoUrl}\n\nPlease share details on pricing and timeline.`;
  const whatsappUrl = `https://wa.me/${studioWhatsapp}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="pt-24 pb-24 bg-white text-slate-900 min-h-screen">
      {/* Top Banner Notice */}
      <div className="bg-slate-50 border-b border-stone-200 py-2.5 px-4 text-center text-xs text-slate-600">
        <span className="font-semibold text-blue-700 uppercase tracking-wider text-[11px] mr-2">
          {demo.badge} CONCEPT
        </span>
        Sample design direction by IOE Creative Studio · Custom tailored to your exact brand, features & specifications upon order.
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
          <Link to="/portfolio" className="hover:text-blue-600 flex items-center gap-1 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Portfolio
          </Link>
          <span className="text-stone-300">/</span>
          <span className="text-slate-600">Website Demos</span>
          <span className="text-stone-300">/</span>
          <span className="text-slate-900 font-semibold truncate max-w-xs">{demo.title}</span>
        </div>

        {/* Hero Section */}
        <div className="grid lg:grid-cols-12 gap-12 items-start mb-16">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{demo.category}</span>
              <span className="text-stone-300">·</span>
              <span className="text-purple-700 font-extrabold">{demo.badge}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
              {demo.title}
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed mb-6">
              {demo.shortDescription}
            </p>

            <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-8 bg-stone-50 border border-stone-200 rounded-2xl p-5">
              {demo.fullDescription}
            </p>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-slate-50 border border-stone-200">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <Clock className="w-4 h-4 text-blue-600" /> Est. Delivery
                </div>
                <div className="font-bold text-slate-900 text-sm">{demo.deliveryTime}</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-stone-200">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <Layers className="w-4 h-4 text-purple-600" /> Target Industry
                </div>
                <div className="font-bold text-slate-900 text-sm truncate">{demo.category.replace(' Website', '')}</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-stone-200 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Production Ready
                </div>
                <div className="font-bold text-slate-900 text-sm">Full Customization</div>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to={quoteUrl}
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all text-base"
              >
                Request This Website
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm hover:-translate-y-0.5 transition-all text-sm"
              >
                <MessageSquare className="mr-2 w-4 h-4" />
                Chat via WhatsApp
              </a>
            </div>
          </div>

          {/* Right Column: Hero Visual Preview */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl overflow-hidden border border-stone-200 shadow-2xl bg-white p-3">
              <div className="flex items-center justify-between pb-3 px-2 border-b border-stone-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <div className="text-[11px] font-mono text-slate-500 bg-stone-100 px-3 py-1 rounded-md">
                  ioe-demos.com/{demo.slug}
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded uppercase">
                  {demo.badge}
                </span>
              </div>

              <div className="relative aspect-[4/3] overflow-hidden rounded-xl mt-3 bg-stone-100">
                <img
                  src={demo.image}
                  alt={demo.title}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== '/images/ioe_web_showcase.jpg') {
                      target.src = '/images/ioe_web_showcase.jpg';
                    }
                  }}
                />
                <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-stone-200/80 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{demo.title}</div>
                      <div className="text-[11px] text-slate-500">Live concept ready for rollout</div>
                    </div>
                    <Link
                      to={quoteUrl}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Request
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Device & Feature Preview Section */}
        <div className="mb-20">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-stone-200">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Interactive Architecture & Layout</h2>
              <p className="text-sm text-slate-600">Inspect how this website concept is structured for desktop and mobile devices.</p>
            </div>

            {/* Device Switcher */}
            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => setPreviewMode('desktop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  previewMode === 'desktop'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>Desktop View</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  previewMode === 'mobile'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Mobile View</span>
              </button>
            </div>
          </div>

          {/* Interactive Screen Display */}
          <div className="flex justify-center bg-stone-100/70 p-6 sm:p-10 rounded-3xl border border-stone-200">
            {previewMode === 'desktop' ? (
              <motion.div
                key="desktop-frame"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-stone-300 overflow-hidden"
              >
                {/* Desktop Browser Bar */}
                <div className="bg-stone-200/80 px-4 py-3 flex items-center justify-between border-b border-stone-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
                  </div>
                  <div className="bg-white px-6 py-1 rounded-md text-xs font-mono text-slate-600 border border-stone-200 w-1/2 text-center truncate">
                    https://{demo.slug}.ioe-preview.com
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500">1440 × 900</div>
                </div>

                {/* Desktop Interactive Mockup Body */}
                <div className="p-8">
                  {/* Miniature Demo Header */}
                  <div className="flex items-center justify-between pb-6 mb-6 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center">
                        IOE
                      </div>
                      <span className="font-extrabold text-slate-900 text-base">{demo.title.split(' ')[0]} Brand</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-5 text-xs font-semibold text-slate-600">
                      {demo.features.slice(0, 4).map((f, i) => (
                        <span key={i} className="hover:text-blue-600 cursor-pointer">{f}</span>
                      ))}
                    </div>
                    <Link
                      to={quoteUrl}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Inquire
                    </Link>
                  </div>

                  {/* Miniature Hero */}
                  <div className="grid sm:grid-cols-2 gap-8 items-center mb-8">
                    <div>
                      <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-2 block">
                        Sample Concept Preview
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 leading-snug">
                        Tailored Digital Experience for {demo.category.replace(' Website', '')}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
                        {demo.shortDescription}
                      </p>
                      <div className="flex items-center gap-3">
                        <Link
                          to={quoteUrl}
                          className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          Request Customization
                        </Link>
                      </div>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-stone-200 shadow-md aspect-video">
                      <img src={demo.image} alt={demo.title} className="w-full h-full object-cover" />
                    </div>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid sm:grid-cols-3 gap-4 pt-6 border-t border-stone-100">
                    {demo.highlights.map((h, i) => (
                      <div key={i} className="p-4 rounded-xl bg-slate-50 border border-stone-100">
                        <h4 className="text-xs font-bold text-slate-900 mb-1">{h.title}</h4>
                        <p className="text-[12px] text-slate-600 leading-relaxed">{h.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="mobile-frame"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-[340px] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800"
              >
                {/* Mobile Device Shell */}
                <div className="w-full bg-white rounded-[36px] overflow-hidden flex flex-col min-h-[580px]">
                  {/* Dynamic Island / Notch */}
                  <div className="pt-3 pb-2 px-6 flex items-center justify-between bg-stone-100 text-[10px] font-semibold text-slate-700 border-b border-stone-200">
                    <span>9:41</span>
                    <div className="w-20 h-4 bg-black rounded-full"></div>
                    <span>5G · 100%</span>
                  </div>

                  {/* Mobile Screen Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                      <div className="text-xs font-black text-slate-900">IOE DEMO</div>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {demo.category.split(' ')[0]}
                      </span>
                    </div>

                    <div className="aspect-[4/3] rounded-xl overflow-hidden mb-4 border border-stone-200">
                      <img src={demo.image} alt={demo.title} className="w-full h-full object-cover" />
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm mb-2">{demo.title}</h4>
                    <p className="text-xs text-slate-600 mb-4 line-clamp-3">{demo.shortDescription}</p>

                    <div className="space-y-1.5 mb-6">
                      {demo.features.slice(0, 4).map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto pt-3 border-t border-stone-100">
                      <Link
                        to={quoteUrl}
                        className="w-full block py-2.5 bg-blue-600 text-white text-xs font-bold text-center rounded-xl shadow-md hover:bg-blue-700 transition-colors"
                      >
                        Request This Website
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Detailed Breakdown: Features & Pages Included */}
        <div className="grid lg:grid-cols-2 gap-12 mb-20">
          {/* Key Features */}
          <div className="bg-slate-50 border border-stone-200 rounded-3xl p-8 sm:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Key Features Included</h3>
                <p className="text-xs text-slate-500">Core functionality pre-architected for this concept.</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {demo.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-stone-200">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <span className="text-sm font-semibold text-slate-800">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pages & Structural Architecture */}
          <div className="bg-slate-50 border border-stone-200 rounded-3xl p-8 sm:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Pages & Architecture</h3>
                <p className="text-xs text-slate-500">Standard page layouts customized to your business content.</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {demo.pagesIncluded.map((page, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-stone-200">
                  <span className="w-6 h-6 rounded-lg bg-purple-50 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-800">{page}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Conversion Card */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-4">
              Turn This Concept Into Your Business Website
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight">
              Ready to launch your {demo.category.replace(' Website', '')} site?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
              Click below to request a detailed quote. We'll pre-select this <strong className="text-white">"{demo.title}"</strong> concept and personalize the architecture, branding, copywriting, and features to fit your vision.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4">
              <Link
                to={quoteUrl}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 transition-all text-base inline-flex items-center"
              >
                Request This Website
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/portfolio#website-demos"
                className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all text-sm"
              >
                Explore Other Demos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
