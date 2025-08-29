import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Import services
import { storage } from './services/storage';
import { sync } from './services/sync';

// Import components
import LoadingScreen from './components/LoadingScreen';
import RouterWrapper from './components/RouterWrapper';

// Import theme and types
import theme from './theme';
import { AppState } from './types/index';

// Import API hooks
import { useCurrentUser, useIsAuthenticated } from './hooks/useApi';



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

  // Check authentication status
  const { data: isAuthenticated, isLoading: authLoading } = useIsAuthenticated();
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
  useEffect(() => {
    if (!authLoading && !userLoading) {
      setAppState(prev => ({
        ...prev,
        isAuthenticated: isAuthenticated || false,
        user: currentUser || null,
      }));
    }
  }, [isAuthenticated, currentUser, authLoading, userLoading]);

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

  if (isLoading || authLoading || userLoading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <Router>
            <RouterWrapper appState={appState} />
          </Router>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
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
