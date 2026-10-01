import React from 'react';
import { motion } from 'motion/react';

interface AnimatedLogoProps {
  className?: string;
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = React.memo(({ className = "w-24 h-24" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, rotate: -3 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className={`relative inline-block ${className} group`}
    >
      <motion.img
        src="https://i.ibb.co/RGd3Npky/1787203349419.png"
        alt="IOE Creative Studio"
        className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] rounded-2xl relative z-10"
        whileHover={{ scale: 1.05, rotate: 2 }}
        transition={{ type: "spring", stiffness: 300 }}
      />
      {/* Subtle background glow */}
      <motion.div 
        className="absolute inset-0 bg-blue-500 rounded-2xl -z-10 blur-xl opacity-20"
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
});
