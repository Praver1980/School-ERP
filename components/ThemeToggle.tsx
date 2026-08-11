import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme, className = "" }) => {
  return (
      <button
        onClick={toggleTheme}
        className={`p-2.5 px-4 rounded-2xl transition-all active:scale-90 border flex items-center justify-center gap-2 group ${
          theme === 'dark'
            ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700'
            : 'bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100'
        } ${className}`}
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? (
          <>
            <Sun size={20} className="group-hover:rotate-45 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Light Mode</span>
          </>
        ) : (
          <>
            <Moon size={20} className="group-hover:-rotate-12 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Dark Mode</span>
          </>
        )}
      </button>
  );
};

export default ThemeToggle;
