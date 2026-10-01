import React from 'react';
import { motion } from 'motion/react';

interface ProfilePhotoProps {
  className?: string;
}

export const ProfilePhoto: React.FC<ProfilePhotoProps> = ({ className = "w-48 h-48 md:w-64 md:h-64" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`relative flex justify-center items-center ${className} group mx-auto lg:mx-0`}
    >
      {/* Subtle background glow */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] -z-10 blur-xl opacity-40 mix-blend-multiply"
        animate={{ 
          borderRadius: ['40% 60% 70% 30% / 40% 50% 60% 50%', '60% 40% 30% 70% / 60% 30% 70% 40%', '40% 60% 70% 30% / 40% 50% 60% 50%'] 
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* The organic frame */}
      <motion.div 
        className="w-full h-full p-1.5 bg-gradient-to-br from-indigo-200/50 via-blue-200/30 to-slate-100 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] shadow-2xl overflow-hidden border border-slate-200"
        animate={{ 
          borderRadius: ['40% 60% 70% 30% / 40% 50% 60% 50%', '60% 40% 30% 70% / 60% 30% 70% 40%', '40% 60% 70% 30% / 40% 50% 60% 50%'] 
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <img
          src="https://i.ibb.co/S70YSt3h/profile-photo.png"
          alt="Igiharuwe Olayinka Emmanuel"
          className="w-full h-full object-cover object-top rounded-[inherit] transition-transform duration-700 group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== '/images/ioe_client_2.jpg') {
              target.src = '/images/ioe_client_2.jpg';
            }
          }}
        />
      </motion.div>
    </motion.div>
  );
};
