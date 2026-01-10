/**
 * WebSocket service for real-time order updates.
 */
import { Order } from '../types/index';

export type WebSocketMessageType = 'order_update' | 'new_order' | 'pong' | 'error';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  order?: Order;
  timestamp?: string;
  error?: string;
}

export type WebSocketEventHandler = (message: WebSocketMessage) => void;
export type ConnectionStatusHandler = (connected: boolean) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  public url: string;  // Make public for comparison
  public token: string | null;  // Make public for comparison
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private messageHandlers: Set<WebSocketEventHandler> = new Set();
  private connectionStatusHandlers: Set<ConnectionStatusHandler> = new Set();
  private isConnecting = false;
  private isIntentionallyClosed = false;

  constructor(url: string, token: string | null) {
    this.url = url;
    this.token = token;
  }

  /**
   * Connect to WebSocket server.
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isIntentionallyClosed = false;
    this.isConnecting = true;

    // Determine protocol (ws or wss)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // Replace http/https with ws/wss in URL, or add protocol if missing
    let finalUrl = this.url;
    if (!finalUrl) {
      console.error('WebSocket URL is undefined or empty');
      this.isConnecting = false;
      this.notifyConnectionStatus(false);
      return;
    }
    
    // Replace http/https with ws/wss
    finalUrl = finalUrl.replace(/^https?:\/\//, protocol + '//');
    
    // If URL doesn't start with ws:// or wss://, add protocol
    if (!finalUrl.startsWith('ws://') && !finalUrl.startsWith('wss://')) {
      finalUrl = `${protocol}//${finalUrl}`;
    }
    
    // Add token to query string if available
    if (this.token) {
      finalUrl += (finalUrl.includes('?') ? '&' : '?') + `token=${encodeURIComponent(this.token)}`;
    }
    
    console.log('Connecting to WebSocket:', finalUrl.replace(/token=[^&]+/, 'token=***'));
    
    // Store URL for error reporting (in closure)
    const wsUrl = finalUrl;
    
    try {
      this.ws = new WebSocket(finalUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.notifyConnectionStatus(true);
        this.startPingInterval();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // Handle pong responses
          if (message.type === 'pong') {
            return;
          }
          
          // Notify all handlers
          this.messageHandlers.forEach(handler => {
            try {
              handler(message);
            } catch (error) {
              console.error('Error in WebSocket message handler:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        const ws = this.ws;
        if (ws) {
          console.error('WebSocket readyState:', ws.readyState);
          console.error('WebSocket URL:', ws.url || 'undefined');
        } else {
          console.error('WebSocket object is null/undefined');
          console.error('Attempted URL:', wsUrl ? wsUrl.replace(/token=[^&]+/, 'token=***') : 'undefined');
          console.error('Service URL property:', this.url || 'undefined');
        }
        this.isConnecting = false;
        this.notifyConnectionStatus(false);
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed', event.code, event.reason);
        console.log('Close code meanings: 1006 = Abnormal closure (server not running with ASGI?), 4001-4008 = Custom rejection codes');
        this.isConnecting = false;
        this.stopPingInterval();
        this.notifyConnectionStatus(false);
        
        // Attempt to reconnect if not intentionally closed
        if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.isConnecting = false;
      this.notifyConnectionStatus(false);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server.
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopPingInterval();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Send message to WebSocket server.
   */
  send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  /**
   * Add message handler.
   */
  onMessage(handler: WebSocketEventHandler): () => void {
    this.messageHandlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  /**
   * Add connection status handler.
   */
  onConnectionStatus(handler: ConnectionStatusHandler): () => void {
    this.connectionStatusHandlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.connectionStatusHandlers.delete(handler);
    };
  }

  /**
   * Get current connection status.
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Schedule reconnection attempt.
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`Scheduling WebSocket reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isIntentionallyClosed) {
        this.connect();
      }
    }, delay);
  }

  /**
   * Start ping interval to keep connection alive.
   */
  private startPingInterval(): void {
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping' });
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop ping interval.
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Notify all connection status handlers.
   */
  private notifyConnectionStatus(connected: boolean): void {
    this.connectionStatusHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        console.error('Error in connection status handler:', error);
      }
    });
  }

  /**
   * Update token and reconnect if needed.
   */
  updateToken(token: string | null): void {
    this.token = token;
    if (this.isConnected() || this.isConnecting) {
      this.disconnect();
      this.connect();
    }
  }
}

export default WebSocketService;

