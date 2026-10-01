import { motion } from 'motion/react';
import { Palette, Video, Code, BrainCircuit, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const skillCategories = [
  {
    title: 'Creative Design',
    icon: Palette,
    color: 'from-blue-500 to-cyan-400',
    skills: ['Brand Identity', 'Logo Design', 'Typography', 'UI/UX Design', 'Print Graphics', 'Digital Assets']
  },
  {
    title: 'Motion & Animation',
    icon: Video,
    color: 'from-fuchsia-500 to-pink-500',
    skills: ['2D Animation', 'Motion Graphics', 'Video Editing', 'Visual Effects', 'Character Rigging', 'Storyboarding']
  },
  {
    title: 'Web Development',
    icon: Code,
    color: 'from-emerald-500 to-teal-400',
    skills: ['React & Next.js', 'TypeScript', 'Node.js', 'Tailwind CSS', 'Database Architecture', 'API Integration']
  },
  {
    title: 'Digital & AI',
    icon: BrainCircuit,
    color: 'from-amber-500 to-orange-400',
    skills: ['AI Prompts & Gen', 'Content Strategy', 'SEO Optimization', 'Digital Marketing', 'Workflow Automation', 'Cloud Deployment']
  }
];

export default function Skills() {
  return (
    <div className="pt-24 pb-24 min-h-screen relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-600/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-sm font-bold text-teal-600 tracking-widest uppercase mb-3">Core Competencies</h2>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
              Skills & Expertise
            </h1>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              A comprehensive toolkit combining creative artistry, motion design, and full-stack software architecture.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {skillCategories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-[#FFFFFF] rounded-3xl p-8 border border-stone-200 hover:border-stone-200 transition-all duration-300 relative overflow-hidden group"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${category.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`}></div>
              
              <div className="flex items-center mb-8">
                <div className="w-14 h-14 bg-[#F4F1EA] border border-stone-200 rounded-2xl flex items-center justify-center shadow-inner mr-5 relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-20`}></div>
                  <category.icon className="w-6 h-6 text-slate-900 relative z-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{category.title}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                {category.skills.map((skill, i) => (
                  <div key={i} className="flex items-center group/item">
                    <CheckCircle2 className="w-4 h-4 mr-3 text-slate-500 group-hover/item:text-teal-600 transition-colors" />
                    <span className="text-sm text-slate-700 font-medium group-hover/item:text-slate-900 transition-colors">{skill}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link
            to="/contact"
            className="inline-flex justify-center items-center px-10 py-4 text-base font-bold rounded-full text-white bg-gradient-to-r from-teal-600 to-blue-600 shadow-[0_8px_20px_rgba(13,148,136,0.2)] hover:shadow-[0_12px_25px_rgba(37,99,235,0.3)] transition-all hover:scale-105"
          >
            HIRE IOE STUDIO
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
