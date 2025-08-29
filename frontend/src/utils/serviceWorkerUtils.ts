// Utility to handle service worker issues
export const disableServiceWorkers = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // Unregister all service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('🧹 Service worker unregistered:', registration.scope);
      }
      
      // Clear all caches
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log('🧹 Cache deleted:', cacheName);
      }
      
      console.log('✅ All service workers and caches cleared');
    } catch (error) {
      console.error('❌ Error clearing service workers:', error);
    }
  }
};

// Check if service workers are active
export const checkServiceWorkers = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log('📊 Active service workers:', registrations.length);
    registrations.forEach(reg => {
      console.log('  -', reg.scope, reg.active ? 'Active' : 'Inactive');
    });
    return registrations;
  }
  return [];
};

// Clear browser cache
export const clearBrowserCache = async () => {
  try {
    // Clear all caches
    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
      await caches.delete(cacheName);
    }
    
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    console.log('🧹 Browser cache cleared');
  } catch (error) {
    console.error('❌ Error clearing browser cache:', error);
  }
};
