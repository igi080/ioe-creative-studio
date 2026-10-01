import React from 'react';
import { motion } from 'motion/react';

export const AbstractAnimatedObject: React.FC = () => {
  return (
    <div className="fixed bottom-0 right-0 w-[300px] h-[300px] md:w-[500px] md:h-[500px] pointer-events-none z-[0] overflow-hidden opacity-80 mix-blend-multiply">
      <motion.div
        animate={{ 
          rotate: 360, 
          y: [0, -30, 0],
          x: [0, -20, 0]
        }}
        transition={{ 
          rotate: { duration: 25, repeat: Infinity, ease: "linear" },
          y: { duration: 8, repeat: Infinity, ease: "easeInOut" },
          x: { duration: 12, repeat: Infinity, ease: "easeInOut" }
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center"
      >
        {/* Core Glowing Orb */}
        <div className="absolute w-[40%] h-[40%] bg-blue-500/30 rounded-full blur-3xl"></div>
        <div className="absolute w-[30%] h-[30%] bg-purple-500/30 rounded-full blur-2xl translate-x-10 translate-y-10"></div>
        
        {/* SVG 3D-like Abstract Shape */}
        <svg viewBox="0 0 200 200" className="w-[80%] h-[80%] opacity-90 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.9" />
            </linearGradient>
            
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <g filter="url(#glow)">
            {/* Outer rings simulating 3D rotation */}
            <motion.ellipse 
              cx="100" cy="100" rx="80" ry="30" 
              fill="none" stroke="url(#grad1)" strokeWidth="3"
              animate={{ rotateZ: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "center" }}
            />
            <motion.ellipse 
              cx="100" cy="100" rx="30" ry="80" 
              fill="none" stroke="url(#grad2)" strokeWidth="3"
              animate={{ rotateZ: [360, 0] }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "center" }}
            />
            <motion.ellipse 
              cx="100" cy="100" rx="60" ry="60" 
              fill="none" stroke="url(#grad1)" strokeWidth="1.5" strokeDasharray="10 5"
              animate={{ rotateZ: [0, -360] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "center" }}
            />
            
            {/* Inner abstract polygon */}
            <motion.polygon 
              points="100,40 140,70 140,130 100,160 60,130 60,70" 
              fill="none" stroke="url(#grad2)" strokeWidth="2"
              animate={{ rotateZ: [0, 180, 360], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "center" }}
            />
            <motion.polygon 
              points="100,55 130,80 130,120 100,145 70,120 70,80" 
              fill="url(#grad1)" fillOpacity="0.1" stroke="url(#grad1)" strokeWidth="1"
              animate={{ rotateZ: [360, 180, 0], scale: [1.1, 0.9, 1.1] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "center" }}
            />
          </g>
        </svg>
      </motion.div>
    </div>
  );
};
