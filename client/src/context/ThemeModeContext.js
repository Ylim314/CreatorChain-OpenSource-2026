import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import getAppTheme from '../theme/theme';

const ThemeModeContext = createContext({ mode: 'light', toggleMode: () => {} });

export const useThemeMode = () => useContext(ThemeModeContext);

export const ThemeModeProvider = ({ children }) => {
  const [mode, setMode] = useState('light');

  // init from localStorage or system preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cc_theme_mode');
      if (saved === 'light' || saved === 'dark') {
        setMode(saved);
        return;
      }
    } catch {}
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setMode(prefersDark ? 'dark' : 'light');
    }
  }, []);

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      try { 
        localStorage.setItem('cc_theme_mode', next);
        // 设置data-theme属性到document.documentElement
        document.documentElement.setAttribute('data-theme', next);
      } catch {}
      return next;
    });
  };

  // 初始化时设置data-theme属性
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const theme = useMemo(() => getAppTheme(mode), [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};
