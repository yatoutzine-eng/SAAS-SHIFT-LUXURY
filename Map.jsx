import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ThemeToggle({ theme, toggleTheme }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className="p-2.5 rounded-full border border-[#D4AF37]/20 bg-zinc-900/10 dark:bg-white/5 hover:border-[#D4AF37] transition-all flex items-center justify-center group"
      title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
    >
      {theme === 'dark' ? (
        <Sun size={18} className="text-[#D4AF37] group-hover:rotate-45 transition-transform duration-500" />
      ) : (
        <Moon size={18} className="text-[#D4AF37] group-hover:-rotate-12 transition-transform duration-500" />
      )}
    </motion.button>
  );
}
