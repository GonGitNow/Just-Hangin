import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { AppTheme } from '../types';
import { lightTheme, darkTheme } from '../constants/theme';
import { useAuth } from './AuthContext';
import * as profileApi from '../api/profile';

interface AppContextState {
  isAppReady: boolean;
  appTheme: AppTheme;
  isOnline: boolean;
  isAppActive: boolean;
  error: string | null;
  setAppTheme: (theme: AppTheme) => void;
  setIsOnline: (status: boolean) => void;
  clearError: () => void;
}

interface AppContextType extends AppContextState {}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile } = useAuth();
  
  const [isAppReady, setIsAppReady] = useState<boolean>(false);
  const [appTheme, setAppTheme] = useState<AppTheme>(userProfile?.preferences?.darkMode ? darkTheme : lightTheme);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isAppActive, setIsAppActive] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Update theme when user preferences change
  useEffect(() => {
    if (userProfile?.preferences?.darkMode !== undefined) {
      setAppTheme(userProfile.preferences.darkMode ? darkTheme : lightTheme);
    }
  }, [userProfile?.preferences?.darkMode]);

  // Handle app state changes (foreground, background, inactive)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      setIsAppActive(nextAppState === 'active');
      
      // Update user's last active timestamp when app comes to foreground
      if (nextAppState === 'active' && currentUser) {
        profileApi.updateLastActive(currentUser.uid).catch((err) => {
          console.error('Error updating last active status:', err);
        });
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [currentUser]);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Add any app initialization logic here
        // For example, loading cached data, checking permissions, etc.
        
        // Simulate a delay for app initialization
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        setIsAppReady(true);
      } catch (err: any) {
        console.error('Error initializing app:', err);
        setError('Failed to initialize app');
      }
    };
    
    initializeApp();
  }, []);

  const clearError = (): void => {
    setError(null);
  };

  const value: AppContextType = {
    isAppReady,
    appTheme,
    isOnline,
    isAppActive,
    error,
    setAppTheme,
    setIsOnline,
    clearError,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}; 