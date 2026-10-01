import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { Facebook, MessageCircle } from 'lucide-react';
import { AbstractAnimatedObject } from '../AbstractAnimatedObject';
import { trackWhatsAppClick } from '../../lib/analytics';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-[#FDFBF7] text-[#0A1128] selection:bg-teal-500/30 relative">
      <div className="print:hidden"><AbstractAnimatedObject /></div>
      <div className="print:hidden"><Navbar /></div>
      <main className="flex-grow relative z-10 print:z-auto print:static">
        {children}
      </main>
      <div className="print:hidden"><Footer /></div>
      {/* Floating Social Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 print:hidden">
        <a
          href="https://www.facebook.com/share/1BLHDHcZXZ/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow us on Facebook"
          className="group relative bg-[#FFFFFF] p-3.5 rounded-full text-slate-600 hover:text-teal-600 border border-stone-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]"
        >
          <Facebook className="w-6 h-6" />
          <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 whitespace-nowrap pointer-events-none">
            Follow on Facebook
            <span className="absolute top-1/2 -right-1 -translate-y-1/2 border-[6px] border-transparent border-l-slate-900"></span>
          </span>
        </a>
        <a
          href="https://wa.me/2349040059278"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
          onClick={() => trackWhatsAppClick({ location: 'floating_button' })}
          className="group relative bg-gradient-to-tr from-emerald-500 to-emerald-400 p-3.5 rounded-full text-white border border-emerald-400 hover:border-emerald-300 hover:brightness-110 transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 whitespace-nowrap pointer-events-none">
            Chat on WhatsApp
            <span className="absolute top-1/2 -right-1 -translate-y-1/2 border-[6px] border-transparent border-l-slate-900"></span>
          </span>
        </a>
      </div>
    </div>
  );
}
