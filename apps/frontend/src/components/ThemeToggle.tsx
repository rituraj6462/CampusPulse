import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      className={`relative inline-flex items-center justify-center p-2 rounded-lg border border-campus-border bg-campus-surface text-campus-text hover:bg-campus-elevated hover:text-campus-cobalt transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-campus-cobalt ${className}`}
    >
      {theme === 'light' ? (
        <Moon className="w-4 h-4 transition-transform duration-200 hover:rotate-12" aria-hidden="true" />
      ) : (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 hover:rotate-45" aria-hidden="true" />
      )}
      <span className="sr-only">
        {theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      </span>
    </button>
  );
};
