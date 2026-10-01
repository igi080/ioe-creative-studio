import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedLogo } from '../AnimatedLogo';
import { useSiteSettings } from '../../hooks/useSiteSettings';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Services', path: '/services' },
  { name: 'Portfolio', path: '/portfolio' },
  { name: 'Pricing', path: '/pricing' },
  { name: 'Contact', path: '/contact' },
  { name: 'Testimonials', path: '/testimonials' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { settings: brandSettings } = useSiteSettings('branding');

  const siteName = brandSettings.site_name || 'IOE Studio';
  const siteTagline = 'Creative Agency';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#FDFBF7]/90 backdrop-blur-md shadow-sm py-3 border-b border-stone-200/50' : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex-shrink-0 flex items-center group">
            {brandSettings.brand_logo ? (
              <img src={brandSettings.brand_logo} alt={siteName} className="h-10 w-10 sm:h-12 sm:w-12 mr-3 object-contain" />
            ) : (
              <AnimatedLogo className="h-10 w-10 sm:h-12 sm:w-12 mr-3" />
            )}
            <div className="flex flex-col hidden sm:flex">
              <span className="font-bold text-lg tracking-tight text-slate-900 group-hover:text-teal-600 transition-colors leading-none mb-1">{siteName}</span>
              <span className="text-[10px] font-medium text-teal-600 tracking-widest uppercase leading-none">{siteTagline}</span>
            </div>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`relative px-3 xl:px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-slate-900 bg-slate-100 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-[#F4F1EA]'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <motion.div 
                      layoutId="nav-active"
                      className="absolute inset-0 border border-slate-300 rounded-full pointer-events-none"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
            <Link
              to="/request-quote"
              className="ml-3 xl:ml-6 relative group overflow-hidden bg-gradient-to-r from-teal-600 to-blue-600 text-white px-5 xl:px-6 py-2.5 rounded-full text-sm font-bold shadow-[0_8px_20px_rgba(13,148,136,0.2)] transition-all hover:scale-105 hover:shadow-[0_12px_25px_rgba(37,99,235,0.3)] whitespace-nowrap"
            >
              <span className="relative z-10">REQUEST A QUOTE</span>
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"></div>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100 focus:outline-none transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#FFFFFF]/95 backdrop-blur-xl border-t border-stone-200 shadow-2xl overflow-hidden"
          >
            <div className="px-4 pt-4 pb-6 space-y-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                      isActive
                        ? 'text-teal-700 bg-teal-50 border border-teal-200 font-semibold'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-[#F4F1EA] border border-transparent'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
              <div className="pt-4 space-y-2">
                <Link
                  to="/request-quote"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center bg-gradient-to-r from-teal-600 to-blue-600 text-white px-5 py-3.5 rounded-xl text-base font-bold shadow-lg"
                >
                  REQUEST A QUOTE
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center bg-stone-100 hover:bg-stone-200 text-slate-800 px-5 py-3 rounded-xl text-sm font-semibold transition-colors"
                >
                  Let's Work Together (Contact)
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
