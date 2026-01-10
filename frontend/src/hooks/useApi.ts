// React Query hooks for API integration
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../services/api';
import { Vendor, ProductService, Order, Review, User, AuthResponse, Country, Language, ProfileUpdateForm, VendorStats, ProductImage, VendorImage, CustomerAddress, FavoriteVendor, FavoriteProductService, LoginResponse, OrderStats, RefundRequest } from '../types/index';

// Authentication hooks
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (credentials: { email: string; password: string }) => api.login(credentials.email, credentials.password),
    {
      onSuccess: (data: LoginResponse) => {
        // Handle both AuthResponse and TwoFactorAuthResponse
        if ('access' in data && data.access) {
          // Normal login response - tokens are already stored by api.login
          localStorage.setItem('accessToken', data.access);
          localStorage.setItem('refreshToken', data.refresh);
        }
        // For 2FA, tokens aren't set yet - they'll be set after OTP verification
        queryClient.invalidateQueries(['current-user']);
      },
    }
  );
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    () => api.logout(),
    {
      onSuccess: () => {
        // Clear tokens
        api.setAccessToken(null);
        api.setRefreshToken(null);
        // Clear all queries
        queryClient.clear();
      },
    }
  );
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (userData: any) => api.register(userData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['current-user']);
      },
    }
  );
};

export const useRegisterVendor = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (vendorData: any) => api.registerVendor(vendorData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['current-user']);
        queryClient.invalidateQueries(['current-vendor']);
      },
    }
  );
};

export const useCurrentUser = () => {
  return useQuery(
    ['current-user'],
    () => api.getCurrentUser(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: false,
    }
  );
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (profileData: ProfileUpdateForm) => api.updateProfile(profileData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['current-user']);
      },
    }
  );
};

export const useUploadProfilePicture = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (file: File) => api.uploadProfilePicture(file),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['current-user']);
      },
    }
  );
};

export const useDeleteProfilePicture = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    () => api.deleteProfilePicture(),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['current-user']);
      },
    }
  );
};

// Vendor hooks
export const useVendors = (params?: { search?: string; category?: string }) => {
  return useQuery(
    ['vendors', params],
    () => api.getVendors(params),
    {
      staleTime: 60 * 1000, // 1 minute
    }
  );
};

export const useVendor = (vendorId: string) => {
  return useQuery(
    ['vendor', vendorId],
    () => api.getVendor(vendorId),
    {
      enabled: !!vendorId,
      staleTime: 60 * 1000, // 1 minute
    }
  );
};

export const useVendorMenu = (vendorId: string) => {
  return useQuery(
    ['vendor-menu', vendorId],
    () => api.getVendorMenu(vendorId),
    {
      enabled: !!vendorId,
      staleTime: 60 * 1000, // 1 minute
    }
  );
};

export const useCurrentVendor = () => {
  return useQuery(
    ['current-vendor'],
    () => api.getCurrentVendor(),
    {
      staleTime: 60 * 1000, // 1 minute
    }
  );
};

export const useUpdateVendorProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (vendorData: Partial<Vendor>) => api.updateVendorProfile(vendorData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['current-vendor']);
        queryClient.invalidateQueries(['vendors']);
      },
    }
  );
};

export const useVendorStats = () => {
  return useQuery(
    ['vendor-stats'],
    () => api.getVendorStats(),
    {
      staleTime: 60 * 1000, // 1 minute
    }
  );
};

export const useMyVendorMenu = () => {
  return useQuery(
    ['my-vendor-menu'],
    () => api.getMyVendorProductsServices(),
    {
      staleTime: 60 * 1000, // 1 minute
    }
  );
};

export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (menuItemData: Omit<ProductService, 'id' | 'created_at' | 'vendor'>) => api.createProductService(menuItemData),
    {
      onSuccess: (data: ProductService) => {
        queryClient.invalidateQueries(['my-vendor-menu']);
        queryClient.invalidateQueries(['vendor-menu', String(data.vendor)]);
        queryClient.invalidateQueries(['vendor-stats']);
      },
    }
  );
};

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ menuItemId, menuItemData }: { menuItemId: string; menuItemData: Partial<ProductService> }) =>
      api.updateProductService(menuItemId, menuItemData),
    {
      onSuccess: (data: ProductService) => {
        queryClient.invalidateQueries(['my-vendor-menu']);
        queryClient.invalidateQueries(['vendor-menu', String(data.vendor)]);
        queryClient.invalidateQueries(['vendor', String(data.vendor)]);
      },
    }
  );
};

export const useDeleteMenuItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (menuItemId: string) => api.deleteProductService(menuItemId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['my-vendor-menu']);
        queryClient.invalidateQueries(['vendor-menu']);
        queryClient.invalidateQueries(['vendor-stats']);
      },
    }
  );
};

export const useMenuItem = (menuItemId: string) => {
  return useQuery(
    ['menu-item', menuItemId],
    () => api.getProductService(menuItemId),
    {
      enabled: !!menuItemId,
      staleTime: 60 * 1000, // 1 minute
    }
  );
};

export const useMenuItems = (params?: { vendor?: string; search?: string }) => {
  return useQuery(
    ['menu-items', params],
    () => api.getProductServices(params),
    {
      staleTime: 60 * 1000, // 1 minute
    }
  );
};

export const useVendorOrders = (params?: {
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  ordering?: string;
}) => {
  return useQuery(
    ['vendor-orders', params],
    () => api.getVendorOrders(params),
    {
      staleTime: 30 * 1000, // 30 seconds
    }
  );
};

export const useVendorReviews = (vendorId: string) => {
  return useQuery(
    ['vendor-reviews', vendorId],
    () => api.getVendorReviews(vendorId),
    {
      enabled: !!vendorId,
      staleTime: 0, // Always refetch when invalidated
      cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
      refetchOnWindowFocus: true,
    }
  );
};

export const useUploadVendorProfileImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (file: File) => api.uploadVendorProfileImage(file),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['current-vendor']);
        queryClient.invalidateQueries(['vendors']);
      },
    }
  );
};

export const useUploadProductServiceImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ productServiceId, file }: { productServiceId: string; file: File }) =>
      api.uploadProductServiceImage(productServiceId, file),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['my-vendor-menu']);
        queryClient.invalidateQueries(['vendor-menu']);
      },
    }
  );
};

export const useProductImages = (productServiceId: string) => {
  return useQuery(
    ['product-images', productServiceId],
    () => api.getProductImages(productServiceId),
    {
      enabled: !!productServiceId,
      staleTime: 60 * 1000, // 1 minute
    }
  );
};

export const useUploadProductImages = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ productServiceId, files }: { productServiceId: string; files: File[] }) =>
      api.uploadProductImages(productServiceId, files),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(['product-images', variables.productServiceId]);
        queryClient.invalidateQueries(['my-vendor-menu']);
        queryClient.invalidateQueries(['vendor-menu']);
      },
    }
  );
};

export const useUpdateProductImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ imageId, imageData }: { imageId: string; imageData: Partial<ProductImage> }) =>
      api.updateProductImage(imageId, imageData),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['product-images']);
        queryClient.invalidateQueries(['my-vendor-menu']);
        queryClient.invalidateQueries(['vendor-menu']);
      },
    }
  );
};

export const useDeleteProductImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (imageId: string) => api.deleteProductImage(imageId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['product-images']);
        queryClient.invalidateQueries(['my-vendor-menu']);
        queryClient.invalidateQueries(['vendor-menu']);
      },
    }
  );
};

export const useVendorImages = () => {
  return useQuery(
    ['vendor-images'],
    () => api.getVendorImages(),
    {
      staleTime: 60 * 1000, // 1 minute
    }
  );
};

export const useUploadVendorImages = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (files: File[]) => api.uploadVendorImages(files),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['vendor-images']);
        queryClient.invalidateQueries(['current-vendor']);
        queryClient.invalidateQueries(['vendors']);
      },
    }
  );
};

export const useUpdateVendorImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ imageId, imageData }: { imageId: string; imageData: Partial<VendorImage> }) =>
      api.updateVendorImage(imageId, imageData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['vendor-images']);
        queryClient.invalidateQueries(['current-vendor']);
        queryClient.invalidateQueries(['vendors']);
      },
    }
  );
};

export const useDeleteVendorImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (imageId: string) => api.deleteVendorImage(imageId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['vendor-images']);
        queryClient.invalidateQueries(['current-vendor']);
        queryClient.invalidateQueries(['vendors']);
      },
    }
  );
};

export const useUpdateVendor = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ vendorId, vendorData }: { vendorId: string; vendorData: Partial<Vendor> }) =>
      api.updateVendor(vendorId, vendorData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['vendors']);
        queryClient.invalidateQueries(['vendor']);
      },
    }
  );
};

// Order hooks
export const useOrders = (params?: { status?: string; vendor?: string }) => {
  return useQuery(
    ['orders', params],
    () => api.getOrders(params),
    {
      staleTime: 30 * 1000, // 30 seconds
    }
  );
};

export const useOrder = (orderId: string) => {
  return useQuery(
    ['order', orderId],
    () => api.getOrder(orderId),
    {
      enabled: !!orderId,
      staleTime: 30 * 1000, // 30 seconds
    }
  );
};

export const useMyOrders = (params?: {
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  ordering?: string;
}) => {
  return useQuery(
    ['my-orders', params],
    () => api.getMyOrders(params),
    {
      staleTime: 30 * 1000, // 30 seconds
    }
  );
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (orderData: any) => api.createOrder(orderData),
    {
      onSuccess: () => {
        // Invalidate all order-related queries
        queryClient.invalidateQueries(['orders']);
        queryClient.invalidateQueries(['my-orders']); // This will invalidate all my-orders queries regardless of params
        queryClient.invalidateQueries(['vendor-orders']);
        queryClient.invalidateQueries(['vendor-stats']);
        queryClient.invalidateQueries(['order-stats']);
      },
    }
  );
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ orderId, orderData }: { orderId: string; orderData: Partial<Order> }) =>
      api.updateOrder(orderId, orderData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['orders']);
        queryClient.invalidateQueries(['order']);
        queryClient.invalidateQueries(['my-orders']);
        queryClient.invalidateQueries(['vendor-orders']);
      },
    }
  );
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ orderId, status }: { orderId: string; status: string }) =>
      api.updateOrderStatus(orderId, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['orders']);
        queryClient.invalidateQueries(['order']);
        queryClient.invalidateQueries(['my-orders']);
        queryClient.invalidateQueries(['vendor-orders']);
        queryClient.invalidateQueries(['vendor-stats']);
        queryClient.invalidateQueries(['order-stats']);
      },
    }
  );
};

export const useUpdateOrderEstimatedTime = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ orderId, estimatedTime }: { orderId: string; estimatedTime: string }) =>
      api.updateOrderEstimatedTime(orderId, estimatedTime),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['orders']);
        queryClient.invalidateQueries(['order']);
        queryClient.invalidateQueries(['my-orders']);
        queryClient.invalidateQueries(['vendor-orders']);
        queryClient.invalidateQueries(['vendor-stats']);
        queryClient.invalidateQueries(['order-stats']);
      },
    }
  );
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ orderId, reason }: { orderId: string; reason?: string }) =>
      api.cancelOrder(orderId, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['orders']);
        queryClient.invalidateQueries(['order']);
        queryClient.invalidateQueries(['my-orders']);
        queryClient.invalidateQueries(['vendor-orders']);
        queryClient.invalidateQueries(['order-stats']);
      },
    }
  );
};

export const useRequestRefund = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ orderId, reason }: { orderId: string; reason: string }) => api.requestRefund(orderId, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['refund-requests']);
        queryClient.invalidateQueries(['orders']);
        queryClient.invalidateQueries(['my-orders']);
        queryClient.invalidateQueries(['vendor-orders']);
      },
    }
  );
};

export const useRefundRequests = (params?: { status?: string; order?: string }) => {
  return useQuery(
    ['refund-requests', params],
    () => api.getRefundRequests(params),
    {
      staleTime: 30000, // 30 seconds
    }
  );
};

export const useApproveRefundRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ refundRequestId }: { refundRequestId: string }) => api.approveRefundRequest(refundRequestId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['refund-requests']);
        queryClient.invalidateQueries(['orders']);
        queryClient.invalidateQueries(['my-orders']);
        queryClient.invalidateQueries(['vendor-orders']);
        queryClient.invalidateQueries(['vendor-stats']);
        queryClient.invalidateQueries(['order-stats']);
      },
    }
  );
};

export const useDenyRefundRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ refundRequestId, denialReason }: { refundRequestId: string; denialReason?: string }) => 
      api.denyRefundRequest(refundRequestId, denialReason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['refund-requests']);
        queryClient.invalidateQueries(['orders']);
        queryClient.invalidateQueries(['my-orders']);
        queryClient.invalidateQueries(['vendor-orders']);
      },
    }
  );
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (orderId: string) => api.deleteOrder(orderId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['orders']);
        queryClient.invalidateQueries(['my-orders']);
        queryClient.invalidateQueries(['vendor-orders']);
      },
    }
  );
};

export const useOrderStats = () => {
  return useQuery(
    ['order-stats'],
    () => api.getOrderStats(),
    {
      staleTime: 60 * 1000, // 1 minute
    }
  );
};

export const useSearchOrders = (searchQuery: string) => {
  return useQuery(
    ['search-orders', searchQuery],
    () => api.searchOrders({ order_number: searchQuery }),
    {
      enabled: !!searchQuery && searchQuery.length > 0,
      staleTime: 30 * 1000, // 30 seconds
    }
  );
};

export const useSearchVendors = (searchQuery: string) => {
  return useQuery(
    ['search-vendors', searchQuery],
    () => api.searchVendors({ search: searchQuery }),
    {
      enabled: !!searchQuery && searchQuery.length > 0,
      staleTime: 60 * 1000, // 1 minute
    }
  );
};

// Review hooks
export const useMyReviews = () => {
  return useQuery(
    ['my-reviews'],
    () => {
      console.log('Fetching my reviews...');
      return api.getMyReviews();
    },
    {
      staleTime: 0, // Always refetch when invalidated
      cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
      refetchOnWindowFocus: true,
      onSuccess: (data) => {
        console.log('My reviews fetched successfully:', data);
      },
      onError: (error) => {
        console.error('Error fetching my reviews:', error);
      },
    }
  );
};

export const useCreateOrderReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ orderId, reviewData }: { orderId: string; reviewData: { rating: number; comment: string } }) =>
      api.createOrderReview(orderId, reviewData),
    {
      onSuccess: () => {
        // Invalidate and refetch immediately
        queryClient.invalidateQueries(['my-reviews'], { refetchActive: true });
        queryClient.invalidateQueries(['my-orders'], { refetchActive: true });
        queryClient.invalidateQueries(['orders'], { refetchActive: true });
      },
    }
  );
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ reviewId, reviewData }: { reviewId: string; reviewData: { rating: number; comment: string } }) =>
      api.updateReview(reviewId, reviewData),
    {
      onSuccess: () => {
        // Invalidate and refetch immediately
        queryClient.invalidateQueries(['my-reviews'], { refetchActive: true });
        queryClient.invalidateQueries(['my-orders'], { refetchActive: true });
        queryClient.invalidateQueries(['orders'], { refetchActive: true });
      },
    }
  );
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (reviewId: string) => api.deleteReview(reviewId),
    {
      onSuccess: () => {
        // Invalidate and refetch immediately
        queryClient.invalidateQueries(['my-reviews'], { refetchActive: true });
        queryClient.invalidateQueries(['my-orders'], { refetchActive: true });
        queryClient.invalidateQueries(['orders'], { refetchActive: true });
      },
    }
  );
};

// Legacy hook - kept for backward compatibility
export const useCreateReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ vendorId, reviewData }: { vendorId: string; reviewData: { rating: number; comment: string } }) =>
      api.createReview(vendorId, reviewData),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries(['vendor-reviews', variables.vendorId]);
        queryClient.invalidateQueries(['vendor', variables.vendorId]);
        queryClient.invalidateQueries(['vendors']);
      },
    }
  );
};

// Health check
export const useHealthCheck = () => {
  return useQuery(
    ['health-check'],
    () => api.healthCheck(),
    {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }
  );
};

// Lookup data hooks
export const useCountries = (params?: { search?: string; region?: string; sub_region?: string; ordering?: string }) => {
  return useQuery(
    ['countries', params],
    () => api.getCountries(params),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes - countries don't change often
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }
  );
};

export const useLanguages = (params?: { search?: string; type?: string; ordering?: string }) => {
  return useQuery(
    ['languages', params],
    () => api.getLanguages(params),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes - languages don't change often
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }
  );
};

// Customer Addresses hooks
export const useCustomerAddresses = () => {
  return useQuery(
    ['customer-addresses'],
    () => api.getCustomerAddresses(),
    {
      staleTime: 60 * 1000, // 1 minute
      retry: 2, // Retry failed requests
      refetchOnWindowFocus: true, // Refetch when window regains focus
    }
  );
};

export const useCreateCustomerAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (addressData: Omit<CustomerAddress, 'id' | 'user' | 'created_at'>) => api.createCustomerAddress(addressData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['customer-addresses']);
      },
    }
  );
};

export const useUpdateCustomerAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ addressId, addressData }: { addressId: string; addressData: Partial<CustomerAddress> }) =>
      api.updateCustomerAddress(addressId, addressData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['customer-addresses']);
      },
    }
  );
};

export const useDeleteCustomerAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (addressId: string) => api.deleteCustomerAddress(addressId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['customer-addresses']);
      },
    }
  );
};

export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (addressId: string) => api.setDefaultAddress(addressId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['customer-addresses']);
      },
    }
  );
};

// Favorite Vendors hooks
export const useFavoriteVendors = () => {
  return useQuery(
    ['favorite-vendors'],
    () => api.getFavoriteVendors(),
    {
      staleTime: 60 * 1000, // 1 minute
    }
  );
};

export const useAddFavoriteVendor = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (vendorId: string) => api.addFavoriteVendor(vendorId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['favorite-vendors']);
        queryClient.invalidateQueries(['vendors']);
      },
    }
  );
};

export const useRemoveFavoriteVendor = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (vendorId: string) => api.removeFavoriteVendor(vendorId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['favorite-vendors']);
        queryClient.invalidateQueries(['vendors']);
      },
    }
  );
};

// Favorite Products hooks
export const useFavoriteProducts = () => {
  return useQuery(
    ['favorite-products'],
    () => api.getFavoriteProducts(),
    {
      staleTime: 60 * 1000, // 1 minute
    }
  );
};

export const useAddFavoriteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (productServiceId: string) => api.addFavoriteProduct(productServiceId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['favorite-products']);
        queryClient.invalidateQueries(['product-services']);
      },
    }
  );
};

export const useRemoveFavoriteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (productServiceId: string) => api.removeFavoriteProduct(productServiceId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['favorite-products']);
        queryClient.invalidateQueries(['product-services']);
      },
    }
  );
};
