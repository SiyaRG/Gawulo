/**
 * React hook for WebSocket order updates.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from 'react-query';
import WebSocketService, { WebSocketMessage } from '../services/websocket';
import { Order } from '../types/index';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9033';
// Extract host and port from API URL for WebSocket
const getWSBaseUrl = () => {
  const url = new URL(API_BASE_URL);
  return `${url.hostname}:${url.port || (url.protocol === 'https:' ? '443' : '80')}`;
};
const WS_BASE_URL = getWSBaseUrl();

export interface UseOrderUpdatesOptions {
  userType: 'vendor' | 'customer';
  enabled?: boolean;
}

export interface UseOrderUpdatesReturn {
  isConnected: boolean;
  lastUpdate: Order | null;
  error: Error | null;
}

/**
 * Hook for real-time order updates via WebSocket.
 */
export const useOrderUpdates = (options: UseOrderUpdatesOptions): UseOrderUpdatesReturn => {
  const { userType, enabled = true } = options;
  const queryClient = useQueryClient();
  const wsServiceRef = useRef<WebSocketService | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Order | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Get WebSocket URL based on user type
  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const endpoint = userType === 'vendor' ? 'ws/orders/vendor/' : 'ws/orders/customer/';
    const url = `${protocol}//${WS_BASE_URL}/${endpoint}`;
    console.log('Constructed WebSocket URL:', url);
    return url;
  }, [userType]);

  // Get access token
  const getToken = useCallback(() => {
    return localStorage.getItem('accessToken');
  }, []);

  // Update React Query cache when order update is received
  const handleOrderUpdate = useCallback((message: WebSocketMessage) => {
    if (message.order) {
      const order = message.order as Order;
      setLastUpdate(order);

      // Update the orders list in React Query cache
      if (userType === 'vendor') {
        // Update vendor orders query
        queryClient.setQueryData(['vendor-orders'], (oldData: Order[] | undefined) => {
          if (!oldData) return [order];
          
          const existingIndex = oldData.findIndex(o => o.id === order.id);
          if (existingIndex >= 0) {
            // Update existing order
            const newData = [...oldData];
            newData[existingIndex] = order;
            return newData;
          } else {
            // Add new order (for new_order messages)
            return [order, ...oldData];
          }
        });
      } else {
        // Update customer orders query
        queryClient.setQueryData(['my-orders'], (oldData: Order[] | undefined) => {
          if (!oldData) return [order];
          
          const existingIndex = oldData.findIndex(o => o.id === order.id);
          if (existingIndex >= 0) {
            // Update existing order
            const newData = [...oldData];
            newData[existingIndex] = order;
            return newData;
          } else {
            // Add new order (for new_order messages)
            return [order, ...oldData];
          }
        });
      }

      // Also invalidate queries to ensure fresh data
      const queryKey = userType === 'vendor' ? ['vendor-orders'] : ['my-orders'];
      queryClient.invalidateQueries(queryKey, { exact: false });
    }
  }, [userType, queryClient]);

  useEffect(() => {
    if (!enabled) {
      // Disconnect if disabled
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
        wsServiceRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const token = getToken();
    if (!token) {
      setError(new Error('No access token available'));
      setIsConnected(false);
      return;
    }

    // Get WebSocket URL
    const wsUrl = getWebSocketUrl();
    
    // Check if we need to create a new service or update existing one
    const needsNewService = !wsServiceRef.current || 
      wsServiceRef.current.url !== wsUrl || 
      wsServiceRef.current.token !== token;
    
    if (needsNewService) {
      // Disconnect old service if it exists
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
      }
      
      // Create new WebSocket service
      const wsService = new WebSocketService(wsUrl, token);
      wsServiceRef.current = wsService;

      // Set up message handler
      const unsubscribeMessage = wsService.onMessage(handleOrderUpdate);

      // Set up connection status handler
      const unsubscribeStatus = wsService.onConnectionStatus((connected) => {
        setIsConnected(connected);
        if (!connected) {
          setError(new Error('WebSocket connection lost'));
        } else {
          setError(null);
        }
      });

      // Connect
      wsService.connect();

      // Cleanup
      return () => {
        unsubscribeMessage();
        unsubscribeStatus();
        if (wsServiceRef.current === wsService) {
          wsServiceRef.current.disconnect();
          wsServiceRef.current = null;
        }
      };
    } else {
      // Service already exists and URL/token match, just ensure it's connected
      if (wsServiceRef.current && !wsServiceRef.current.isConnected()) {
        wsServiceRef.current.connect();
      }
    }
  }, [enabled, userType, getWebSocketUrl, getToken, handleOrderUpdate]);

  // Update token when it changes (but don't disconnect if already connected)
  useEffect(() => {
    const token = getToken();
    if (wsServiceRef.current && token && wsServiceRef.current.token !== token) {
      // Only update token if it's different and service exists
      wsServiceRef.current.updateToken(token);
    }
  }, [getToken]);

  return {
    isConnected,
    lastUpdate,
    error,
  };
};

