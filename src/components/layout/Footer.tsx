import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, Phone, MessageCircle } from 'lucide-react';
import { AnimatedLogo } from '../AnimatedLogo';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { trackWhatsAppClick, trackPhoneClick, trackEmailClick } from '../../lib/analytics';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { settings: contactSettings } = useSiteSettings('contact');
  const { settings: brandSettings } = useSiteSettings('branding');

  const email = contactSettings.contact_email || 'Igiharuwe7@gmail.com';
  const phone = contactSettings.contact_phone || '+234 704 649 4532';
  const whatsapp = contactSettings.contact_whatsapp || '+234 904 005 9278';
  const facebook = contactSettings.social_facebook || 'https://www.facebook.com/share/1BLHDHcZXZ/';
  const instagram = contactSettings.social_instagram || 'https://www.instagram.com/igiharuweolayinkaemmanuel?stkn=MWRhMDRlY3FtY2w1bQ==';
  const siteName = brandSettings.site_name || 'IOE Creative Studio';
  const footerDesc = brandSettings.footer_description || 'A premium digital agency specializing in Creative Art Design, Static & Motion Graphics, and Full-Stack Web Development.';

  return (
    <footer className="bg-[#F4F1EA] text-slate-600 border-t border-stone-200 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Brand Info */}
          <div className="lg:col-span-5 space-y-6">
            <Link to="/" className="inline-block group">
               {brandSettings.brand_logo ? (
                 <img src={brandSettings.brand_logo} alt={siteName} className="h-16 mb-4 object-contain" />
               ) : (
                 <AnimatedLogo className="h-16 w-16 mb-4" />
               )}
               <h3 className="text-2xl font-bold text-slate-900 mb-1 group-hover:text-teal-600 transition-colors">{siteName}</h3>
            </Link>
            <div>
              <p className="text-slate-700 font-medium text-lg">Igiharuwe Olayinka Emmanuel</p>
              <p className="text-sm text-slate-500 mt-2 max-w-sm leading-relaxed">
                {footerDesc}
              </p>
            </div>
            
            <div className="flex space-x-5 pt-4">
              <a href={facebook} target="_blank" rel="noopener noreferrer" className="group relative bg-[#FFFFFF] p-3 rounded-full text-slate-600 hover:text-slate-900 border border-stone-200 hover:border-blue-500/50 hover:bg-teal-600/20 transition-all duration-300 hover:scale-110 hover:shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                <Facebook className="h-5 w-5" />
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#FDFBF7] text-slate-900 selection:bg-teal-500/30 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg border border-stone-200">Follow us on Facebook</span>
                <span className="sr-only">Facebook</span>
              </a>
              <a href={instagram} target="_blank" rel="noopener noreferrer" className="group relative bg-[#FFFFFF] p-3 rounded-full text-slate-600 hover:text-slate-900 border border-stone-200 hover:border-pink-500/50 hover:bg-pink-600/20 transition-all duration-300 hover:scale-110 hover:shadow-[0_0_15px_rgba(219,39,119,0.3)]">
                <Instagram className="h-5 w-5" />
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#FDFBF7] text-slate-900 selection:bg-teal-500/30 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg border border-stone-200">Follow on Instagram</span>
                <span className="sr-only">Instagram</span>
              </a>
              <a 
                href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={() => trackWhatsAppClick({ location: 'footer_social' })}
                className="group relative bg-[#FFFFFF] p-3 rounded-full text-slate-600 hover:text-slate-900 border border-stone-200 hover:border-emerald-500/50 hover:bg-emerald-500/20 transition-all duration-300 hover:scale-110 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#FDFBF7] text-slate-900 selection:bg-teal-500/30 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg border border-stone-200">Chat on WhatsApp</span>
                <span className="sr-only">WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="text-slate-900 font-bold mb-6 tracking-wider uppercase text-sm">Navigation</h4>
            <ul className="space-y-3">
              <li><Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-teal-600 transition-colors">Home</Link></li>
              <li><Link to="/about" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-teal-600 transition-colors">About</Link></li>
              <li><Link to="/services" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-teal-600 transition-colors">Services</Link></li>
              <li><Link to="/portfolio" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-teal-600 transition-colors">Portfolio</Link></li>
              <li><Link to="/pricing" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-teal-600 transition-colors">Pricing</Link></li>
              <li><Link to="/request-quote" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-teal-600 transition-colors font-semibold text-teal-700">Request a Quote</Link></li>
              <li><Link to="/contact" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-teal-600 transition-colors">Contact</Link></li>
              <li><Link to="/testimonials" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-teal-600 transition-colors">Testimonials</Link></li>
            </ul>
          </div>
          
          {/* Services */}
          <div className="lg:col-span-2">
            <h4 className="text-slate-900 font-bold mb-6 tracking-wider uppercase text-sm">Services</h4>
            <ul className="space-y-3">
              <li><Link to="/services" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-slate-600 hover:text-teal-600 transition-colors">Creative Design</Link></li>
              <li><Link to="/services" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-slate-600 hover:text-teal-600 transition-colors">Motion Graphics</Link></li>
              <li><Link to="/services" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-slate-600 hover:text-teal-600 transition-colors">Animation</Link></li>
              <li><Link to="/services" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-slate-600 hover:text-teal-600 transition-colors">Branding</Link></li>
              <li><Link to="/services" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-slate-600 hover:text-teal-600 transition-colors">Web Development</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <h4 className="text-slate-900 font-bold mb-6 tracking-wider uppercase text-sm">Get In Touch</h4>
            <ul className="space-y-4">
              <li className="flex items-start space-x-4 group">
                <div className="w-10 h-10 rounded-full bg-[#FFFFFF] border border-stone-200 shadow-sm shadow-sm flex items-center justify-center group-hover:bg-teal-600/20 group-hover:border-blue-500/50 transition-colors flex-shrink-0">
                  <Mail className="h-4 w-4 text-teal-600" />
                </div>
                <div className="flex flex-col pt-1">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Email</span>
                  <a 
                    href={`mailto:${email}`} 
                    onClick={() => trackEmailClick({ location: 'footer' })}
                    className="text-sm hover:text-slate-900 transition-colors cursor-pointer text-slate-700"
                  >
                    {email}
                  </a>
                </div>
              </li>
              <li className="flex items-start space-x-4 group">
                <div className="w-10 h-10 rounded-full bg-[#FFFFFF] border border-stone-200 shadow-sm shadow-sm flex items-center justify-center group-hover:bg-teal-600/20 group-hover:border-blue-500/50 transition-colors flex-shrink-0">
                  <Phone className="h-4 w-4 text-teal-600" />
                </div>
                <div className="flex flex-col pt-1">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Phone</span>
                  <a 
                    href={`tel:${phone}`} 
                    onClick={() => trackPhoneClick({ location: 'footer' })}
                    className="text-sm hover:text-slate-900 transition-colors cursor-pointer text-slate-700"
                  >
                    {phone}
                  </a>
                </div>
              </li>
              <li className="flex items-start space-x-4 group">
                <div className="w-10 h-10 rounded-full bg-[#FFFFFF] border border-stone-200 shadow-sm shadow-sm flex items-center justify-center group-hover:bg-emerald-600/20 group-hover:border-emerald-500/50 transition-colors flex-shrink-0">
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex flex-col pt-1">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">WhatsApp</span>
                  <a 
                    href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={() => trackWhatsAppClick({ location: 'footer_contact_list' })}
                    className="text-sm hover:text-slate-900 transition-colors cursor-pointer text-slate-700"
                  >
                    Chat with us
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-stone-200 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
          <p>&copy; {currentYear} {siteName}. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 md:mt-0">
            <Link to="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
            <Link to="/agreement" className="hover:text-slate-900 transition-colors">Client Agreement</Link>
            <Link to="/admin/login" className="hover:text-teal-600 transition-colors text-slate-600">Admin Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
