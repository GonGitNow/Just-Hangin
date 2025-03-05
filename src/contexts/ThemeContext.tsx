import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppTheme } from '../types';
import { lightTheme, darkTheme } from '../constants/theme';
import { useAuth } from './AuthContext';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile } = useAuth();
  const [theme, setTheme] = useState<AppTheme>(userProfile?.preferences?.darkMode ? darkTheme : lightTheme);

  useEffect(() => {
    if (userProfile?.preferences?.darkMode !== undefined) {
      setTheme(userProfile.preferences.darkMode ? darkTheme : lightTheme);
    }
  }, [userProfile?.preferences?.darkMode]);

  const toggleTheme = () => {
    setTheme(theme.isDark ? lightTheme : darkTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 