// API service for Django backend integration
import { Vendor, ProductService, Order, Review, User, AuthResponse, TokenRefreshResponse, ProfileUpdateForm, Country, Language, LoginResponse, VendorStats, ProductImage, VendorImage, CustomerAddress, FavoriteVendor, FavoriteProductService } from '../types/index';

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
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${this.baseURL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Login failed');
    }

    const data = await response.json();
    
    // Check if 2FA is required
    if (data.requires_2fa) {
      return data;
    }
    
    // Normal login - store tokens
    this.accessToken = data.access;
    this.refreshToken = data.refresh;
    localStorage.setItem('accessToken', data.access);
    localStorage.setItem('refreshToken', data.refresh);
    return data as AuthResponse;
  }

  async verifyOTP(otpCode: string, sessionToken: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/auth/verify-otp/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ otp_code: otpCode, session_token: sessionToken }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'OTP verification failed');
    }

    const data: AuthResponse = await response.json();
    this.accessToken = data.access;
    this.refreshToken = data.refresh;
    localStorage.setItem('accessToken', data.access);
    localStorage.setItem('refreshToken', data.refresh);
    return data;
  }

  async oauthInitiate(provider: 'google' | 'facebook'): Promise<{ auth_url: string; provider: string }> {
    const response = await fetch(`${this.baseURL}/auth/oauth/${provider}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to initiate ${provider} login`);
    }

    return response.json();
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


  // ProductService methods (replacing MenuItems)
  async getMenuItems(params?: {
    vendor?: string;
    category?: string;
    search?: string;
    ordering?: string;
  }): Promise<{ count: number; results: ProductService[] }> {
    const url = new URL(`${this.baseURL}/vendors/products-services/`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('Failed to fetch products/services');
    }

    return response.json();
  }

  async getMenuItem(id: string): Promise<ProductService> {
    const response = await fetch(`${this.baseURL}/vendors/products-services/${id}/`);
    if (!response.ok) {
      throw new Error('Failed to fetch product/service');
    }

    return response.json();
  }

  async createMenuItem(menuItemData: Omit<ProductService, 'id' | 'created_at' | 'vendor'>): Promise<ProductService> {
    const response = await fetch(`${this.baseURL}/vendors/products-services/create/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(menuItemData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || errorData.error || JSON.stringify(errorData) || 'Failed to create product/service';
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async updateMenuItem(id: string, menuItemData: Partial<ProductService>): Promise<ProductService> {
    const response = await fetch(`${this.baseURL}/vendors/products-services/${id}/update/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(menuItemData),
    });

    if (!response.ok) {
      throw new Error('Failed to update product/service');
    }

    return response.json();
  }

  async deleteMenuItem(id: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/vendors/products-services/${id}/delete/`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete product/service');
    }
  }

  // Aliases for ProductService methods (for consistency)
  async getProductService(id: string): Promise<ProductService> {
    return this.getMenuItem(id);
  }

  async getProductServices(params?: {
    vendor?: string;
    category?: string;
    search?: string;
    ordering?: string;
  }): Promise<{ count: number; results: ProductService[] }> {
    return this.getMenuItems(params);
  }

  async createProductService(menuItemData: Omit<ProductService, 'id' | 'created_at' | 'vendor'>): Promise<ProductService> {
    return this.createMenuItem(menuItemData);
  }

  async updateProductService(id: string, menuItemData: Partial<ProductService>): Promise<ProductService> {
    return this.updateMenuItem(id, menuItemData);
  }

  async deleteProductService(id: string): Promise<void> {
    return this.deleteMenuItem(id);
  }

  async getVendorMenu(vendorId: string): Promise<ProductService[]> {
    const response = await fetch(`${this.baseURL}/vendors/${vendorId}/products-services/`);
    if (!response.ok) {
      throw new Error('Failed to fetch vendor menu');
    }

    const data = await response.json();
    // Handle paginated response or direct array
    return Array.isArray(data) ? data : (data.results || []);
  }

  async getMyVendorProductsServices(): Promise<ProductService[]> {
    const response = await fetch(`${this.baseURL}/vendors/profile/products-services/`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch my vendor products/services');
    }

    return response.json();
  }

  async uploadVendorProfileImage(file: File): Promise<Vendor> {
    const formData = new FormData();
    formData.append('file', file);

    // Get auth headers but exclude Content-Type for FormData
    const authHeaders = this.getAuthHeaders();
    const { 'Content-Type': _, ...headersWithoutContentType } = authHeaders;

    const response = await fetch(`${this.baseURL}/vendors/profile/image/`, {
      method: 'POST',
      headers: headersWithoutContentType,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || 'Failed to upload vendor profile image';
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async uploadProductServiceImage(productId: string, file: File): Promise<ProductService> {
    const formData = new FormData();
    formData.append('file', file);

    // Get auth headers but exclude Content-Type for FormData
    const authHeaders = this.getAuthHeaders();
    const { 'Content-Type': _, ...headersWithoutContentType } = authHeaders;

    const response = await fetch(`${this.baseURL}/vendors/products-services/${productId}/image/`, {
      method: 'POST',
      headers: headersWithoutContentType,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || 'Failed to upload product/service image';
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async getProductImages(productId: string): Promise<ProductImage[]> {
    const response = await fetch(`${this.baseURL}/vendors/products-services/${productId}/images/`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch product images');
    }

    return response.json();
  }

  async uploadProductImages(productServiceId: string, files: File[]): Promise<ProductImage[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    // Get auth headers but exclude Content-Type for FormData
    const authHeaders = this.getAuthHeaders();
    const { 'Content-Type': _, ...headersWithoutContentType } = authHeaders;

    const response = await fetch(`${this.baseURL}/vendors/products-services/${productServiceId}/images/upload/`, {
      method: 'POST',
      headers: headersWithoutContentType,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || 'Failed to upload product images';
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async updateProductImage(imageId: string, imageData: { is_preview?: boolean; display_order?: number }): Promise<ProductImage> {
    const response = await fetch(`${this.baseURL}/vendors/products-services/images/${imageId}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(imageData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.detail || errorData.message || JSON.stringify(errorData) || 'Failed to update product image';
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async deleteProductImage(imageId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/vendors/products-services/images/${imageId}/`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || 'Failed to delete product image';
      throw new Error(errorMessage);
    }
  }

  async getVendorImages(): Promise<VendorImage[]> {
    const response = await fetch(`${this.baseURL}/vendors/profile/images/`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch vendor images');
    }

    return response.json();
  }

  async uploadVendorImages(files: File[]): Promise<VendorImage[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    // Get auth headers but exclude Content-Type for FormData
    const authHeaders = this.getAuthHeaders();
    const { 'Content-Type': _, ...headersWithoutContentType } = authHeaders;

    const response = await fetch(`${this.baseURL}/vendors/profile/images/upload/`, {
      method: 'POST',
      headers: headersWithoutContentType,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || 'Failed to upload vendor images';
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async updateVendorImage(imageId: string, imageData: { is_preview?: boolean; display_order?: number }): Promise<VendorImage> {
    const response = await fetch(`${this.baseURL}/vendors/profile/images/${imageId}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(imageData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.detail || errorData.message || JSON.stringify(errorData) || 'Failed to update vendor image';
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async deleteVendorImage(imageId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/vendors/profile/images/${imageId}/`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || 'Failed to delete vendor image';
      throw new Error(errorMessage);
    }
  }

  async getCurrentVendor(): Promise<Vendor | null> {
    try {
      const response = await fetch(`${this.baseURL}/vendors/profile/`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 404) {
          return null; // User doesn't have a vendor profile
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || 'Failed to fetch current vendor');
      }

      return response.json();
    } catch (error) {
      // If it's already an Error, rethrow it
      if (error instanceof Error && error.message.includes('vendor profile')) {
        return null;
      }
      // For network errors or other issues, return null to allow graceful handling
      console.error('Error fetching vendor profile:', error);
      return null;
    }
  }

  async updateVendorProfile(vendorData: Partial<Vendor>): Promise<Vendor> {
    const response = await fetch(`${this.baseURL}/vendors/profile/update/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(vendorData),
    });

    if (!response.ok) {
      throw new Error('Failed to update vendor profile');
    }

    return response.json();
  }

  async getVendorStats(): Promise<VendorStats> {
    const response = await fetch(`${this.baseURL}/vendors/stats/`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch vendor stats');
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
      body: JSON.stringify({ current_status: status }),
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

    const data = await response.json();
    // Handle paginated response or direct array
    return Array.isArray(data) ? data : (data.results || []);
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

  // Token management methods
  setAccessToken(token: string | null): void {
    this.accessToken = token;
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  setRefreshToken(token: string | null): void {
    this.refreshToken = token;
    if (token) {
      localStorage.setItem('refreshToken', token);
    } else {
      localStorage.removeItem('refreshToken');
    }
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
    const response = await fetch(`${this.baseURL}/users/profile/update/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Extract validation errors if present
      if (errorData && typeof errorData === 'object') {
        // Check for field-specific errors
        const fieldErrors = Object.keys(errorData)
          .filter(key => Array.isArray(errorData[key]) && errorData[key].length > 0)
          .map(key => `${key}: ${errorData[key].join(', ')}`)
          .join('; ');
        
        if (fieldErrors) {
          throw new Error(fieldErrors);
        }
        
        // Check for general error message
        if (errorData.error) {
          throw new Error(errorData.error);
        }
        
        // Check for non-field error messages
        if (errorData.detail) {
          throw new Error(errorData.detail);
        }
      }
      
      throw new Error('Failed to update profile. Please try again.');
    }

    return response.json();
  }

  async uploadProfilePicture(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('file', file);

    // Get auth headers but exclude Content-Type for FormData
    const authHeaders = this.getAuthHeaders();
    const { 'Content-Type': _, ...headersWithoutContentType } = authHeaders;

    const response = await fetch(`${this.baseURL}/users/profile/picture/`, {
      method: 'POST',
      headers: headersWithoutContentType,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (errorData.error) {
        throw new Error(errorData.error);
      }
      
      throw new Error('Failed to upload profile picture. Please try again.');
    }

    return response.json();
  }

  async deleteProfilePicture(): Promise<User> {
    const response = await fetch(`${this.baseURL}/users/profile/picture/`, {
      method: 'DELETE',
      headers: {
        ...this.getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete profile picture');
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

  // Customer Address methods
  async getCustomerAddresses(): Promise<CustomerAddress[]> {
    const response = await fetch(`${this.baseURL}/auth/customers/addresses/`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch customer addresses');
    }

    return response.json();
  }

  async createCustomerAddress(addressData: Omit<CustomerAddress, 'id' | 'user' | 'created_at'>): Promise<CustomerAddress> {
    const response = await fetch(`${this.baseURL}/auth/customers/addresses/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(addressData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.detail || 'Failed to create address';
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async updateCustomerAddress(addressId: string, addressData: Partial<CustomerAddress>): Promise<CustomerAddress> {
    const response = await fetch(`${this.baseURL}/auth/customers/addresses/${addressId}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(addressData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.detail || 'Failed to update address';
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async deleteCustomerAddress(addressId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/auth/customers/addresses/${addressId}/`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.detail || 'Failed to delete address';
      throw new Error(errorMessage);
    }
  }

  async setDefaultAddress(addressId: string): Promise<CustomerAddress> {
    const response = await fetch(`${this.baseURL}/auth/customers/addresses/${addressId}/set-default/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.detail || 'Failed to set default address';
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Favorite Vendor methods
  async getFavoriteVendors(): Promise<FavoriteVendor[]> {
    const response = await fetch(`${this.baseURL}/auth/customers/favorites/`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch favorite vendors');
    }

    const data = await response.json();
    // Handle paginated response or direct array
    return Array.isArray(data) ? data : (data.results || []);
  }

  async addFavoriteVendor(vendorId: string): Promise<FavoriteVendor> {
    const response = await fetch(`${this.baseURL}/auth/customers/favorites/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ vendor_id: parseInt(vendorId, 10) }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Extract error message from various possible formats
      const errorMessage = errorData.detail || 
                          (Array.isArray(errorData.vendor_id) ? errorData.vendor_id[0] : null) ||
                          errorData.error || 
                          errorData.message ||
                          (typeof errorData === 'string' ? errorData : JSON.stringify(errorData)) ||
                          'Failed to add favorite vendor';
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async removeFavoriteVendor(vendorId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/auth/customers/favorites/${vendorId}/`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.detail || 'Failed to remove favorite vendor';
      throw new Error(errorMessage);
    }
  }

  async getFavoriteProducts(): Promise<FavoriteProductService[]> {
    const response = await fetch(`${this.baseURL}/auth/customers/favorites/products/`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch favorite products');
    }

    const data = await response.json();
    // Handle paginated response or direct array
    return Array.isArray(data) ? data : (data.results || []);
  }

  async addFavoriteProduct(productServiceId: string): Promise<FavoriteProductService> {
    const response = await fetch(`${this.baseURL}/auth/customers/favorites/products/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ product_service_id: parseInt(productServiceId, 10) }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Extract error message from various possible formats
      const errorMessage = errorData.detail || 
                          (Array.isArray(errorData.product_service_id) ? errorData.product_service_id[0] : null) ||
                          errorData.error || 
                          errorData.message ||
                          (typeof errorData === 'string' ? errorData : JSON.stringify(errorData)) ||
                          'Failed to add favorite product';
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async removeFavoriteProduct(productServiceId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/auth/customers/favorites/products/${productServiceId}/`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.detail || 'Failed to remove favorite product';
      throw new Error(errorMessage);
    }
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
