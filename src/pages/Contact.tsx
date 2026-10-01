import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { trackEmailClick, trackPhoneClick, trackWhatsAppClick } from '../lib/analytics';

export default function Contact() {
  const { settings } = useSiteSettings('contact');
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    service: 'Creative Design',
    budget: 'Under ₦100,000',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormState({ name: '', email: '', phone: '', service: 'Creative Design', budget: 'Under ₦100,000', message: '' });
      setTimeout(() => setSubmitSuccess(false), 5000);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value
    });
  };

  const email = settings.contact_email || 'Igiharuwe7@gmail.com';
  const phone = settings.contact_phone || '+234 704 649 4532';
  const whatsapp = settings.contact_whatsapp || '+234 904 005 9278';
  const address = settings.contact_address || 'Available globally for remote work';

  return (
    <div className="pt-24 pb-24 min-h-screen relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-600/10 blur-[150px] rounded-full pointer-events-none -z-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
              Let's <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Work Together</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Ready to elevate your brand? Let's discuss your next big project and create something extraordinary.
            </p>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          {/* Contact Info */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5 space-y-8"
          >
            <div className="bg-[#FFFFFF] rounded-3xl p-8 border border-slate-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-2xl rounded-full"></div>
              <h3 className="text-2xl font-bold text-slate-900 mb-8">Contact Information</h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                    <Mail className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Email</p>
                    <a 
                      href={`mailto:${email}`} 
                      onClick={() => trackEmailClick({ location: 'contact_page' })}
                      className="text-lg text-slate-900 hover:text-teal-600 transition-colors"
                    >
                      {email}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
                    <Phone className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Phone</p>
                    <a 
                      href={`tel:${phone}`} 
                      onClick={() => trackPhoneClick({ location: 'contact_page' })}
                      className="text-lg text-slate-900 hover:text-indigo-600 transition-colors"
                    >
                      {phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                    <MessageCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">WhatsApp</p>
                    <a 
                      href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      onClick={() => trackWhatsAppClick({ location: 'contact_page' })}
                      className="text-lg text-slate-900 hover:text-emerald-600 transition-colors"
                    >
                      {whatsapp}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-violet-500/20">
                    <MapPin className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Location</p>
                    <p className="text-lg text-slate-900">{address}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-7"
          >
            <form onSubmit={handleSubmit} className="bg-[#FFFFFF] rounded-3xl p-8 border border-slate-300 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-blue-500"></div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formState.name}
                    onChange={handleChange}
                    className="w-full bg-[#F4F1EA] border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-600"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formState.email}
                    onChange={handleChange}
                    className="w-full bg-[#F4F1EA] border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-600"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formState.phone}
                    onChange={handleChange}
                    className="w-full bg-[#F4F1EA] border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-600"
                    placeholder="+234 ..."
                  />
                </div>
                <div>
                  <label htmlFor="service" className="block text-sm font-medium text-slate-700 mb-2">Service Required</label>
                  <select
                    id="service"
                    name="service"
                    value={formState.service}
                    onChange={handleChange}
                    className="w-full bg-[#F4F1EA] border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                  >
                    <option value="Creative Design">Creative Design</option>
                    <option value="Motion Graphics">Motion Graphics</option>
                    <option value="Animation">Animation</option>
                    <option value="Branding">Branding</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Full-Stack Application">Full-Stack Application</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="budget" className="block text-sm font-medium text-slate-700 mb-2">Project Budget</label>
                <select
                  id="budget"
                  name="budget"
                  value={formState.budget}
                  onChange={handleChange}
                  className="w-full bg-[#F4F1EA] border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                >
                  <option value="Under ₦100,000">Under ₦100,000</option>
                  <option value="₦100,000 – ₦300,000">₦100,000 – ₦300,000</option>
                  <option value="₦300,000 – ₦500,000">₦300,000 – ₦500,000</option>
                  <option value="₦500,000 – ₦1,000,000">₦500,000 – ₦1,000,000</option>
                  <option value="₦1,000,000+">₦1,000,000+</option>
                  <option value="Custom / Discuss">Custom / Discuss</option>
                </select>
              </div>

              <div className="mb-8">
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">Project Details</label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  required
                  value={formState.message}
                  onChange={handleChange}
                  className="w-full bg-[#F4F1EA] border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-600 resize-none"
                  placeholder="Tell us about your project goals, timeline, and requirements..."
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-4 px-8 border border-transparent rounded-xl text-base font-bold text-white bg-gradient-to-r from-teal-600 to-blue-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-500 shadow-[0_8px_20px_rgba(13,148,136,0.2)] transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02]"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : submitSuccess ? (
                  <span className="flex items-center text-emerald-300">
                    Message Sent Successfully!
                  </span>
                ) : (
                  <span className="flex items-center">
                    Send Message <Send className="ml-2 w-5 h-5" />
                  </span>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
