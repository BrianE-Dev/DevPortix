import React, { useState, useEffect } from 'react';
import LocalStorageService from '../services/localStorageService';
import { ThemeContext } from './themeContext';

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => LocalStorageService.getTheme() || 'light');

  const applyTheme = (themeMode) => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    applyTheme(theme);
    LocalStorageService.setTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const setThemeMode = (themeMode) => {
    if (['light', 'dark'].includes(themeMode)) {
      setTheme(themeMode);
    }
  };

  const value = {
    theme,
    toggleTheme,
    setTheme: setThemeMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
