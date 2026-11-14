'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('msc_theme') as 'light' | 'dark' | null;
    const initial = saved || 'dark';
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('msc_theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  if (!mounted) {
    return <div className="w-24 h-9" />; // Prevent layout shift on initial hydration
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle light and dark mode"
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm transition cursor-pointer"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-4 h-4 text-amber-400" />
          <span>Bright Mode</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-indigo-600" />
          <span>Night Mode</span>
        </>
      )}
    </button>
  );
}