import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useRouteChange = () => {
  const location = useLocation();

  useEffect(() => {
    // Only log route changes for debugging
    console.log('🔄 Route changed to:', location.pathname);
  }, [location.pathname]);
};
