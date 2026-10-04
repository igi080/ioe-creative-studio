import React, { useState } from 'react';
import { 
  Globe, 
  ExternalLink, 
  Copy, 
  Check, 
  Search, 
  Sparkles, 
  Share2, 
  href={demoUrl}, 
  CheckCircle2, 
  MessageSquare,
    Clock,
  Layers,
  ShieldCheck,
  Send
} from 'lucide-react';
import { WEBSITE_DEMOS, DEMO_CATEGORIES, WebsiteDemo } from '../../data/websiteDemos';

interface AdminWebsiteDemosProps {
  setError: (msg: string | null) => void;
  showSuccess: (msg: string) => void;
}

export function AdminWebsiteDemos({ setError, showSuccess }: AdminWebsiteDemosProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Filter demos based on category and search query
  const filteredDemos = WEBSITE_DEMOS.filter((demo) => {
    const matchesCategory = selectedCategory === 'all' || demo.categorySlug === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      demo.title.toLowerCase().includes(q) ||
      demo.category.toLowerCase().includes(q) ||
      demo.shortDescription.toLowerCase().includes(q) ||
      demo.features.some(f => f.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

const getFullDemoUrl = (slug: string) => {
  return `https://ioe-creative-studio.vercel.app/portfolio/demos/${slug}`;
};


  const buildWhatsAppMessage = (demo: WebsiteDemo, demoUrl: string) => {
    return `Hello! Here is a sample website design concept from IOE Creative Studio for your review:\n\n*${demo.title}* (${demo.category})\n${demo.shortDescription}\n\n👉 View Live Demo: ${demoUrl}\n\nLet us know if you'd like us to customize this design for your business!`;
  };

  const handleCopyUrl = async (demo: WebsiteDemo) => {
    const url = getFullDemoUrl(demo.slug);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for non-https or restricted contexts
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopiedSlug(demo.slug);
      showSuccess(`Copied "${demo.title}" URL to clipboard!`);
      setTimeout(() => {
        setCopiedSlug(null);
      }, 2500);
    } catch (err: any) {
      console.error('Failed to copy demo URL:', err);
      setError('Could not copy automatically. Please select and copy the URL text manually below.');
    }
  };

  const handleShareWhatsApp = (demo: WebsiteDemo) => {
    const url = getFullDemoUrl(demo.slug);
    const message = buildWhatsAppMessage(demo, url);
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Stats */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Predefined Sales Demos</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Website Demos Catalogue
            </h2>
            <p className="text-slate-600 text-sm mt-1 max-w-2xl">
              Browse, view, and instantly copy public demo links to share with prospective clients via WhatsApp, email, or chat proposals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-50 border border-stone-200 rounded-xl px-4 py-2 text-center">
              <div className="text-xl font-bold text-slate-900">{WEBSITE_DEMOS.length}</div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Concepts</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-center">
              <div className="text-xl font-bold text-blue-700">
                {WEBSITE_DEMOS.filter(d => d.isAvailable).length}
              </div>
              <div className="text-[11px] font-semibold text-blue-700 uppercase">Live Demos</div>
            </div>
          </div>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="mt-6 pt-6 border-t border-stone-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by demo name, category, or features..."
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                Clear
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredDemos.length}</strong> of {WEBSITE_DEMOS.length} demos
          </div>
        </div>

        {/* 10 Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mt-4 pt-2 no-scrollbar">
          {DEMO_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                type="button"
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'bg-stone-100 text-slate-600 hover:bg-stone-200 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Demos Cards Grid */}
      {filteredDemos.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center max-w-md mx-auto">
          <Globe className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">No matching website demos</h3>
          <p className="text-slate-600 text-xs mb-4">
            Try adjusting your search query or select another category from the filters above.
          </p>
          <button
            type="button"
            onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-slate-800 text-xs font-bold rounded-lg transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredDemos.map((demo) => {
            const demoUrl = getFullDemoUrl(demo.slug);
            const quoteUrl = `/request-quote?demo=${encodeURIComponent(demo.title)}&category=${encodeURIComponent(demo.category)}`;
            const isCopied = copiedSlug === demo.slug;
            const whatsappMessage = buildWhatsAppMessage(demo, demoUrl);
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

            return (
              <div 
                key={demo.id} 
                className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
              >
                {/* Card Header & Preview Image */}
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-48 h-40 sm:h-auto bg-stone-100 relative shrink-0 overflow-hidden">
                    <img 
                      src={demo.image} 
                      alt={demo.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== '/images/ioe_web_showcase.jpg') {
                          target.src = '/images/ioe_web_showcase.jpg';
                        }
                      }}
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded bg-white/95 text-blue-700 font-extrabold text-[10px] uppercase shadow-xs">
                        {demo.badge}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                          {demo.category}
                        </span>
                        {demo.isAvailable ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Published Demo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                            Concept Blueprint
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 leading-snug mb-1.5">
                        {demo.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {demo.shortDescription}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {demo.deliveryTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-slate-400" />
                        {demo.features.length} Features
                      </span>
                    </div>
                  </div>
                </div>

                {/* Features Badges */}
                <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 flex flex-wrap gap-1.5">
                  {demo.features.slice(0, 6).map((feat, i) => (
                    <span 
                      key={i} 
                      className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-700 bg-white border border-stone-200 px-2 py-0.5 rounded-md"
                    >
                      <CheckCircle2 className="w-2.5 h-2.5 text-blue-600" />
                      {feat}
                    </span>
                  ))}
                </div>

                {/* Exact Public URL Copy Box */}
                <div className="p-5 border-t border-stone-100 flex-1 flex flex-col justify-end space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Exact Public Demo URL:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={demoUrl}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                        className="flex-1 bg-stone-50 border border-stone-200 text-slate-800 text-xs font-mono px-3 py-2 rounded-lg select-all focus:outline-none focus:ring-1 focus:ring-blue-500"
                        title="Click to select exact URL"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(demo)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-100 hover:bg-stone-200 text-slate-800 border border-stone-200'
                        }`}
                        title="Copy URL to clipboard"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-600" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                    {/* View Demo Button */}
                    <a
                      href={demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      title="Open live public demo in a new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Demo</span>
                    </a>

                    {/* WhatsApp Quick Share Button */}
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      title={`Send "${demo.title}" proposal link via WhatsApp`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Link</span>
                    </a>

                    {/* Request This Website Flow Button */}
                    <a
                      href={quoteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      title="Open Request Quote flow with this demo attached"
                    >
                      <span>Request Quote</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
