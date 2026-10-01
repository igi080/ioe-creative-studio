import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, ArrowRight, Zap, Users, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSupabase } from '../lib/supabase';
import { PricingPackage as Package, Faq } from '../types';
import { trackPricingView, trackCtaClick } from '../lib/analytics';

export default function Pricing() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [faqsLoading, setFaqsLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
    fetchFaqs();
    trackPricingView('All Packages');
  }, []);

  async function fetchFaqs() {
    try {
      const supabase = getSupabase();
      if (!supabase) {
        setFaqsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setFaqsLoading(false);
    }
  }

  async function fetchPackages() {
    try {
      const supabase = getSupabase(); if (!supabase) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('pricing_packages')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  }

  // Fallback packages if DB is empty or still loading
  const fallbackPackages: Package[] = [
    {
      id: '7a111111-0001-4000-8000-000000000001',
      name: 'BASIC',
      category: 'Creative Design / Digital Services',
      description: 'A professional starter package for individuals, small businesses, brands, and organizations that need quality digital design and a strong visual presence.',
      price: 30000,
      currency: 'NGN',
      billing_period: '',
      features: [
        'Professional logo or brand graphic',
        'Up to 3 static promotional designs',
        'Social media-ready graphics',
        'Basic brand color and typography guidance',
        'High-resolution final files',
        'One revision round',
        'Delivery of final files digitally'
      ],
      is_featured: false,
      is_active: true,
      display_order: 1,
      image: '/images/ioe_basic_pkg_1790170332898.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '7a222222-0002-4000-8000-000000000002',
      name: 'BUSINESS',
      category: 'Business Branding & Digital Presence',
      description: 'A complete digital design package for growing businesses that need consistent branding and professional promotional content.',
      price: 50000,
      currency: 'NGN',
      billing_period: '',
      features: [
        'Professional logo/brand identity design',
        'Up to 6 static promotional designs',
        'Social media graphics',
        'Business flyer/poster designs',
        'Basic brand style guide',
        'High-resolution final files',
        'Two revision rounds',
        'Web-ready and social-media-ready assets',
        'Digital delivery'
      ],
      is_featured: true,
      is_active: true,
      display_order: 2,
      image: '/images/ioe_business_pkg_1790170346116.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '7a333333-0003-4000-8000-000000000003',
      name: 'BRAND PRO',
      category: 'Premium Branding & Digital Innovation',
      description: 'A premium creative package for businesses, organizations, and brands that need a stronger visual identity and a more complete digital presence.',
      price: 100000,
      currency: 'NGN',
      billing_period: '',
      features: [
        'Professional logo and visual identity',
        'Brand color palette and typography system',
        'Premium brand style guide',
        'Up to 10 static promotional designs',
        'Social media design assets',
        'Marketing flyer/poster designs',
        'Premium presentation graphics',
        'Basic motion/logo animation',
        'Web-ready brand assets',
        'High-resolution source/final files where applicable',
        'Three revision rounds',
        'Priority project handling',
        'Digital delivery'
      ],
      is_featured: false,
      is_active: true,
      display_order: 3,
      image: '/images/ioe_brand_pro_pkg_1790170357058.jpg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  // Default temporary media map for official packages (fallback if DB row has null image)
  const PACKAGE_MEDIA_MAP: Record<string, string> = {
    '7a111111-0001-4000-8000-000000000001': '/images/ioe_basic_pkg_1790170332898.jpg',
    '7a222222-0002-4000-8000-000000000002': '/images/ioe_business_pkg_1790170346116.jpg',
    '7a333333-0003-4000-8000-000000000003': '/images/ioe_brand_pro_pkg_1790170357058.jpg',
    'basic': '/images/ioe_basic_pkg_1790170332898.jpg',
    'business': '/images/ioe_business_pkg_1790170346116.jpg',
    'brand pro': '/images/ioe_brand_pro_pkg_1790170357058.jpg'
  };

  const getPackageImage = (pkg: Package): string => {
    if (pkg.image && typeof pkg.image === 'string' && pkg.image.trim() !== '') {
      return pkg.image;
    }
    if (pkg.id && PACKAGE_MEDIA_MAP[pkg.id]) {
      return PACKAGE_MEDIA_MAP[pkg.id];
    }
    if (pkg.name && PACKAGE_MEDIA_MAP[pkg.name.toLowerCase().trim()]) {
      return PACKAGE_MEDIA_MAP[pkg.name.toLowerCase().trim()];
    }
    return '';
  };

  const displayPackages = packages.length > 0 ? packages : fallbackPackages;

  return (
    <div className="pt-24 pb-24 min-h-screen relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] bg-teal-600/10 blur-[150px] rounded-full pointer-events-none -z-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-sm font-bold text-teal-600 tracking-widest uppercase mb-3">Transparent Value</h2>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
              Pricing & Packages
            </h1>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Professional, scalable service packages designed to deliver maximum creative and technical ROI for your brand.
            </p>
          </motion.div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-24">
            {displayPackages.map((pkg, index) => {
              const mediaUrl = getPackageImage(pkg);

              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`group relative rounded-3xl p-8 border flex flex-col ${
                    pkg.is_featured 
                      ? 'border-blue-500 shadow-[0_0_40px_rgba(37,99,235,0.2)] md:-translate-y-4' 
                      : 'border-stone-200 hover:border-stone-200 hover:-translate-y-2'
                  } transition-all duration-300`}
                >
                  {pkg.is_featured && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                      <span className="bg-gradient-to-r from-teal-600 to-blue-600 text-slate-900 px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Package Media: Visibly positioned ABOVE category & name with 16:9 aspect ratio */}
                  {mediaUrl && (
                    <div className="mb-6 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-sm aspect-[16/9] w-full relative flex items-center justify-center">
                      {mediaUrl.match(/\.(mp4|webm|ogg)(\?.*)?$/i) ? (
                        <video 
                          src={mediaUrl} 
                          className="w-full h-full object-cover" 
                          autoPlay 
                          muted 
                          loop 
                          playsInline 
                          controls={false} 
                        />
                      ) : (
                        <img 
                          src={mediaUrl} 
                          alt={`${pkg.name} package`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                          referrerPolicy="no-referrer"
                          loading="eager"
                          onError={(e) => {
                            const target = e.target as HTMLElement;
                            if (target.parentElement) target.parentElement.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  )}
                  
                  {pkg.category && (
                    <span className="text-xs font-semibold text-teal-600 tracking-wider uppercase mb-1 block">
                      {pkg.category}
                    </span>
                  )}
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{pkg.name}</h3>
                  <p className="text-slate-600 text-sm mb-6 min-h-[40px]">{pkg.description}</p>
                
                <div className="mb-8">
                  <span className="text-4xl font-extrabold text-slate-900">
                    {pkg.currency === 'USD' ? '$' : '₦'}{Number(pkg.price).toLocaleString()}
                  </span>
                  {pkg.billing_period && (
                    <span className="text-slate-500 text-sm ml-2">/ {pkg.billing_period}</span>
                  )}
                </div>
                
                <ul className="space-y-4 mb-8 flex-grow">
                  {pkg.features && Array.isArray(pkg.features) && pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="w-5 h-5 text-teal-600 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {pkg.price && Number(pkg.price) > 0 ? (
                  <Link
                    to={`/payment?package=${encodeURIComponent(pkg.id)}`}
                    onClick={() => trackCtaClick(`Pricing Pay Now: ${pkg.name}`, 'pricing_table')}
                    className={`w-full py-3.5 px-6 rounded-full font-bold text-center transition-all ${
                      pkg.is_featured
                        ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-slate-900 shadow-lg hover:shadow-[0_8px_20px_rgba(13,148,136,0.2)]'
                        : 'bg-[#F4F1EA] text-slate-900 hover:bg-slate-100 border border-stone-200'
                    }`}
                  >
                    Pay Now
                  </Link>
                ) : (
                  <Link
                    to="/request-quote"
                    onClick={() => trackCtaClick(`Pricing Request Quote: ${pkg.name}`, 'pricing_table')}
                    className={`w-full py-3.5 px-6 rounded-full font-bold text-center transition-all ${
                      pkg.is_featured
                        ? 'bg-gradient-to-r from-teal-600 to-blue-600 text-slate-900 shadow-lg hover:shadow-[0_8px_20px_rgba(13,148,136,0.2)]'
                        : 'bg-[#F4F1EA] text-slate-900 hover:bg-slate-100 border border-stone-200'
                    }`}
                  >
                    Request Quote
                  </Link>
                )}
              </motion.div>
            );
          })}
          </div>
        )}

        {/* Refer & Earn Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-white to-slate-50 rounded-3xl border border-stone-200 p-8 md:p-12 mb-24 max-w-5xl mx-auto relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="grid md:grid-cols-2 gap-8 items-center relative z-10">
            <div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 mb-4">Refer & Earn</h3>
              <p className="text-slate-600 mb-6 text-lg">Help someone discover IOE Creative Studio and get rewarded for your network.</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-slate-700">
                  <Check className="w-5 h-5 text-emerald-600 mr-3" />
                  <span><strong className="text-slate-900">Refer 3 clients:</strong> Get 1 professional flyer FREE</span>
                </li>
                <li className="flex items-center text-slate-700">
                  <Check className="w-5 h-5 text-emerald-600 mr-3" />
                  <span><strong className="text-slate-900">Website referral:</strong> ₦10,000 IOE service credit</span>
                </li>
              </ul>
            </div>
            <div className="text-center md:text-right">
              <Link
                to="/contact"
                className="inline-flex justify-center items-center px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-[#050812] font-bold rounded-full transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-105"
              >
                Start Referring Today
              </Link>
            </div>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl font-extrabold text-slate-900 mb-10 text-center">Frequently Asked Questions</h3>
          {faqsLoading ? (
            <div className="text-center py-8 text-slate-500 text-sm">Loading FAQs...</div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No FAQs available at this time.</div>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div 
                  key={faq.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-[#FFFFFF] border border-stone-200 shadow-sm rounded-2xl overflow-hidden group"
                >
                  <details className="p-6 cursor-pointer">
                    <summary className="text-lg font-bold text-slate-800 focus:outline-none flex justify-between items-center list-none marker:hidden">
                      {faq.question}
                      <span className="text-teal-600 group-open:rotate-45 transition-transform duration-300 text-2xl leading-none">+</span>
                    </summary>
                    <p className="text-slate-600 mt-4 leading-relaxed pr-8 whitespace-pre-line">
                      {faq.answer}
                    </p>
                  </details>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
