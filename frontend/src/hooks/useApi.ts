// React Query hooks for API integration
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { Vendor, MenuItem as MenuItemType, Order, Review, User, MenuCategory } from '../types/index';

// Authentication hooks
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ username, password }: { username: string; password: string }) =>
      api.login(username, password),
    {
      onSuccess: (data) => {
        // Set new user data and invalidate auth queries
        queryClient.setQueryData(['user', 'current'], data.user);
        queryClient.setQueryData(['auth', 'status'], true);
        queryClient.invalidateQueries(['user', 'current']);
        queryClient.invalidateQueries(['auth', 'status']);
        toast.success('Login successful!');
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Login failed');
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
        // Reset auth queries and invalidate them
        queryClient.setQueryData(['user', 'current'], null);
        queryClient.setQueryData(['auth', 'status'], false);
        queryClient.invalidateQueries(['user', 'current']);
        queryClient.invalidateQueries(['auth', 'status']);
        toast.success('Logged out successfully');
        // Note: Navigation will be handled by the TopNavigation component
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Logout failed');
      },
    }
  );
};

export const useRegister = () => {
  return useMutation(
    (userData: any) => api.register(userData),
    {
      onSuccess: () => {
        toast.success('Registration successful!');
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Registration failed');
      },
    }
  );
};

// Vendor hooks
export const useVendors = (params?: {
  business_type?: string;
  search?: string;
  ordering?: string;
}) => {
  return useQuery(
    ['vendors', params],
    () => api.getVendors(params),
    {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  );
};

export const useVendor = (id: string) => {
  return useQuery(
    ['vendor', id],
    () => api.getVendor(id),
    {
      enabled: !!id,
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  );
};

export const useSearchVendors = (params: {
  business_type?: string;
  min_rating?: number;
  max_delivery_radius?: number;
  search?: string;
}) => {
  return useQuery(
    ['vendors', 'search', params],
    () => api.searchVendors(params),
    {
      enabled: Object.values(params).some(value => value !== undefined),
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  );
};

export const useRegisterVendor = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (vendorData: any) => api.registerVendor(vendorData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vendors');
        toast.success('Vendor registration successful!');
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Vendor registration failed');
      },
    }
  );
};

export const useUpdateVendor = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ id, data }: { id: string; data: Partial<Vendor> }) =>
      api.updateVendor(id, data),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(['vendor', variables.id]);
        queryClient.invalidateQueries('vendors');
        toast.success('Vendor updated successfully!');
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to update vendor');
      },
    }
  );
};

export const useVendorStats = (id: string) => {
  return useQuery(
    ['vendor', id, 'stats'],
    () => api.getVendorStats(id),
    {
      enabled: !!id,
      staleTime: 1 * 60 * 1000, // 1 minute
    }
  );
};

// Menu Items hooks
export const useMenuItems = (params?: {
  vendor?: string;
  category?: string;
  search?: string;
  ordering?: string;
}) => {
  return useQuery(
    ['menu-items', params],
    () => api.getMenuItems(params),
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );
};

export const useMenuItem = (id: string) => {
  return useQuery(
    ['menu-item', id],
    () => api.getMenuItem(id),
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    }
  );
};

export const useVendorMenu = (vendorId: string) => {
  return useQuery(
    ['vendor', vendorId, 'menu'],
    () => api.getVendorMenu(vendorId),
    {
      enabled: !!vendorId,
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  );
};

export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (menuItemData: Omit<MenuItemType, 'id'>) => api.createMenuItem(menuItemData),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('menu-items');
        queryClient.invalidateQueries(['vendor', data.vendor, 'menu']);
        toast.success('Menu item created successfully!');
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to create menu item');
      },
    }
  );
};

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ id, data }: { id: string; data: Partial<MenuItemType> }) =>
      api.updateMenuItem(id, data),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(['menu-item', variables.id]);
        queryClient.invalidateQueries('menu-items');
        queryClient.invalidateQueries(['vendor', data.vendor, 'menu']);
        toast.success('Menu item updated successfully!');
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to update menu item');
      },
    }
  );
};

export const useDeleteMenuItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (id: string) => api.deleteMenuItem(id),
    {
      onSuccess: (_, id) => {
        queryClient.invalidateQueries('menu-items');
        queryClient.removeQueries(['menu-item', id]);
        toast.success('Menu item deleted successfully!');
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to delete menu item');
      },
    }
  );
};

// Menu Categories hooks
export const useCategories = (params?: { vendor?: string }) => {
  return useQuery(
    ['categories', params],
    () => api.getCategories(params),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (categoryData: Omit<MenuCategory, 'id'>) => api.createCategory(categoryData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('categories');
        toast.success('Category created successfully!');
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to create category');
      },
    }
  );
};

// Orders hooks
export const useOrders = (params?: {
  status?: string;
  delivery_type?: string;
  ordering?: string;
}) => {
  return useQuery(
    ['orders', params],
    () => api.getOrders(params),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000,
    }
  );
};

export const useOrder = (id: string) => {
  return useQuery(
    ['order', id],
    () => api.getOrder(id),
    {
      enabled: !!id,
      staleTime: 1 * 60 * 1000, // 1 minute
    }
  );
};

export const useMyOrders = () => {
  return useQuery(
    ['orders', 'my'],
    () => api.getMyOrders(),
    {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  );
};

export const useVendorOrders = () => {
  return useQuery(
    ['orders', 'vendor'],
    () => api.getVendorOrders(),
    {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  );
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (orderData: {
      vendor_id: string;
      delivery_type: 'delivery' | 'pickup';
      delivery_address?: string;
      delivery_instructions?: string;
      items: Array<{
        menu_item_id: string;
        quantity: number;
        special_instructions?: string;
      }>;
    }) => api.createOrder(orderData),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('orders');
        queryClient.invalidateQueries(['orders', 'my']);
        queryClient.invalidateQueries(['orders', 'vendor']);
        toast.success('Order created successfully!');
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to create order');
      },
    }
  );
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ id, data }: { id: string; data: Partial<Order> }) =>
      api.updateOrder(id, data),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(['order', variables.id]);
        queryClient.invalidateQueries('orders');
        queryClient.invalidateQueries(['orders', 'my']);
        queryClient.invalidateQueries(['orders', 'vendor']);
        toast.success('Order updated successfully!');
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to update order');
      },
    }
  );
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ id, status }: { id: string; status: string }) =>
      api.updateOrderStatus(id, status),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(['order', variables.id]);
        queryClient.invalidateQueries('orders');
        queryClient.invalidateQueries(['orders', 'my']);
        queryClient.invalidateQueries(['orders', 'vendor']);
        toast.success(`Order status updated to ${variables.status}`);
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to update order status');
      },
    }
  );
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    (id: string) => api.deleteOrder(id),
    {
      onSuccess: (_, id) => {
        queryClient.invalidateQueries('orders');
        queryClient.invalidateQueries(['orders', 'my']);
        queryClient.invalidateQueries(['orders', 'vendor']);
        queryClient.removeQueries(['order', id]);
        toast.success('Order deleted successfully!');
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to delete order');
      },
    }
  );
};

export const useOrderStats = () => {
  return useQuery(
    ['orders', 'stats'],
    () => api.getOrderStats(),
    {
      staleTime: 2 * 60 * 1000,
    }
  );
};

export const useSearchOrders = (params: {
  status?: string;
  delivery_type?: string;
  start_date?: string;
  end_date?: string;
  order_number?: string;
}) => {
  return useQuery(
    ['orders', 'search', params],
    () => api.searchOrders(params),
    {
      enabled: Object.values(params).some(value => value !== undefined),
      staleTime: 1 * 60 * 1000,
    }
  );
};

// Reviews hooks
export const useVendorReviews = (vendorId: string) => {
  return useQuery(
    ['vendor', vendorId, 'reviews'],
    () => api.getVendorReviews(vendorId),
    {
      enabled: !!vendorId,
      staleTime: 5 * 60 * 1000,
    }
  );
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ vendorId, reviewData }: { vendorId: string; reviewData: { rating: number; comment: string } }) =>
      api.createReview(vendorId, reviewData),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(['vendor', variables.vendorId, 'reviews']);
        queryClient.invalidateQueries(['vendor', variables.vendorId]);
        toast.success('Review submitted successfully!');
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to submit review');
      },
    }
  );
};

// User hooks
export const useCurrentUser = () => {
  return useQuery(
    ['user', 'current'],
    () => api.getCurrentUser(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: false,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  );
};

export const useIsAuthenticated = () => {
  return useQuery(
    ['auth', 'status'],
    () => api.isAuthenticated(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: false,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  );
};

// Health check hook
export const useHealthCheck = () => {
  return useQuery(
    ['health'],
    () => api.healthCheck(),
    {
      staleTime: 30 * 1000, // 30 seconds
      retry: 3,
      retryDelay: 1000,
    }
  );
};
