// React Query hooks for API integration
import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../services/api';
import { Vendor, ProductService, Order, Review, User, AuthResponse, Country, Language, ProfileUpdateForm, VendorStats, ProductImage, VendorImage, CustomerAddress, FavoriteVendor, LoginResponse } from '../types/index';

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

export const useVendorOrders = () => {
  return useQuery(
    ['vendor-orders'],
    () => api.getVendorOrders(),
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
      staleTime: 60 * 1000, // 1 minute
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

export const useMyOrders = () => {
  return useQuery(
    ['my-orders'],
    () => api.getMyOrders(),
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
        queryClient.invalidateQueries(['orders']);
        queryClient.invalidateQueries(['my-orders']);
        queryClient.invalidateQueries(['vendor-orders']);
        queryClient.invalidateQueries(['vendor-stats']);
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

export const useOrderStats = (vendorId?: string) => {
  return useQuery(
    ['order-stats', vendorId],
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
