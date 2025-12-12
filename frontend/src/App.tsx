import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { QueryClient, QueryClientProvider, useQueryClient } from 'react-query';

// Import services
import { storage } from './services/storage';
import { sync } from './services/sync';

// Import components
import LoadingScreen from './components/LoadingScreen';
import RouterWrapper from './components/RouterWrapper';

// Import theme and types
import theme from './theme';
import { AppState, User } from './types/index';

// Import API hooks
import { useCurrentUser } from './hooks/useApi';



// Initialize services
const offlineStorageInstance = storage;
const syncServiceInstance = sync;

// Create React Query client with minimal caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
      staleTime: 30 * 1000, // 30 seconds - reasonable stale time
      cacheTime: 5 * 60 * 1000, // 5 minutes cache
      refetchOnWindowFocus: false, // Disable to prevent loops
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
  },
});

// Inner App component that uses React Query hooks
function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [appState, setAppState] = useState<AppState>({
    user: null,
    isAuthenticated: false,
    isOnline: navigator.onLine,
    offlineData: {
      orders: [],
      payments: [],
      syncQueue: [],
      lastSync: 'Never',
      isOnline: navigator.onLine,
    },
    syncStatus: {
      isSyncing: false,
      lastSync: 'Never',
      pendingOperations: 0,
      failedOperations: 0,
    },
  });

  // Check authentication status - single source of truth
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize offline storage
        await offlineStorageInstance.init();
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Update app state when authentication changes
  // Simple: if currentUser exists, user is authenticated
  useEffect(() => {
    const newUser = currentUser || null;
    const newIsAuthenticated = newUser !== null;
    
    setAppState(prev => {
      // Only update if something actually changed to avoid unnecessary re-renders
      if (newIsAuthenticated !== prev.isAuthenticated || newUser !== prev.user) {
        return {
          ...prev,
          isAuthenticated: newIsAuthenticated,
          user: newUser,
        };
      }
      return prev;
    });
  }, [currentUser]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setAppState(prev => ({ ...prev, isOnline: true }));
      syncServiceInstance.performSync();
    };

    const handleOffline = () => {
      setAppState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Visibility change monitoring for sync
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && appState.isOnline) {
        syncServiceInstance.performSync();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [appState.isOnline]);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('App initialization timeout - proceeding anyway');
        setIsLoading(false);
      }
    }, 3000); // 3 second timeout for app initialization

    return () => clearTimeout(timeout);
  }, [isLoading]);

  // Simplified loading logic:
  // Show loading only if app is initializing OR user query is loading on first load
  const hasCachedUser = queryClient.getQueryData(['user', 'current']) !== undefined;
  const isFirstLoad = !hasCachedUser;
  const shouldShowLoading = isLoading || (isFirstLoad && userLoading);
  
  if (shouldShowLoading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <Router>
            <RouterWrapper appState={appState} />
          </Router>
        </Box>
      </ThemeProvider>
  );
}

// Main App component that provides the QueryClient
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
