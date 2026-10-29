'use client';

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [, startTransition] = useTransition();

  useEffect(() => {
    // 1. Read stored preference or system default
    const saved = localStorage.getItem('devpulse_theme') as Theme | null;
    let initial: Theme = 'dark';
    if (saved === 'light' || saved === 'dark') {
      initial = saved;
    } else if (window.matchMedia && !window.matchMedia('(prefers-color-scheme: dark)').matches) {
      initial = 'light';
    }

    setThemeState(initial);
    applyTheme(initial);

    // 2. Listen to system preference changes if user hasn't saved explicit preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      const explicit = localStorage.getItem('devpulse_theme');
      if (!explicit) {
        const next = e.matches ? 'dark' : 'light';
        setThemeState(next);
        applyTheme(next);
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    }
  };

  const setTheme = (nextTheme: Theme) => {
    startTransition(() => {
      setThemeState(nextTheme);
    });
    localStorage.setItem('devpulse_theme', nextTheme);
    applyTheme(nextTheme);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
