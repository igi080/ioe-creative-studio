import { motion } from 'motion/react';
import { CheckCircle2, Layout, Code } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatedLogo } from '../components/AnimatedLogo';
import { ProfilePhoto } from '../components/ProfilePhoto';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { useAboutContent } from '../hooks/useAboutContent';

export default function About() {
  const { settings } = useSiteSettings('about');
  const { sections: aboutSections, sectionsList } = useAboutContent();
  const name = settings.about_name || "Igiharuwe Olayinka Emmanuel";
  const bioIntro = aboutSections.bio?.content || settings.about_bio_intro || "Welcome to IOE Creative Studio. We are a professional digital agency focused on delivering high-quality visual communication and robust technical architecture. We combine Creative Art Design, Static/Motion Graphics, and Web Development to build cohesive and powerful digital experiences.";
  const bioOutro = aboutSections.bio_outro?.content || settings.about_bio_outro || "As the creative and technical lead, I bridge the gap between premium aesthetics and reliable functionality. Whether you need compelling visual content to engage your audience, or a custom full-stack web application to drive your business forward, we provide trustworthy, end-to-end solutions.";
  
  const mainSections = sectionsList.filter(s => s.section_key.toLowerCase() !== 'philosophy');
  const philosophySection = aboutSections.philosophy;

  return (
    <div className="pt-24 pb-20 lg:pt-32 lg:pb-32 min-h-screen relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-600/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-500/10 blur-[150px] rounded-full pointer-events-none -z-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 lg:sticky lg:top-32 flex justify-center lg:block mb-12 lg:mb-0 overflow-hidden"
          >
            {settings.about_profile_image ? (
              <img src={settings.about_profile_image} alt={name} className="w-64 h-64 sm:w-80 sm:h-80 lg:w-full lg:max-w-md aspect-[4/5] object-cover rounded-2xl shadow-xl" />
            ) : (
              <ProfilePhoto className="w-64 h-64 sm:w-80 sm:h-80 lg:w-full lg:max-w-md aspect-[4/5]" />
            )}
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-7"
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">{name}</h1>
                <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-[#2563EB] to-[#0D9488] bg-clip-text text-transparent uppercase tracking-widest">
                  Visual Content Designer <span className="text-slate-900/20 mx-2">|</span> Full-Stack Developer
                </h2>
              </div>
              <AnimatedLogo className="hidden md:block w-16 h-16 flex-shrink-0 ml-6 opacity-80" />
            </div>
            
            {mainSections.length > 0 ? (
              <div className="space-y-10 mb-12">
                {mainSections.map((section) => (
                  <div key={section.id || section.section_key} className="text-slate-700">
                    {section.title && (
                      <h3 className="text-2xl font-bold text-slate-900 mb-2">{section.title}</h3>
                    )}
                    {section.subtitle && (
                      <p className="text-base sm:text-lg font-medium text-teal-700 mb-4 leading-relaxed">{section.subtitle}</p>
                    )}
                    {section.image && (
                      <div className="my-6">
                        <img 
                          src={section.image} 
                          alt={section.title || section.section_key} 
                          className="w-full max-h-96 object-cover rounded-2xl shadow-md border border-stone-200"
                        />
                      </div>
                    )}
                    {section.content ? (
                      <div className="prose prose-lg prose-invert max-w-none text-slate-700 leading-relaxed whitespace-pre-line">
                        {section.content}
                      </div>
                    ) : (
                      section.section_key.toLowerCase() === 'bio' && (
                        <div className="prose prose-lg prose-invert max-w-none text-slate-700 leading-relaxed">
                          <p className="mb-6 leading-relaxed">{bioIntro}</p>
                          <p className="leading-relaxed">{bioOutro}</p>
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="prose prose-lg prose-invert max-w-none text-slate-700 mb-12">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Professional Introduction</h3>
                <p className="mb-6 leading-relaxed">
                  {bioIntro}
                </p>
                <p className="leading-relaxed">
                  {bioOutro}
                </p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-6 mb-12">
              <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-stone-200 hover:border-blue-500/30 transition-colors group">
                <div className="w-12 h-12 bg-blue-500/10 text-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500 group-hover:text-slate-900 transition-colors">
                  <Layout className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">Creative Expertise</h4>
                <p className="text-sm text-slate-600 leading-relaxed">Specialized in branding, static graphics, motion graphics, UI/UX, and complete visual storytelling that captures brand essence.</p>
              </div>
              <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-stone-200 hover:border-indigo-500/30 transition-colors group">
                <div className="w-12 h-12 bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-500 group-hover:text-slate-900 transition-colors">
                  <Code className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">Technical Expertise</h4>
                <p className="text-sm text-slate-600 leading-relaxed">Proficient in modern full-stack development, delivering scalable web applications built with cutting-edge frameworks.</p>
              </div>
            </div>

            <div className="mb-12">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">
                {philosophySection?.title || "Design Philosophy"}
              </h3>
              {philosophySection?.image && (
                <div className="mb-6">
                  <img 
                    src={philosophySection.image} 
                    alt={philosophySection.title || "Design Philosophy"} 
                    className="w-full max-h-80 object-cover rounded-2xl shadow-md border border-stone-200"
                  />
                </div>
              )}
              <p className="text-slate-700 text-lg leading-relaxed bg-[#F4F1EA] p-6 rounded-2xl border-l-4 border-blue-500">
                {philosophySection?.content || "Design is not just about making things look beautiful—it is about solving problems and communicating effectively. My philosophy centers around clean aesthetics, user-centric architecture, and purpose-driven creativity. Every pixel and every line of code serves a distinct purpose in achieving the project's strategic goals."}
              </p>
            </div>

            <div className="mb-12">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Why Clients Choose IOE</h3>
              <div className="space-y-4">
                {[
                  'Unified Creative & Technical Vision',
                  'Professional Agency-Quality Output',
                  'Transparent & Responsive Communication',
                  'Attention to Detail Across All Mediums',
                  'Modern Solutions Tailored to Business Needs'
                ].map((item, index) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    key={index} 
                    className="flex items-center text-slate-800 p-4 rounded-xl border border-stone-200"
                  >
                    <CheckCircle2 className="w-5 h-5 text-teal-600 mr-4 flex-shrink-0" />
                    <span className="font-medium">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div className="pt-8 border-t border-stone-200">
              <Link
                to="/contact"
                className="inline-flex justify-center items-center px-8 py-4 text-base font-bold rounded-full text-white bg-gradient-to-r from-teal-600 to-blue-600 hover:from-blue-700 hover:to-indigo-700 shadow-[0_8px_20px_rgba(13,148,136,0.2)] hover:shadow-[0_12px_25px_rgba(37,99,235,0.3)] transition-all hover:scale-105"
              >
                LET'S WORK TOGETHER
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
