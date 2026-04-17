import React, { createContext, useContext, useLayoutEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'theme';

const normalizeTheme = (value) => {
  const v = String(value || '').toLowerCase();
  if (v === 'dark' || v === 'light') return v;
  return null;
};

const getSystemTheme = () => {
  try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch {
    // ignore
  }
  return 'light';
};

const safeGetStoredTheme = () => {
  try {
    return normalizeTheme(window.localStorage?.getItem?.(STORAGE_KEY));
  } catch {
    return null;
  }
};

const safeStoreTheme = (theme) => {
  try {
    window.localStorage?.setItem?.(STORAGE_KEY, theme);
  } catch {
    // ignore
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => safeGetStoredTheme() || getSystemTheme());

  useLayoutEffect(() => {
    try {
      document.documentElement.dataset.theme = theme;
    } catch {
      // ignore
    }
    safeStoreTheme(theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      setTheme,
      toggleTheme: () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
