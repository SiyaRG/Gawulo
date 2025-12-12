// API service for Django backend integration
import { Vendor, MenuItem as MenuItemType, Order, Review, User, MenuCategory, AuthResponse, TokenRefreshResponse, ProfileUpdateForm, Country, Language } from '../types/index';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9033/api';

class ApiService {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  // Authentication methods
  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Login failed');
    }

    const data: AuthResponse = await response.json();
    this.accessToken = data.access;
    this.refreshToken = data.refresh;
    localStorage.setItem('accessToken', data.access);
    localStorage.setItem('refreshToken', data.refresh);
    return data;
  }

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      await fetch(`${this.baseURL}/auth/logout/`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    }
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async register(userData: any): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || 
        (typeof errorData === 'object' && Object.keys(errorData).length > 0 
          ? JSON.stringify(errorData) 
          : 'Registration failed');
      throw new Error(errorMessage);
    }

    const data: AuthResponse = await response.json();
    this.accessToken = data.access;
    this.refreshToken = data.refresh;
    localStorage.setItem('accessToken', data.access);
    localStorage.setItem('refreshToken', data.refresh);
    return data;
  }

  async refreshAccessToken(): Promise<TokenRefreshResponse> {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    if (!refreshTokenValue) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseURL}/auth/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshTokenValue }),
    });

    if (!response.ok) {
      // Clear tokens if refresh fails
      this.accessToken = null;
      this.refreshToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      throw new Error('Token refresh failed');
    }

    const data: TokenRefreshResponse = await response.json();
    this.accessToken = data.access;
    localStorage.setItem('accessToken', data.access);
    return data;
  }

  // Vendor methods
  async getVendors(params?: {
    business_type?: string;
    search?: string;
    ordering?: string;
  }): Promise<{ count: number; results: Vendor[] }> {
    const url = new URL(`${this.baseURL}/vendors/`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('Failed to fetch vendors');
    }

    return response.json();
  }

  async getVendor(id: string): Promise<Vendor> {
    const response = await fetch(`${this.baseURL}/vendors/${id}/`);
    if (!response.ok) {
      throw new Error('Failed to fetch vendor');
    }

    return response.json();
  }

  async searchVendors(params: {
    business_type?: string;
    min_rating?: number;
    max_delivery_radius?: number;
    search?: string;
  }): Promise<Vendor[]> {
    const url = new URL(`${this.baseURL}/vendors/search/`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.append(key, value.toString());
    });

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('Failed to search vendors');
    }

    return response.json();
  }

  async registerVendor(vendorData: any): Promise<Vendor> {
    const response = await fetch(`${this.baseURL}/vendors/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(vendorData),
    });

    if (!response.ok) {
      throw new Error('Failed to register vendor');
    }

    return response.json();
  }

  async updateVendor(id: string, vendorData: Partial<Vendor>): Promise<Vendor> {
    const response = await fetch(`${this.baseURL}/vendors/${id}/update/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(vendorData),
    });

    if (!response.ok) {
      throw new Error('Failed to update vendor');
    }

    return response.json();
  }

  async getVendorStats(id: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/vendors/${id}/stats/`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch vendor stats');
    }

    return response.json();
  }

  // Menu Items methods
  async getMenuItems(params?: {
    vendor?: string;
    category?: string;
    search?: string;
    ordering?: string;
  }): Promise<{ count: number; results: MenuItemType[] }> {
    const url = new URL(`${this.baseURL}/vendors/menu-items/`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('Failed to fetch menu items');
    }

    return response.json();
  }

  async getMenuItem(id: string): Promise<MenuItemType> {
    const response = await fetch(`${this.baseURL}/vendors/menu-items/${id}/`);
    if (!response.ok) {
      throw new Error('Failed to fetch menu item');
    }

    return response.json();
  }

  async createMenuItem(menuItemData: Omit<MenuItemType, 'id'>): Promise<MenuItemType> {
    const response = await fetch(`${this.baseURL}/vendors/menu-items/create/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(menuItemData),
    });

    if (!response.ok) {
      throw new Error('Failed to create menu item');
    }

    return response.json();
  }

  async updateMenuItem(id: string, menuItemData: Partial<MenuItemType>): Promise<MenuItemType> {
    const response = await fetch(`${this.baseURL}/vendors/menu-items/${id}/update/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(menuItemData),
    });

    if (!response.ok) {
      throw new Error('Failed to update menu item');
    }

    return response.json();
  }

  async deleteMenuItem(id: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/vendors/menu-items/${id}/delete/`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete menu item');
    }
  }

  async getVendorMenu(vendorId: string): Promise<MenuItemType[]> {
    const response = await fetch(`${this.baseURL}/vendors/${vendorId}/menu/`);
    if (!response.ok) {
      throw new Error('Failed to fetch vendor menu');
    }

    return response.json();
  }

  // Menu Categories methods
  async getCategories(params?: { vendor?: string }): Promise<MenuCategory[]> {
    const url = new URL(`${this.baseURL}/vendors/categories/`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    return response.json();
  }

  async createCategory(categoryData: Omit<MenuCategory, 'id'>): Promise<MenuCategory> {
    const response = await fetch(`${this.baseURL}/vendors/categories/create/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(categoryData),
    });

    if (!response.ok) {
      throw new Error('Failed to create category');
    }

    return response.json();
  }

  // Orders methods
  async getOrders(params?: {
    status?: string;
    delivery_type?: string;
    ordering?: string;
  }): Promise<{ count: number; results: Order[] }> {
    const url = new URL(`${this.baseURL}/orders/`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    return response.json();
  }

  async getOrder(id: string): Promise<Order> {
    const response = await fetch(`${this.baseURL}/orders/${id}/`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch order');
    }

    return response.json();
  }

  async createOrder(orderData: {
    vendor_id: string;
    delivery_type: 'delivery' | 'pickup';
    delivery_address?: string;
    delivery_instructions?: string;
    items: Array<{
      menu_item_id: string;
      quantity: number;
      special_instructions?: string;
    }>;
  }): Promise<Order> {
    const response = await fetch(`${this.baseURL}/orders/create/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error('Failed to create order');
    }

    return response.json();
  }

  async updateOrder(id: string, orderData: Partial<Order>): Promise<Order> {
    const response = await fetch(`${this.baseURL}/orders/${id}/update/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error('Failed to update order');
    }

    return response.json();
  }

  async deleteOrder(id: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/orders/${id}/delete/`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete order');
    }
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const response = await fetch(`${this.baseURL}/orders/${id}/status/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error('Failed to update order status');
    }

    return response.json();
  }

  async getMyOrders(): Promise<Order[]> {
    const response = await fetch(`${this.baseURL}/orders/my-orders/`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch my orders');
    }

    return response.json();
  }

  async getVendorOrders(): Promise<Order[]> {
    const response = await fetch(`${this.baseURL}/orders/vendor-orders/`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch vendor orders');
    }

    return response.json();
  }

  async getOrderStats(): Promise<any> {
    const response = await fetch(`${this.baseURL}/orders/stats/`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch order stats');
    }

    return response.json();
  }

  async searchOrders(params: {
    status?: string;
    delivery_type?: string;
    start_date?: string;
    end_date?: string;
    order_number?: string;
  }): Promise<Order[]> {
    const url = new URL(`${this.baseURL}/orders/search/`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.append(key, value.toString());
    });

    const response = await fetch(url.toString(), {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to search orders');
    }

    return response.json();
  }

  // Reviews methods
  async getVendorReviews(vendorId: string): Promise<Review[]> {
    const response = await fetch(`${this.baseURL}/vendors/${vendorId}/reviews/`);
    if (!response.ok) {
      throw new Error('Failed to fetch vendor reviews');
    }

    return response.json();
  }

  async createReview(vendorId: string, reviewData: {
    rating: number;
    comment: string;
  }): Promise<Review> {
    const response = await fetch(`${this.baseURL}/vendors/${vendorId}/reviews/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(reviewData),
    });

    if (!response.ok) {
      throw new Error('Failed to create review');
    }

    return response.json();
  }

  // Utility methods
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    // Always read from localStorage to ensure token is current
    const token = localStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async getCurrentUser(): Promise<User | null> {
    // Check token first - if no token, return null immediately without API call
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return null;
    }
    
    try {
      const response = await fetch(`${this.baseURL}/auth/user/`, {
        headers: this.getAuthHeaders(),
      });
      if (response.ok) {
        return response.json();
      }
      // If token is invalid, try to refresh it
      if (response.status === 401) {
        try {
          await this.refreshAccessToken();
          // Retry the request with new token
          const retryResponse = await fetch(`${this.baseURL}/auth/user/`, {
            headers: this.getAuthHeaders(),
          });
          if (retryResponse.ok) {
            return retryResponse.json();
          }
        } catch {
          // Refresh failed, clear tokens
          this.accessToken = null;
          this.refreshToken = null;
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  // User profile methods
  async updateProfile(profileData: ProfileUpdateForm): Promise<User> {
    // TODO: Implement when backend endpoint is available
    // This is a placeholder for the future profile update endpoint
    const response = await fetch(`${this.baseURL}/auth/profile/update/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update profile');
    }

    return response.json();
  }

  // Lookup methods
  async getCountries(params?: {
    search?: string;
    region?: string;
    sub_region?: string;
    ordering?: string;
  }): Promise<{ count: number; results: Country[] }> {
    const allResults: Country[] = [];
    let nextUrl: string | null = `${this.baseURL}/lookups/countries/`;
    
    // Build initial URL with params
    const baseUrl = new URL(nextUrl);
    baseUrl.searchParams.append('page_size', '1000'); // Request large page size
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value && key !== 'page_size') baseUrl.searchParams.append(key, value);
      });
    }
    nextUrl = baseUrl.toString();

    // Fetch all pages
    while (nextUrl) {
      const response: Response = await fetch(nextUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch countries');
      }

      const data: any = await response.json();
      
      // Handle different response formats
      if (Array.isArray(data)) {
        // If response is directly an array
        allResults.push(...data);
        nextUrl = null;
      } else if (data.results && Array.isArray(data.results)) {
        // Standard paginated response
        allResults.push(...data.results);
        nextUrl = data.next || null;
      } else {
        // Fallback
        allResults.push(...(data.results || []));
        nextUrl = null;
      }
    }

    return {
      count: allResults.length,
      results: allResults,
    };
  }

  async getLanguages(params?: {
    search?: string;
    type?: string;
    ordering?: string;
  }): Promise<{ count: number; results: Language[] }> {
    const allResults: Language[] = [];
    let nextUrl: string | null = `${this.baseURL}/lookups/languages/`;
    
    // Build initial URL with params
    const baseUrl = new URL(nextUrl);
    baseUrl.searchParams.append('page_size', '1000'); // Request large page size
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value && key !== 'page_size') baseUrl.searchParams.append(key, value);
      });
    }
    nextUrl = baseUrl.toString();

    // Fetch all pages
    while (nextUrl) {
      const response: Response = await fetch(nextUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch languages');
      }

      const data: any = await response.json();
      
      // Handle different response formats
      if (Array.isArray(data)) {
        // If response is directly an array
        allResults.push(...data);
        nextUrl = null;
      } else if (data.results && Array.isArray(data.results)) {
        // Standard paginated response
        allResults.push(...data.results);
        nextUrl = data.next || null;
      } else {
        // Fallback
        allResults.push(...(data.results || []));
        nextUrl = null;
      }
    }

    return {
      count: allResults.length,
      results: allResults,
    };
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const api = new ApiService();
export default api;
