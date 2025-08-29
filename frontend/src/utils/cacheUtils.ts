import { QueryClient } from 'react-query';

// Development utility to clear all caches
export const clearAllCaches = (queryClient: QueryClient) => {
  console.log('🧹 Clearing all React Query caches...');
  queryClient.clear();
  queryClient.removeQueries();
  console.log('✅ All caches cleared');
};

// Development utility to log cache state
export const logCacheState = (queryClient: QueryClient) => {
  if (process.env.NODE_ENV === 'development') {
    const cache = queryClient.getQueryCache();
    console.log('📊 Current cache state:', {
      totalQueries: cache.getAll().length,
      queries: cache.getAll().map(query => ({
        queryKey: query.queryKey,
        state: query.state.status,
        dataUpdatedAt: query.state.dataUpdatedAt,
      }))
    });
  }
};

// Force refetch all active queries
export const refetchAllQueries = (queryClient: QueryClient) => {
  queryClient.refetchQueries();
};

// Invalidate and refetch specific query patterns
export const invalidateAndRefetch = (queryClient: QueryClient, patterns: string[]) => {
  patterns.forEach(pattern => {
    queryClient.invalidateQueries(pattern);
  });
  queryClient.refetchQueries();
};
