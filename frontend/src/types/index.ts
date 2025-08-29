// Core types for the Gawulo offline-first food ordering system

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  user_type: 'vendor' | 'customer' | 'admin' | 'support';
  is_verified: boolean;
  offline_capable: boolean;
  last_sync?: string;
  date_joined: string;
}

export interface Vendor {
  id: string;
  user: User;
  business_name: string;
  business_type: 'street_food' | 'home_kitchen' | 'restaurant' | 'catering' | 'bakery' | 'other';
  description?: string;
  phone_number: string;
  email?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  operating_hours: Record<string, any>;
  delivery_radius: number;
  minimum_order: number;
  delivery_fee: number;
  status: 'pending' | 'active' | 'suspended' | 'inactive';
  is_verified: boolean;
  rating: number;
  total_orders: number;
  offline_capable: boolean;
  last_sync?: string;
  sync_status: string;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: number;
  vendor: string;
  name: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  vendor: string;
  category: number;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  availability_status: 'available' | 'unavailable' | 'out_of_stock';
  is_featured: boolean;
  image?: string;
  preparation_time: number;
  allergens: string[];
  dietary_info: Record<string, any>;
  offline_available: boolean;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

// Type alias to avoid conflicts with Material-UI MenuItem
export type MenuItemType = MenuItem;

export interface Review {
  id: string;
  vendor: string;
  customer: User;
  rating: number;
  comment: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer: User;
  vendor: Vendor;
  delivery_method: 'delivery' | 'pickup';
  delivery_address?: string;
  delivery_instructions?: string;
  special_instructions?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'failed';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  estimated_preparation_time: number;
  estimated_delivery_time?: string;
  actual_delivery_time?: string;
  subtotal: number;
  delivery_fee: number;
  tax_amount: number;
  total_amount: number;
  created_offline: boolean;
  synced_to_server: boolean;
  sync_timestamp?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  order: string;
  menu_item: MenuItemType;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions?: string;
  customizations: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  order: string;
  customer: User;
  payment_method: PaymentMethod;
  transaction_id?: string;
  amount: number;
  processing_fee: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  payment_reference?: string;
  created_offline: boolean;
  synced_to_server: boolean;
  sync_timestamp?: string;
  metadata: Record<string, any>;
  notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface PaymentMethod {
  id: number;
  name: string;
  payment_type: 'cash' | 'card' | 'mobile_money' | 'bank_transfer' | 'crypto' | 'voucher';
  is_active: boolean;
  is_offline_capable: boolean;
  processing_fee: number;
  processing_fee_percentage: number;
  config: Record<string, any>;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryPartner {
  id: string;
  user: User;
  partner_type: 'internal' | 'external' | 'vendor';
  full_name: string;
  phone_number: string;
  email?: string;
  id_number?: string;
  vehicle_type?: string;
  vehicle_registration?: string;
  vehicle_color?: string;
  vehicle_model?: string;
  status: 'active' | 'inactive' | 'suspended' | 'offline';
  is_available: boolean;
  current_location_lat?: number;
  current_location_lng?: number;
  last_location_update?: string;
  total_deliveries: number;
  average_rating: number;
  total_earnings: number;
  working_hours: Record<string, any>;
  preferred_areas: string[];
  is_verified: boolean;
  verification_documents: string[];
  created_at: string;
  updated_at: string;
}

export interface Delivery {
  id: string;
  order: string;
  delivery_partner?: DeliveryPartner;
  pickup_address: string;
  delivery_address: string;
  pickup_lat?: number;
  pickup_lng?: number;
  delivery_lat?: number;
  delivery_lng?: number;
  status: 'pending' | 'assigned' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'failed' | 'cancelled';
  estimated_pickup_time?: string;
  estimated_delivery_time?: string;
  actual_pickup_time?: string;
  actual_delivery_time?: string;
  special_instructions?: string;
  customer_contact?: string;
  customer_name?: string;
  delivery_fee: number;
  partner_commission: number;
  created_at: string;
  updated_at: string;
}

export interface SyncQueue {
  id: string;
  user: User;
  operation_type: 'create' | 'update' | 'delete';
  model_type: 'order' | 'payment' | 'vendor' | 'menu_item' | 'review' | 'user';
  local_id?: string;
  server_id?: string;
  data: Record<string, any>;
  original_data: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'conflict';
  error_message?: string;
  retry_count: number;
  max_retries: number;
  created_at: string;
  updated_at: string;
  processed_at?: string;
}

export interface SyncConflict {
  id: string;
  sync_queue_item: string;
  local_data: Record<string, any>;
  server_data: Record<string, any>;
  conflict_field?: string;
  resolution_status: 'pending' | 'resolved' | 'ignored';
  resolution_strategy: 'server_wins' | 'client_wins' | 'manual' | 'merge';
  resolved_data: Record<string, any>;
  resolved_by?: User;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SyncSession {
  id: string;
  user: User;
  session_id: string;
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  total_operations: number;
  successful_operations: number;
  failed_operations: number;
  conflicts_resolved: number;
  connection_type?: string;
  bandwidth_used: number;
  started_at: string;
  completed_at?: string;
  duration: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  pagination?: {
    count: number;
    next?: string;
    previous?: string;
    results: T[];
  };
}

export interface OfflineData {
  orders: Order[];
  payments: Payment[];
  syncQueue: SyncQueue[];
  lastSync: string;
  isOnline: boolean;
}

export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isOnline: boolean;
  offlineData: OfflineData;
  syncStatus: {
    isSyncing: boolean;
    lastSync: string;
    pendingOperations: number;
    failedOperations: number;
  };
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

export interface Notification {
  id: string;
  type: 'order_update' | 'payment' | 'delivery' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, any>;
  created_at: string;
}

export interface SearchFilters {
  query?: string;
  category?: string;
  priceRange?: [number, number];
  rating?: number;
  distance?: number;
  deliveryMethod?: 'delivery' | 'pickup';
  sortBy?: 'rating' | 'price' | 'distance' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
  customizations?: Record<string, any>;
}

export interface Cart {
  items: CartItem[];
  vendor?: Vendor;
  subtotal: number;
  deliveryFee: number;
  taxAmount: number;
  totalAmount: number;
}

// Form types
export interface LoginForm {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  userType: 'customer' | 'vendor';
}

export interface VendorRegistrationForm {
  businessName: string;
  businessType: string;
  description: string;
  phoneNumber: string;
  email: string;
  address: string;
  latitude?: number;
  longitude?: number;
  operatingHours: Record<string, any>;
  deliveryRadius: number;
  minimumOrder: number;
  deliveryFee: number;
}

export interface OrderForm {
  deliveryMethod: 'delivery' | 'pickup';
  deliveryAddress?: string;
  deliveryInstructions?: string;
  specialInstructions?: string;
  paymentMethod: string;
}

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/auth/login/',
  REGISTER: '/api/auth/register/',
  LOGOUT: '/api/auth/logout/',
  REFRESH_TOKEN: '/api/auth/refresh/',
  
  // Users
  USER_PROFILE: '/api/users/profile/',
  UPDATE_PROFILE: '/api/users/profile/update/',
  
  // Vendors
  VENDORS: '/api/vendors/',
  VENDOR_DETAIL: (id: string) => `/api/vendors/${id}/`,
  VENDOR_MENU: (id: string) => `/api/vendors/${id}/menu/`,
  VENDOR_REVIEWS: (id: string) => `/api/vendors/${id}/reviews/`,
  
  // Menu
  MENU_ITEMS: '/api/menu-items/',
  MENU_ITEM_DETAIL: (id: string) => `/api/menu-items/${id}/`,
  MENU_CATEGORIES: '/api/menu-categories/',
  
  // Orders
  ORDERS: '/api/orders/',
  ORDER_DETAIL: (id: string) => `/api/orders/${id}/`,
  ORDER_STATUS_UPDATE: (id: string) => `/api/orders/${id}/status/`,
  OFFLINE_ORDERS: '/api/orders/offline/',
  
  // Payments
  PAYMENTS: '/api/payments/',
  PAYMENT_DETAIL: (id: string) => `/api/payments/${id}/`,
  PAYMENT_METHODS: '/api/payment-methods/',
  OFFLINE_PAYMENTS: '/api/payments/offline/',
  
  // Delivery
  DELIVERIES: '/api/deliveries/',
  DELIVERY_DETAIL: (id: string) => `/api/deliveries/${id}/`,
  DELIVERY_PARTNERS: '/api/delivery-partners/',
  LOCATION_UPDATE: '/api/location/update/',
  
  // Sync
  SYNC_QUEUE: '/api/sync/queue/',
  SYNC_STATUS: '/api/sync/status/',
  SYNC_CONFLICTS: '/api/sync/conflicts/',
  SYNC_SESSIONS: '/api/sync/sessions/',
  
  // Notifications
  NOTIFICATIONS: '/api/notifications/',
  MARK_READ: (id: string) => `/api/notifications/${id}/read/`,
} as const;
