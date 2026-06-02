import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('shift_theme') || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    if (theme === 'light') {
      root.classList.add('light');
      // Palette Pure White & Gold
      root.style.setProperty('--bg-primary', '#FFFFFF');
      root.style.setProperty('--bg-secondary', '#F8F8F8');
      root.style.setProperty('--text-primary', '#1A1A1A');
      root.style.setProperty('--text-secondary', '#666666');
      root.style.setProperty('--border-color', 'rgba(0,0,0,0.08)');
      root.style.setProperty('--card-bg', 'rgba(248,248,248,0.8)');
      root.style.setProperty('--nav-bg', 'rgba(255,255,255,0.8)');
    } else {
      root.classList.remove('light');
      // Palette Deep Black & Gold
      root.style.setProperty('--bg-primary', '#000000');
      root.style.setProperty('--bg-secondary', '#09090B');
      root.style.setProperty('--text-primary', '#FFFFFF');
      root.style.setProperty('--text-secondary', '#A1A1AA');
      root.style.setProperty('--border-color', 'rgba(255,255,255,0.08)');
      root.style.setProperty('--card-bg', 'rgba(24,24,27,0.4)');
      root.style.setProperty('--nav-bg', 'rgba(9,9,11,0.8)');
    }
    
    localStorage.setItem('shift_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return { theme, toggleTheme };
};
