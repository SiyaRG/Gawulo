import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Rating,
  Badge,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  ShoppingCart as CartIcon,
  Restaurant as RestaurantIcon,
  Star as StarIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Visibility as ViewIcon,
  RateReview as ReviewIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  LocationOn as LocationIcon,
  AddLocation as AddLocationIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import {
  useVendors, useVendor, useVendorMenu, useCreateOrder, useMyOrders, useMyReviews,
  useCreateOrderReview, useUpdateReview, useDeleteReview,
  useFavoriteVendors, useAddFavoriteVendor, useRemoveFavoriteVendor,
  useFavoriteProducts, useAddFavoriteProduct, useRemoveFavoriteProduct,
  useCustomerAddresses, useCreateCustomerAddress, useUpdateCustomerAddress, useDeleteCustomerAddress, useSetDefaultAddress,
  useMenuItems, useCancelOrder, useVendorReviews
} from '../hooks/useApi';
import { useOrderUpdates } from '../hooks/useWebSocket';
import { Vendor, ProductService, Order, CustomerAddress, FavoriteVendor, FavoriteProductService, ProductImage, Review, VendorImage } from '../types/index';
import LoadingLogo from '../components/LoadingLogo';
import OrderTimeline from '../components/OrderTimeline';
import ImageGallery from '../components/ImageGallery';
import AddressForm from '../components/AddressForm';
import AlertMessage from '../components/AlertMessage';
import ImageCarousel from '../components/ImageCarousel';
import ReviewsList from '../components/reviews/ReviewsList';
import ReviewStatistics from '../components/reviews/ReviewStatistics';
import OrderDetails from '../components/OrderDetails';
import OrderReviewDialog from '../components/reviews/OrderReviewDialog';
import CustomerReviewCard from '../components/reviews/CustomerReviewCard';
import { canCustomerCancel, getStatusColor } from '../utils/orderStatus';

interface CustomerDashboardProps {
  appState: any;
}

interface CartItem {
  menuItem: ProductService;
  quantity: number;
  specialInstructions?: string;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ appState }) => {
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [vendorDialog, setVendorDialog] = useState(false);
  const [orderDialog, setOrderDialog] = useState(false);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewDialogMode, setReviewDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedReviewForEdit, setSelectedReviewForEdit] = useState<Review | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedItemImages, setSelectedItemImages] = useState<Array<{ id: number; image: string; is_preview?: boolean; display_order?: number }>>([]);
  const [selectedItemName, setSelectedItemName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [addressDialog, setAddressDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [orderDetailsDialog, setOrderDetailsDialog] = useState(false);
  const [orderFilters, setOrderFilters] = useState<{
    status?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
  }>({});
  const [alertMessage, setAlertMessage] = useState<{ message: string; severity: 'success' | 'error' | 'info' | 'warning'; open: boolean }>({
    message: '',
    severity: 'info',
    open: false,
  });

  // API hooks
  const { data: vendors, isLoading: vendorsLoading } = useVendors({ search: searchQuery });
  const { data: vendorMenu } = useVendorMenu(selectedVendor ? String(selectedVendor.id) : '');
  const { data: vendorReviews = [], isLoading: vendorReviewsLoading } = useVendorReviews(selectedVendor ? String(selectedVendor.id) : '');
  // Fetch full vendor details with images when vendor is selected
  const { data: fullVendorDetails } = useVendor(selectedVendor ? String(selectedVendor.id) : '');
  
  // Get vendor info for cart items
  const cartVendorId = cart.length > 0 ? cart[0].menuItem.vendor : null;
  const { data: cartVendor } = useVendor(cartVendorId ? String(cartVendorId) : '');
  
  // Use full vendor details if available, otherwise fall back to selectedVendor
  const displayVendor = fullVendorDetails || selectedVendor;
  const { data: myOrders, isLoading: ordersLoading, error: ordersError } = useMyOrders(orderFilters);
  
  // WebSocket for real-time order updates
  const { isConnected: wsConnected } = useOrderUpdates({
    userType: 'customer',
    enabled: true,
  });
  
  // Debug logging
  React.useEffect(() => {
    console.log('Orders data:', { myOrders, ordersLoading, ordersError, orderFilters });
  }, [myOrders, ordersLoading, ordersError, orderFilters]);
  const { data: favoriteVendors } = useFavoriteVendors();
  const { data: favoriteProducts } = useFavoriteProducts();
  const { data: allProducts, isLoading: productsLoading } = useMenuItems({ search: searchQuery });
  const { data: addresses, isLoading: addressesLoading, error: addressesError } = useCustomerAddresses();
  const createOrder = useCreateOrder();
  const { data: myReviews = [], isLoading: reviewsLoading, error: reviewsError, refetch: refetchReviews } = useMyReviews();
  const createOrderReview = useCreateOrderReview();
  const updateReview = useUpdateReview();
  const deleteReview = useDeleteReview();
  const addFavorite = useAddFavoriteVendor();
  const removeFavorite = useRemoveFavoriteVendor();
  const addFavoriteProduct = useAddFavoriteProduct();
  const removeFavoriteProduct = useRemoveFavoriteProduct();
  const createAddress = useCreateCustomerAddress();
  const updateAddress = useUpdateCustomerAddress();
  const deleteAddress = useDeleteCustomerAddress();
  const setDefaultAddress = useSetDefaultAddress();
  const cancelOrder = useCancelOrder();

  // Get favorite vendor IDs - ensure favoriteVendors is an array
  const favoriteVendorsArray = Array.isArray(favoriteVendors) ? favoriteVendors : [];
  const favoriteVendorIds = new Set(favoriteVendorsArray.map((fv: FavoriteVendor) => fv.vendor.id));

  // Get favorite product IDs - ensure favoriteProducts is an array
  const favoriteProductsArray = Array.isArray(favoriteProducts) ? favoriteProducts : [];
  const favoriteProductIds = new Set(favoriteProductsArray.map((fp: FavoriteProductService) => fp.product_service.id));

  // Get all products array
  const allProductsArray = Array.isArray(allProducts?.results) ? (allProducts?.results || []) : [];

  // Ensure myOrders is always an array
  const myOrdersArray = Array.isArray(myOrders) ? myOrders : [];

  // Ensure addresses is always an array
  const addressesArray = Array.isArray(addresses) ? addresses : [];
  
  // Debug address fetching
  useEffect(() => {
    if (addressesError) {
      console.error('Error fetching addresses:', addressesError);
    }
    if (addressesLoading) {
      console.log('Loading addresses...');
    }
    if (addresses) {
      console.log('Addresses loaded:', addressesArray.length, addresses);
    }
  }, [addresses, addressesLoading, addressesError, addressesArray.length]);
  
  // Ensure vendorMenu is always an array
  const vendorMenuArray = Array.isArray(vendorMenu) ? vendorMenu : [];

  const handleVendorClick = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setVendorDialog(true);
  };

  const [specialInstructionsDialog, setSpecialInstructionsDialog] = useState<{ open: boolean; menuItem: ProductService | null }>({
    open: false,
    menuItem: null,
  });
  const [tempSpecialInstructions, setTempSpecialInstructions] = useState('');

  const handleAddToCart = (menuItem: ProductService, specialInstructions?: string) => {
    // Check if cart has items from a different vendor
    if (cart.length > 0) {
      const firstItemVendorId = cart[0].menuItem.vendor;
      if (menuItem.vendor !== firstItemVendorId) {
        // Ask user if they want to clear cart and add from new vendor
        const confirmMessage = `Your cart contains items from a different vendor. Would you like to clear your cart and add items from this vendor instead?`;
        if (window.confirm(confirmMessage)) {
          setCart([{ menuItem, quantity: 1, specialInstructions }]);
          // Set the selected vendor based on the new item
          // We'll need to fetch the vendor or use the vendor_id
        } else {
          setAlertMessage({ 
            message: 'Cannot add items from different vendors to the same cart. Please complete your current order or clear the cart first.', 
            severity: 'warning', 
            open: true 
          });
          return;
        }
        setSpecialInstructionsDialog({ open: false, menuItem: null });
        setTempSpecialInstructions('');
        return;
      }
    }

    const existingItem = cart.find(item => item.menuItem.id === menuItem.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.menuItem.id === menuItem.id
          ? { ...item, quantity: item.quantity + 1, specialInstructions: specialInstructions || item.specialInstructions }
          : item
      ));
    } else {
      setCart([...cart, { menuItem, quantity: 1, specialInstructions }]);
    }
    setSpecialInstructionsDialog({ open: false, menuItem: null });
    setTempSpecialInstructions('');
  };

  const handleAddToCartWithInstructions = (menuItem: ProductService) => {
    setSpecialInstructionsDialog({ open: true, menuItem });
    setTempSpecialInstructions('');
  };

  const handleRemoveFromCart = (menuItemId: number) => {
    setCart(cart.filter(item => item.menuItem.id !== menuItemId));
  };

  const handleUpdateQuantity = (menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(menuItemId);
    } else {
      setCart(cart.map(item =>
        item.menuItem.id === menuItemId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [isManualSelection, setIsManualSelection] = useState(false);

  // Auto-adjust delivery type if current selection is not available for cart items
  // Only run if user hasn't manually selected a type
  React.useEffect(() => {
    if (isManualSelection) {
      // Don't auto-adjust if user has manually selected
      return;
    }
    
    if (cart.length === 0) {
      // Reset to delivery when cart is empty
      setDeliveryType('delivery');
      return;
    }
    
    const canDelivery = cart.every(item => {
      const itemAvailableFor = item.menuItem.available_for || 'both';
      return itemAvailableFor === 'delivery' || itemAvailableFor === 'both';
    });
    const canPickup = cart.every(item => {
      const itemAvailableFor = item.menuItem.available_for || 'both';
      return itemAvailableFor === 'pickup' || itemAvailableFor === 'both';
    });
    
    // If current selection is not available, switch to an available option
    // Use functional update to avoid dependency on deliveryType
    setDeliveryType(prevType => {
      if (prevType === 'delivery' && !canDelivery && canPickup) {
        return 'pickup';
      } else if (prevType === 'pickup' && !canPickup && canDelivery) {
        return 'delivery';
      }
      return prevType;
    });
  }, [cart, isManualSelection]);

  const handlePlaceOrder = () => {
    console.log('handlePlaceOrder called', { selectedVendor, cartLength: cart.length, addressesArrayLength: addressesArray.length, cart });
    
    if (cart.length === 0) {
      console.log('Cannot place order: empty cart');
      setAlertMessage({ 
        message: 'Cart is empty', 
        severity: 'warning', 
        open: true 
      });
      return;
    }

    // Get vendor_id from the first cart item
    const vendorId = cart[0]?.menuItem?.vendor;
    if (!vendorId) {
      console.log('Cannot place order: no vendor ID in cart items');
      setAlertMessage({ 
        message: 'Unable to determine vendor from cart items', 
        severity: 'error', 
        open: true 
      });
      return;
    }

    // Validate all items are from the same vendor
    const allSameVendor = cart.every(item => item.menuItem.vendor === vendorId);
    if (!allSameVendor) {
      console.log('Cannot place order: items from different vendors');
      setAlertMessage({ 
        message: 'All items in your cart must be from the same vendor. Please remove items from other vendors.', 
        severity: 'error', 
        open: true 
      });
      return;
    }

    // Validate that all cart items are available for the selected delivery type
    const unavailableItems = cart.filter(item => {
      const itemAvailableFor = item.menuItem.available_for || 'both';
      if (deliveryType === 'delivery') {
        return itemAvailableFor !== 'delivery' && itemAvailableFor !== 'both';
      } else { // pickup
        return itemAvailableFor !== 'pickup' && itemAvailableFor !== 'both';
      }
    });

    if (unavailableItems.length > 0) {
      const itemNames = unavailableItems.map(item => item.menuItem.name).join(', ');
      setAlertMessage({
        message: `The following items are not available for ${deliveryType}: ${itemNames}. Please remove them from your cart or change the delivery type.`,
        severity: 'error',
        open: true,
      });
      return;
    }

    // Use selectedVendor if available, otherwise use vendor_id from cart
    const vendorIdToUse = selectedVendor?.id || vendorId;

    // Address is only required for delivery
    let deliveryAddress: CustomerAddress | null = null;
    if (deliveryType === 'delivery') {
      const defaultAddress = addressesArray.find((addr: CustomerAddress) => addr.is_default) || addressesArray[0];
      deliveryAddress = selectedAddress || defaultAddress;

      console.log('Address check:', { selectedAddress, defaultAddress, deliveryAddress });

      if (!deliveryAddress) {
        console.log('No delivery address found');
        setAlertMessage({ message: 'Please add a delivery address first', severity: 'warning', open: true });
        setAddressDialog(true);
        return;
      }
    }

    const orderData = {
      vendor_id: String(vendorIdToUse),
      delivery_type: deliveryType,
      delivery_address: deliveryType === 'delivery' && deliveryAddress
        ? `${deliveryAddress.line1}${deliveryAddress.line2 ? ', ' + deliveryAddress.line2 : ''}, ${deliveryAddress.city}, ${deliveryAddress.postal_code}`
        : undefined,
      delivery_instructions: deliveryInstructions,
      items: cart.map(item => ({
        menu_item_id: String(item.menuItem.id),
        quantity: item.quantity,
        special_instructions: item.specialInstructions,
      })),
    };

    console.log('Placing order with data:', orderData);
    createOrder.mutate(orderData, {
      onSuccess: () => {
        console.log('Order placed successfully');
        setCart([]);
        setVendorDialog(false);
        setDeliveryInstructions('');
        setActiveTab(3); // Switch to My Orders tab
        setAlertMessage({ message: 'Order placed successfully!', severity: 'success', open: true });
      },
      onError: (error: any) => {
        console.error('Order creation error:', error);
        const errorMessage = error?.message || error?.response?.data?.error || 'Failed to place order';
        setAlertMessage({ message: errorMessage, severity: 'error', open: true });
      },
    });
  };

  const handleCreateAddress = (addressData: Omit<CustomerAddress, 'id' | 'user' | 'created_at'>) => {
    createAddress.mutate(addressData, {
      onSuccess: () => {
        setAlertMessage({ message: 'Address added successfully', severity: 'success', open: true });
        setAddressDialog(false);
        setEditingAddress(null);
      },
      onError: () => {
        setAlertMessage({ message: 'Failed to add address', severity: 'error', open: true });
      },
    });
  };

  const handleUpdateAddress = (addressData: Omit<CustomerAddress, 'id' | 'user' | 'created_at'>) => {
    if (!editingAddress) return;
    updateAddress.mutate(
      { addressId: String(editingAddress.id), addressData },
      {
        onSuccess: () => {
          setAlertMessage({ message: 'Address updated successfully', severity: 'success', open: true });
          setAddressDialog(false);
          setEditingAddress(null);
        },
        onError: () => {
          setAlertMessage({ message: 'Failed to update address', severity: 'error', open: true });
        },
      }
    );
  };

  const handleDeleteAddress = (addressId: string) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      deleteAddress.mutate(addressId, {
        onSuccess: () => {
          setAlertMessage({ message: 'Address deleted successfully', severity: 'success', open: true });
        },
        onError: () => {
          setAlertMessage({ message: 'Failed to delete address', severity: 'error', open: true });
        },
      });
    }
  };

  const handleSetDefaultAddress = (addressId: string) => {
    setDefaultAddress.mutate(addressId, {
      onSuccess: () => {
        setAlertMessage({ message: 'Default address updated', severity: 'success', open: true });
      },
      onError: () => {
        setAlertMessage({ message: 'Failed to set default address', severity: 'error', open: true });
      },
    });
  };

  const handleSubmitReview = (reviewData: { rating: number; comment: string }) => {
    if (!selectedOrder) return;

    if (reviewDialogMode === 'edit' && selectedReviewForEdit) {
      // Update existing review
      updateReview.mutate({
        reviewId: String(selectedReviewForEdit.id),
        reviewData,
      }, {
        onSuccess: () => {
          setReviewDialog(false);
          setSelectedOrder(null);
          setSelectedReviewForEdit(null);
          setAlertMessage({ message: 'Review updated successfully!', severity: 'success', open: true });
          // Force refetch of reviews to update the UI
          refetchReviews();
        },
        onError: (error: any) => {
          setAlertMessage({ message: error.message || 'Failed to update review', severity: 'error', open: true });
        },
      });
    } else {
      // Create new review
      createOrderReview.mutate({
        orderId: String(selectedOrder.id),
        reviewData,
      }, {
        onSuccess: () => {
          setReviewDialog(false);
          setSelectedOrder(null);
          setAlertMessage({ message: 'Review submitted successfully!', severity: 'success', open: true });
          // Force refetch of reviews to update the UI
          refetchReviews();
        },
        onError: (error: any) => {
          setAlertMessage({ message: error.message || 'Failed to submit review', severity: 'error', open: true });
        },
      });
    }
  };

  const handleEditReview = (review: Review) => {
    // Find the order for this review
    const order = myOrders?.find((o: Order) => {
      if (review.order) {
        const orderId = typeof review.order === 'object' ? (review.order as any).id : review.order;
        return o.id === orderId;
      }
      return false;
    });
    
    if (order) {
      setSelectedOrder(order);
      setSelectedReviewForEdit(review);
      setReviewDialogMode('edit');
      setReviewDialog(true);
    }
  };

  const handleDeleteReview = (review: Review) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      deleteReview.mutate(String(review.id), {
        onSuccess: () => {
          setAlertMessage({ message: 'Review deleted successfully!', severity: 'success', open: true });
        },
        onError: (error: any) => {
          setAlertMessage({ message: error.message || 'Failed to delete review', severity: 'error', open: true });
        },
      });
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Confirmed': return 'info';
      case 'Processing': return 'primary';
      case 'Shipped': return 'success';
      case 'Delivered': return 'success';
      case 'Cancelled': return 'error';
      case 'Refunded': return 'error';
      default: return 'default';
    }
  };

  const calculateCartTotal = () => {
    return cart.reduce((total, item) => total + (item.menuItem.current_price * item.quantity), 0);
  };

  // Load cart from localStorage on mount
  React.useEffect(() => {
    const savedCart = localStorage.getItem('customer_cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // Validate cart items have required fields
        if (Array.isArray(parsedCart) && parsedCart.every(item => item.menuItem && item.quantity)) {
          setCart(parsedCart);
        }
      } catch (e) {
        console.error('Failed to load cart from localStorage:', e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  React.useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('customer_cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('customer_cart');
    }
  }, [cart]);

  if (vendorsLoading || ordersLoading) {
    return <LoadingLogo />;
  }

  // Calculate stats
  const totalOrders = myOrdersArray.length;
  const pendingOrders = myOrdersArray.filter((order: Order) => 
    ['Pending', 'Confirmed', 'Processing', 'Shipped'].includes(order.current_status)
  ).length;
  const favoriteVendorsCount = favoriteVendors?.length || 0;
  const user = appState?.user;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {user?.display_name || user?.first_name || user?.email ? 
            `Welcome, ${user.display_name || user.first_name || user.email.split('@')[0]}!` : 
            'Customer Dashboard'
          }
        </Typography>
        
        {/* Quick Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {totalOrders}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Orders
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {favoriteVendorsCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Favorite Vendors
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  {pendingOrders}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Orders
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search Bar */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search for vendors, food, or cuisine..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
      </Box>

      {/* Cart Badge */}
      <Box sx={{ 
        position: 'fixed', 
        top: { xs: 80, sm: 100 }, 
        right: { xs: 10, sm: 20 }, 
        zIndex: 1000 
      }}>
        <Badge badgeContent={cart.length} color="primary">
          <Button
            variant="contained"
            startIcon={<CartIcon />}
            onClick={() => setVendorDialog(true)}
            disabled={cart.length === 0}
            size="small"
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              px: { xs: 1, sm: 2 },
              py: { xs: 0.5, sm: 1 }
            }}
          >
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              Cart (R{calculateCartTotal().toFixed(2)})
            </Box>
            <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
              R{calculateCartTotal().toFixed(2)}
            </Box>
          </Button>
        </Badge>
      </Box>

      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Browse Vendors" />
        <Tab label="Browse Menu Items" />
        <Tab label="Favorites" />
        <Tab label="My Orders" />
        <Tab label="My Reviews" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          {Array.isArray(vendors?.results) && vendors?.results && vendors.results.length > 0 ? (
            vendors?.results.map((vendor) => {
              const isFavorite = favoriteVendorIds.has(vendor.id);
              return (
                <Grid item xs={12} sm={6} md={4} key={vendor.id}>
                  <Card sx={{ height: '100%', position: 'relative', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                    {vendor.preview_image || vendor.images?.[0]?.image ? (
                      <CardMedia
                        component="img"
                        height="140"
                        image={vendor.preview_image || vendor.images?.[0]?.image}
                        alt={vendor.name}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleVendorClick(vendor)}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 140,
                          bgcolor: 'grey.200',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleVendorClick(vendor)}
                      >
                        <RestaurantIcon sx={{ fontSize: 60, color: 'grey.400' }} />
                      </Box>
                    )}
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' },
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isFavorite) {
                          removeFavorite.mutate(String(vendor.id), {
                            onSuccess: () => {
                              setAlertMessage({ message: 'Removed from favorites', severity: 'success', open: true });
                            },
                            onError: () => {
                              setAlertMessage({ message: 'Failed to remove from favorites', severity: 'error', open: true });
                            },
                          });
                        } else {
                          addFavorite.mutate(String(vendor.id), {
                            onSuccess: () => {
                              setAlertMessage({ message: 'Added to favorites', severity: 'success', open: true });
                            },
                            onError: (error: unknown) => {
                              const errorMessage = error instanceof Error 
                                ? error.message 
                                : (typeof error === 'string' ? error : 'Failed to add to favorites');
                              setAlertMessage({ 
                                message: errorMessage, 
                                severity: 'error', 
                                open: true 
                              });
                            },
                          });
                        }
                      }}
                    >
                      {isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                    </IconButton>
                    <CardContent sx={{ cursor: 'pointer' }} onClick={() => handleVendorClick(vendor)}>
                      <Typography variant="h6" gutterBottom>
                        {vendor.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {vendor.profile_description || 'No description available'}
                      </Typography>
                      <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                        <Rating value={Number(vendor.average_rating) || 0} readOnly size="small" />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          ({(Number(vendor.average_rating) || 0).toFixed(1)})
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Chip
                          label={vendor.category}
                          size="small"
                          color="primary"
                        />
                        <Typography variant="body2">
                          Reviews: {vendor.review_count}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })
          ) : (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                    {vendorsLoading ? (
                      <CircularProgress />
                    ) : (
                      <Typography variant="body1" color="text.secondary">
                        No vendors found
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          {allProductsArray && allProductsArray.length > 0 ? (
            allProductsArray.map((item: ProductService) => {
              const isFavorite = favoriteProductIds.has(item.id);
              const imageUrl = item.preview_image || item.images?.[0]?.image;
              const hasMultipleImages = item.images && item.images.length > 1;

              const handleOpenImageDialog = () => {
                if (item.images && item.images.length > 0) {
                  setSelectedItemImages(item.images.map((img: ProductImage, index: number) => ({
                    id: img.id,
                    image: img.image,
                    is_preview: img.is_preview,
                    display_order: img.display_order ?? index
                  })));
                  setSelectedItemName(item.name);
                  setImageDialogOpen(true);
                }
              };

              return (
                <Grid item xs={12} sm={12} md={12} lg={6} key={item.id}>
                  <Card sx={{ 
                    minHeight: 200,
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': { 
                      transform: 'translateY(-8px)', 
                      boxShadow: 6 
                    },
                    borderRadius: 2,
                    overflow: 'visible',
                    position: 'relative'
                  }}>
                    {imageUrl ? (
                      <Box sx={{ 
                        position: 'relative', 
                        width: '100%',
                        minHeight: 250,
                        boxSizing: 'border-box'
                      }}>
                        <CardMedia
                          component="img"
                          sx={{ 
                            width: '100%',
                            height: 250,
                            objectFit: 'cover', 
                            cursor: hasMultipleImages ? 'pointer' : 'default',
                            transition: 'transform 0.3s',
                            '&:hover': hasMultipleImages ? {
                              transform: 'scale(1.05)'
                            } : {}
                          }}
                          image={imageUrl}
                          alt={item.name}
                          onClick={handleOpenImageDialog}
                        />
                        {hasMultipleImages && (
                          <Chip
                            label={`${item.images?.length} images`}
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              bgcolor: 'rgba(0, 0, 0, 0.7)',
                              color: 'white',
                              cursor: 'pointer',
                              fontWeight: 600,
                              '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.9)'
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenImageDialog();
                            }}
                          />
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ 
                        width: '100%',
                        minHeight: 250,
                        bgcolor: 'grey.200',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxSizing: 'border-box'
                      }}>
                        <RestaurantIcon sx={{ fontSize: 80, color: 'grey.400' }} />
                      </Box>
                    )}
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        zIndex: 10,
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' },
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isFavorite) {
                          removeFavoriteProduct.mutate(String(item.id), {
                            onSuccess: () => {
                              setAlertMessage({ message: 'Removed from favorites', severity: 'success', open: true });
                            },
                            onError: () => {
                              setAlertMessage({ message: 'Failed to remove from favorites', severity: 'error', open: true });
                            },
                          });
                        } else {
                          addFavoriteProduct.mutate(String(item.id), {
                            onSuccess: () => {
                              setAlertMessage({ message: 'Added to favorites', severity: 'success', open: true });
                            },
                            onError: (error: unknown) => {
                              const errorMessage = error instanceof Error 
                                ? error.message 
                                : (typeof error === 'string' ? error : 'Failed to add to favorites');
                              setAlertMessage({ 
                                message: errorMessage, 
                                severity: 'error', 
                                open: true 
                              });
                            },
                          });
                        }
                      }}
                    >
                      {isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                    </IconButton>
                    <CardContent sx={{ 
                      flex: 1,
                      display: 'flex', 
                      flexDirection: 'column',
                      p: { xs: 2, sm: 2.5 },
                      gap: 1.5,
                      minWidth: 0,
                      overflow: 'hidden',
                      boxSizing: 'border-box',
                      width: '100%',
                      maxWidth: '100%'
                    }}>
                      <Box sx={{ overflow: 'hidden', minWidth: 0 }}>
                        <Typography 
                          variant="h5"
                          gutterBottom 
                          sx={{ 
                            fontWeight: 700,
                            mb: 1.5,
                            fontSize: { xs: '1.25rem', sm: '1.5rem' }
                          }}
                        >
                          {item.name}
                        </Typography>
                        <Typography 
                          variant="body1"
                          color="text.secondary" 
                          sx={{ 
                            minHeight: 48,
                            lineHeight: 1.6,
                            fontSize: '0.95rem',
                            mb: 1
                          }}
                        >
                          {item.description || 'No description available'}
                        </Typography>
                        {item.vendor_name && (
                          <Typography 
                            variant="body2"
                            color="primary"
                            sx={{ 
                              mb: 1,
                              fontWeight: 500,
                              cursor: 'pointer',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                            onClick={() => {
                              const vendor = vendors?.results?.find((v: Vendor) => v.id === item.vendor);
                              if (vendor) {
                                handleVendorClick(vendor);
                              }
                            }}
                          >
                            {item.vendor_name}
                          </Typography>
                        )}
                        {item.estimated_preparation_time_minutes && (
                          <Typography 
                            variant="body2"
                            color="text.secondary"
                            sx={{ 
                              mb: 1,
                              fontStyle: 'italic',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}
                          >
                            <AccessTimeIcon sx={{ fontSize: 16 }} />
                            Prep time: ~{item.estimated_preparation_time_minutes} min
                          </Typography>
                        )}
                      </Box>
                      <Box 
                        sx={{ 
                          mt: 'auto',
                          pt: 2,
                          borderTop: '1px solid',
                          borderColor: 'divider',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography 
                            variant="h5"
                            color="primary" 
                            sx={{ 
                              fontWeight: 600,
                              fontSize: { xs: '1.25rem', sm: '1.5rem' },
                              fontStyle: 'italic'
                            }}
                          >
                            R{typeof item.current_price === 'number' ? item.current_price.toFixed(2) : parseFloat(item.current_price || '0').toFixed(2)}
                          </Typography>
                        </Box>
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          size="large"
                          onClick={() => handleAddToCart(item)}
                          startIcon={<AddIcon />}
                          sx={{
                            py: 1.5,
                            fontSize: '1rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: 2,
                            boxShadow: 2,
                            '&:hover': {
                              boxShadow: 4,
                              transform: 'translateY(-2px)'
                            }
                          }}
                        >
                          Add to Cart
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })
          ) : (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                    {productsLoading ? (
                      <CircularProgress />
                    ) : (
                      <Typography variant="body1" color="text.secondary">
                        No menu items found
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              Favorite Vendors
            </Typography>
          </Grid>
          {favoriteVendorsArray && favoriteVendorsArray.length > 0 ? (
            favoriteVendorsArray.map((fv: FavoriteVendor) => {
              const vendor = fv.vendor;
              return (
                <Grid item xs={12} sm={6} md={4} key={vendor.id}>
                  <Card sx={{ height: '100%', position: 'relative', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                    {vendor.preview_image || vendor.images?.[0]?.image ? (
                      <CardMedia
                        component="img"
                        height="140"
                        image={vendor.preview_image || vendor.images?.[0]?.image}
                        alt={vendor.name}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleVendorClick(vendor)}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 140,
                          bgcolor: 'grey.200',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleVendorClick(vendor)}
                      >
                        <RestaurantIcon sx={{ fontSize: 60, color: 'grey.400' }} />
                      </Box>
                    )}
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' },
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFavorite.mutate(String(vendor.id), {
                          onSuccess: () => {
                            setAlertMessage({ message: 'Removed from favorites', severity: 'success', open: true });
                          },
                          onError: () => {
                            setAlertMessage({ message: 'Failed to remove from favorites', severity: 'error', open: true });
                          },
                        });
                      }}
                    >
                      <FavoriteIcon color="error" />
                    </IconButton>
                    <CardContent sx={{ cursor: 'pointer' }} onClick={() => handleVendorClick(vendor)}>
                      <Typography variant="h6" gutterBottom>
                        {vendor.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {vendor.profile_description || 'No description available'}
                      </Typography>
                      <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                        <Rating value={Number(vendor.average_rating) || 0} readOnly size="small" />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          ({(Number(vendor.average_rating) || 0).toFixed(1)})
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Chip
                          label={vendor.category}
                          size="small"
                          color="primary"
                        />
                        <Typography variant="body2">
                          Reviews: {vendor.review_count}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })
          ) : (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                    <Typography variant="body1" color="text.secondary">
                      No favorite vendors yet. Add some from the Browse Vendors tab!
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
          <Grid item xs={12} sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              Favorite Menu Items
            </Typography>
          </Grid>
          {favoriteProductsArray && favoriteProductsArray.length > 0 ? (
            favoriteProductsArray.map((fp: FavoriteProductService) => {
              const item = fp.product_service;
              const imageUrl = item.preview_image || item.images?.[0]?.image;
              const hasMultipleImages = item.images && item.images.length > 1;

              const handleOpenImageDialog = () => {
                if (item.images && item.images.length > 0) {
                  setSelectedItemImages(item.images.map((img: ProductImage, index: number) => ({
                    id: img.id,
                    image: img.image,
                    is_preview: img.is_preview,
                    display_order: img.display_order ?? index
                  })));
                  setSelectedItemName(item.name);
                  setImageDialogOpen(true);
                }
              };

              return (
                <Grid item xs={12} sm={12} md={12} lg={6} key={item.id}>
                  <Card sx={{ 
                    minHeight: 200,
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': { 
                      transform: 'translateY(-8px)', 
                      boxShadow: 6 
                    },
                    borderRadius: 2,
                    overflow: 'visible',
                    position: 'relative'
                  }}>
                    {imageUrl ? (
                      <Box sx={{ 
                        position: 'relative', 
                        width: '100%',
                        minHeight: 250,
                        boxSizing: 'border-box'
                      }}>
                        <CardMedia
                          component="img"
                          sx={{ 
                            width: '100%',
                            height: 250,
                            objectFit: 'cover', 
                            cursor: hasMultipleImages ? 'pointer' : 'default',
                            transition: 'transform 0.3s',
                            '&:hover': hasMultipleImages ? {
                              transform: 'scale(1.05)'
                            } : {}
                          }}
                          image={imageUrl}
                          alt={item.name}
                          onClick={handleOpenImageDialog}
                        />
                        {hasMultipleImages && (
                          <Chip
                            label={`${item.images?.length} images`}
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              bgcolor: 'rgba(0, 0, 0, 0.7)',
                              color: 'white',
                              cursor: 'pointer',
                              fontWeight: 600,
                              '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.9)'
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenImageDialog();
                            }}
                          />
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ 
                        width: '100%',
                        minHeight: 250,
                        bgcolor: 'grey.200',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxSizing: 'border-box'
                      }}>
                        <RestaurantIcon sx={{ fontSize: 80, color: 'grey.400' }} />
                      </Box>
                    )}
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        zIndex: 10,
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' },
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFavoriteProduct.mutate(String(item.id), {
                          onSuccess: () => {
                            setAlertMessage({ message: 'Removed from favorites', severity: 'success', open: true });
                          },
                          onError: () => {
                            setAlertMessage({ message: 'Failed to remove from favorites', severity: 'error', open: true });
                          },
                        });
                      }}
                    >
                      <FavoriteIcon color="error" />
                    </IconButton>
                    <CardContent sx={{ 
                      flex: 1,
                      display: 'flex', 
                      flexDirection: 'column',
                      p: { xs: 2, sm: 2.5 },
                      gap: 1.5,
                      minWidth: 0,
                      overflow: 'hidden',
                      boxSizing: 'border-box',
                      width: '100%',
                      maxWidth: '100%'
                    }}>
                      <Box sx={{ overflow: 'hidden', minWidth: 0 }}>
                        <Typography 
                          variant="h5"
                          gutterBottom 
                          sx={{ 
                            fontWeight: 700,
                            mb: 1.5,
                            fontSize: { xs: '1.25rem', sm: '1.5rem' }
                          }}
                        >
                          {item.name}
                        </Typography>
                        <Typography 
                          variant="body1"
                          color="text.secondary" 
                          sx={{ 
                            minHeight: 48,
                            lineHeight: 1.6,
                            fontSize: '0.95rem',
                            mb: 1
                          }}
                        >
                          {item.description || 'No description available'}
                        </Typography>
                        {item.vendor_name && (
                          <Typography 
                            variant="body2"
                            color="primary"
                            sx={{ 
                              mb: 1,
                              fontWeight: 500,
                              cursor: 'pointer',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                            onClick={() => {
                              const vendor = vendors?.results?.find((v: Vendor) => v.id === item.vendor);
                              if (vendor) {
                                handleVendorClick(vendor);
                              }
                            }}
                          >
                            {item.vendor_name}
                          </Typography>
                        )}
                        {item.estimated_preparation_time_minutes && (
                          <Typography 
                            variant="body2"
                            color="text.secondary"
                            sx={{ 
                              mb: 1,
                              fontStyle: 'italic',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}
                          >
                            <AccessTimeIcon sx={{ fontSize: 16 }} />
                            Prep time: ~{item.estimated_preparation_time_minutes} min
                          </Typography>
                        )}
                      </Box>
                      <Box 
                        sx={{ 
                          mt: 'auto',
                          pt: 2,
                          borderTop: '1px solid',
                          borderColor: 'divider',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography 
                            variant="h5"
                            color="primary" 
                            sx={{ 
                              fontWeight: 600,
                              fontSize: { xs: '1.25rem', sm: '1.5rem' },
                              fontStyle: 'italic'
                            }}
                          >
                            R{typeof item.current_price === 'number' ? item.current_price.toFixed(2) : parseFloat(item.current_price || '0').toFixed(2)}
                          </Typography>
                        </Box>
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          size="large"
                          onClick={() => handleAddToCart(item)}
                          startIcon={<AddIcon />}
                          sx={{
                            py: 1.5,
                            fontSize: '1rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: 2,
                            boxShadow: 2,
                            '&:hover': {
                              boxShadow: 4,
                              transform: 'translateY(-2px)'
                            }
                          }}
                        >
                          Add to Cart
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })
          ) : (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                    <Typography variant="body1" color="text.secondary">
                      No favorite menu items yet. Add some from the Browse Menu Items tab!
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {activeTab === 3 && (
        <Box>
          {/* Connection Status */}
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Chip
              label={wsConnected ? 'Connected' : 'Disconnected'}
              color={wsConnected ? 'success' : 'default'}
              size="small"
            />
          </Box>
          {/* Order Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={orderFilters.status || ''}
                      label="Status"
                      onChange={(e) => setOrderFilters({ ...orderFilters, status: e.target.value || undefined })}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="Confirmed">Confirmed</MenuItem>
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="Processing">Processing</MenuItem>
                      <MenuItem value="Shipped">Shipped</MenuItem>
                      <MenuItem value="Delivered">Delivered</MenuItem>
                      <MenuItem value="Cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="From Date"
                    type="date"
                    value={orderFilters.date_from || ''}
                    onChange={(e) => setOrderFilters({ ...orderFilters, date_from: e.target.value || undefined })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="To Date"
                    type="date"
                    value={orderFilters.date_to || ''}
                    onChange={(e) => setOrderFilters({ ...orderFilters, date_to: e.target.value || undefined })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Search Order UID"
                    value={orderFilters.search || ''}
                    onChange={(e) => setOrderFilters({ ...orderFilters, search: e.target.value || undefined })}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Orders List */}
          <Grid container spacing={3}>
            {myOrdersArray.length > 0 ? (
              myOrdersArray.map((order: Order) => {
                const canCancel = canCustomerCancel(order.current_status as any);
                return (
                  <Grid item xs={12} key={order.id}>
                    <Card sx={{ transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                          <Box>
                            <Typography variant="h6" gutterBottom>
                              Order #{order.order_uid}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(order.created_at).toLocaleString()}
                            </Typography>
                          </Box>
                          <Chip
                            label={order.current_status}
                            color={getStatusColor(order.current_status as any)}
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Vendor
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {order.vendor.name}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Total Amount
                            </Typography>
                            <Typography variant="h6" color="primary" fontWeight={600}>
                              R{typeof order.total_amount === 'number' 
                                ? order.total_amount.toFixed(2) 
                                : parseFloat(order.total_amount || '0').toFixed(2)}
                            </Typography>
                          </Grid>
                          {order.line_items && order.line_items.length > 0 && (
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Items ({order.line_items.length})
                              </Typography>
                              <Typography variant="body2">
                                {order.line_items.slice(0, 2).map((item: any) => 
                                  item.product_service?.name || 'Unknown'
                                ).join(', ')}
                                {order.line_items.length > 2 && ` +${order.line_items.length - 2} more`}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                        <Box display="flex" gap={1} mt={2}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              setSelectedOrder(order);
                              setOrderDetailsDialog(true);
                            }}
                          >
                            View Details
                          </Button>
                          {canCancel && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => {
                                if (window.confirm('Are you sure you want to cancel this order?')) {
                                  cancelOrder.mutate(
                                    { orderId: String(order.id) },
                                    {
                                      onSuccess: () => {
                                        setAlertMessage({ message: 'Order cancelled successfully', severity: 'success', open: true });
                                      },
                                      onError: (error: unknown) => {
                                        const errorMessage = error instanceof Error ? error.message : 'Failed to cancel order';
                                        setAlertMessage({ message: errorMessage, severity: 'error', open: true });
                                      },
                                    }
                                  );
                                }
                              }}
                              disabled={cancelOrder.isLoading}
                            >
                              {cancelOrder.isLoading ? 'Cancelling...' : 'Cancel Order'}
                            </Button>
                          )}
                          {(order.current_status === 'Delivered' || order.current_status === 'PickedUp' || order.current_status === 'Refunded') && (() => {
                            // Check if order has a review
                            const orderReview = Array.isArray(myReviews) ? myReviews.find((r: Review) => {
                              const reviewOrderId = typeof r.order === 'object' ? (r.order as any)?.id : r.order;
                              return reviewOrderId === order.id;
                            }) : null;
                            
                            if (orderReview) {
                              return (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  startIcon={<ReviewIcon />}
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setSelectedReviewForEdit(orderReview);
                                    setReviewDialogMode('edit');
                                    setReviewDialog(true);
                                  }}
                                >
                                  Edit Review
                                </Button>
                              );
                            } else {
                              return (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<ReviewIcon />}
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setSelectedReviewForEdit(null);
                                    setReviewDialogMode('create');
                                    setReviewDialog(true);
                                  }}
                                >
                                  Leave Review
                                </Button>
                              );
                            }
                          })()}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })
            ) : (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                      {ordersLoading ? (
                        <CircularProgress />
                      ) : (
                        <Typography variant="body1" color="text.secondary">
                          No orders found
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>

          {/* Order Details Dialog */}
          {selectedOrder && (
            <OrderDetails
              order={selectedOrder}
              userType="customer"
              open={orderDetailsDialog}
              onClose={() => {
                setOrderDetailsDialog(false);
                setSelectedOrder(null);
              }}
              onCancel={(orderId) => {
                if (window.confirm('Are you sure you want to cancel this order?')) {
                  cancelOrder.mutate(
                    { orderId: String(orderId) },
                    {
                      onSuccess: () => {
                        setAlertMessage({ message: 'Order cancelled successfully', severity: 'success', open: true });
                        setOrderDetailsDialog(false);
                        setSelectedOrder(null);
                      },
                      onError: (error: unknown) => {
                        const errorMessage = error instanceof Error ? error.message : 'Failed to cancel order';
                        setAlertMessage({ message: errorMessage, severity: 'error', open: true });
                      },
                    }
                  );
                }
              }}
              isCancelling={cancelOrder.isLoading}
            />
          )}
        </Box>
      )}

      {/* Vendor Menu Dialog */}
      <Dialog open={vendorDialog} onClose={() => setVendorDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {displayVendor?.name}
          <Typography variant="body2" color="text.secondary">
            {displayVendor?.profile_description || 'No description available'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ maxHeight: '80vh', overflowY: 'auto' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Vendor Images Section */}
            {displayVendor && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  Gallery
                </Typography>
                {displayVendor.images && displayVendor.images.length > 0 ? (
                  <ImageCarousel
                    images={displayVendor.images.map((img: VendorImage) => ({
                      id: img.id,
                      image: img.image.startsWith('http') ? img.image : `${process.env.REACT_APP_API_URL || 'http://localhost:9033'}${img.image}`,
                      is_preview: img.is_preview,
                      display_order: img.display_order || 0,
                    }))}
                    onSetPreview={() => {}}
                    onDelete={() => {}}
                    editable={false}
                    readOnly={true}
                    showControls={true}
                    showPreview={true}
                    maxImages={5}
                  />
                ) : displayVendor.preview_image ? (
                  <Box
                    component="img"
                    src={displayVendor.preview_image.startsWith('http') ? displayVendor.preview_image : `${process.env.REACT_APP_API_URL || 'http://localhost:9033'}${displayVendor.preview_image}`}
                    alt={displayVendor.name}
                    sx={{
                      width: '100%',
                      maxHeight: 400,
                      objectFit: 'contain',
                      borderRadius: 2,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: 300,
                      bgcolor: 'grey.200',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 2,
                    }}
                  >
                    <RestaurantIcon sx={{ fontSize: 80, color: 'grey.400' }} />
                  </Box>
                )}
              </Box>
            )}

            {/* Vendor Reviews Section */}
            {displayVendor && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  Reviews
                </Typography>
                {vendorReviewsLoading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {Array.isArray(vendorReviews) && vendorReviews.length > 0 ? (
                      <>
                        <ReviewStatistics reviews={vendorReviews} />
                        <Box sx={{ mt: 3 }}>
                          <ReviewsList
                            reviews={vendorReviews}
                            isLoading={false}
                            onOrderClick={(orderId) => {
                              // Optional: Handle order click if needed
                            }}
                          />
                        </Box>
                      </>
                    ) : (
                      <Box
                        sx={{
                          p: 4,
                          textAlign: 'center',
                          bgcolor: 'background.paper',
                          borderRadius: 2,
                        }}
                      >
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No Reviews Yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          This vendor hasn't received any reviews yet.
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            )}

            {/* Menu Items Section */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Menu
              </Typography>
              <Grid container spacing={3}>
                {vendorMenuArray.length > 0 ? (
                  vendorMenuArray.map((item: ProductService) => {
                    // Get preview image or first image
                    const previewImage = item.preview_image || 
                      (item.images && item.images.length > 0 
                        ? (item.images.find((img: ProductImage) => img.is_preview) || item.images[0])?.image
                        : null) ||
                      item.image;
                    const imageUrl = previewImage 
                      ? (previewImage.startsWith('http') ? previewImage : `${process.env.REACT_APP_API_URL || 'http://localhost:9033'}${previewImage}`)
                      : null;
                    const hasMultipleImages = item.images && item.images.length > 1;
                    
                    const handleOpenImageDialog = () => {
                      if (item.images) {
                        setSelectedItemImages(item.images.map((img: ProductImage) => ({
                          id: img.id,
                          image: img.image.startsWith('http') ? img.image : `${process.env.REACT_APP_API_URL || 'http://localhost:9033'}${img.image}`,
                          is_preview: img.is_preview,
                          display_order: img.display_order || 0,
                        })));
                        setSelectedItemName(item.name);
                        setImageDialogOpen(true);
                      }
                    };
                    
                    return (
                    <Grid item xs={12} sm={12} md={12} lg={6} key={item.id}>
                      <Card sx={{ 
                        minHeight: 200,
                        display: 'flex', 
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': { 
                          transform: 'translateY(-8px)', 
                          boxShadow: 6 
                        },
                        borderRadius: 2,
                        overflow: 'visible'
                      }}>
                        {imageUrl ? (
                          <Box sx={{ 
                            position: 'relative', 
                            width: '100%',
                            flexShrink: 0
                          }}>
                            <CardMedia
                              component="img"
                              sx={{ 
                                width: '100%',
                                height: 250,
                                objectFit: 'cover', 
                                cursor: hasMultipleImages ? 'pointer' : 'default',
                                transition: 'transform 0.3s',
                                '&:hover': hasMultipleImages ? {
                                  transform: 'scale(1.05)'
                                } : {}
                              }}
                              image={imageUrl}
                              alt={item.name}
                              onClick={handleOpenImageDialog}
                            />
                            {hasMultipleImages && (
                              <Chip
                                label={`${item.images?.length} images`}
                                size="small"
                                sx={{
                                  position: 'absolute',
                                  top: 12,
                                  right: 12,
                                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                                  color: 'white',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  '&:hover': {
                                    bgcolor: 'rgba(0, 0, 0, 0.9)'
                                  }
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenImageDialog();
                                }}
                              />
                            )}
                          </Box>
                        ) : (
                          <Box sx={{ 
                            width: '100%',
                            height: 250,
                            bgcolor: 'grey.200',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <RestaurantIcon sx={{ fontSize: 80, color: 'grey.400' }} />
                          </Box>
                        )}
                        <CardContent sx={{ 
                          flex: 1,
                          display: 'flex', 
                          flexDirection: 'column',
                          p: 3,
                          gap: 2,
                          minWidth: 0
                        }}>
                          <Box>
                            <Typography 
                              variant="h5" 
                              gutterBottom 
                              sx={{ 
                                fontWeight: 700,
                                mb: 1.5,
                                fontSize: { xs: '1.25rem', sm: '1.5rem' }
                              }}
                            >
                              {item.name}
                            </Typography>
                            <Typography 
                              variant="body1" 
                              color="text.secondary" 
                              sx={{ 
                                lineHeight: 1.6,
                                fontSize: '0.95rem',
                                mb: 1
                              }}
                            >
                              {item.description || 'No description available'}
                            </Typography>
                            {item.estimated_preparation_time_minutes && (
                              <Typography 
                                variant="body2"
                                color="text.secondary"
                                sx={{ 
                                  mb: 1,
                                  fontStyle: 'italic',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5
                                }}
                              >
                                <AccessTimeIcon sx={{ fontSize: 16 }} />
                                Prep time: ~{item.estimated_preparation_time_minutes} min
                              </Typography>
                            )}
                          </Box>
                          <Box 
                            sx={{ 
                              mt: 'auto',
                              pt: 2,
                              borderTop: '1px solid',
                              borderColor: 'divider',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 2
                            }}
                          >
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography 
                                variant="h5" 
                                color="primary" 
                                sx={{ 
                                  fontWeight: 600,
                                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                                  fontStyle: 'italic'
                                }}
                              >
                                R{typeof item.current_price === 'number' ? item.current_price.toFixed(2) : parseFloat(item.current_price || '0').toFixed(2)}
                              </Typography>
                            </Box>
                            <Button
                              fullWidth
                              variant="contained"
                              color="primary"
                              size="large"
                              onClick={() => handleAddToCart(item)}
                              startIcon={<AddIcon />}
                              sx={{
                                py: 1.5,
                                fontSize: '1rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                borderRadius: 2,
                                boxShadow: 2,
                                '&:hover': {
                                  boxShadow: 4,
                                  transform: 'translateY(-2px)'
                                }
                              }}
                            >
                              Add to Cart
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                  })
                ) : (
                  <Grid item xs={12}>
                    <Typography variant="body1" color="text.secondary" align="center">
                      No menu items available
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>

            {/* Cart Section */}
            <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom>
                Cart
              </Typography>
              {cart.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Your cart is empty
                </Typography>
              ) : (
                <>
                  <List>
                    {cart.map((item) => (
                      <ListItem key={item.menuItem.id}>
                        <ListItemText
                          primary={item.menuItem.name}
                          secondary={`R${item.menuItem.current_price} x ${item.quantity}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateQuantity(item.menuItem.id, item.quantity - 1)}
                          >
                            <RemoveIcon />
                          </IconButton>
                          <Typography variant="body2" sx={{ mx: 1 }}>
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateQuantity(item.menuItem.id, item.quantity + 1)}
                          >
                            <AddIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Total: R{calculateCartTotal().toFixed(2)}
                  </Typography>
                  
                  {/* Delivery Type Selection */}
                  <Box sx={{ mb: 2 }}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel id="delivery-type-label">Delivery Type</InputLabel>
                      <Select
                        labelId="delivery-type-label"
                        id="delivery-type-select"
                        value={deliveryType || ''}
                        label="Delivery Type"
                        onChange={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const newValue = e.target.value as 'delivery' | 'pickup';
                          console.log('Delivery type onChange triggered:', newValue, 'Current value:', deliveryType);
                          setIsManualSelection(true);
                          setDeliveryType(newValue);
                          console.log('Delivery type set to:', newValue);
                        }}
                        onClose={(e) => {
                          console.log('Select onClose triggered');
                        }}
                        onOpen={(e) => {
                          console.log('Select onOpen triggered');
                        }}
                        MenuProps={{
                          disablePortal: false,
                          style: {
                            zIndex: 1300,
                          },
                          PaperProps: {
                            style: {
                              maxHeight: 300,
                              zIndex: 1300,
                            },
                          },
                          BackdropProps: {
                            style: {
                              zIndex: 1300,
                            },
                          },
                        }}
                      >
                        {(() => {
                          // Calculate which delivery types are available based on cart items
                          const canDelivery = cart.length === 0 || cart.every(item => {
                            const itemAvailableFor = item.menuItem.available_for || 'both';
                            return itemAvailableFor === 'delivery' || itemAvailableFor === 'both';
                          });
                          const canPickup = cart.length === 0 || cart.every(item => {
                            const itemAvailableFor = item.menuItem.available_for || 'both';
                            return itemAvailableFor === 'pickup' || itemAvailableFor === 'both';
                          });
                          
                          console.log('Delivery type availability:', { canDelivery, canPickup, cartLength: cart.length, currentDeliveryType: deliveryType });
                          
                          // Ensure at least one option is always available
                          const menuItems = [];
                          if (canDelivery) {
                            menuItems.push(
                              <MenuItem key="delivery" value="delivery">
                                Delivery
                              </MenuItem>
                            );
                          }
                          if (canPickup) {
                            menuItems.push(
                              <MenuItem key="pickup" value="pickup">
                                Pickup
                              </MenuItem>
                            );
                          }
                          
                          // If neither is available (shouldn't happen, but safety check)
                          if (menuItems.length === 0) {
                            menuItems.push(
                              <MenuItem key="delivery" value="delivery" disabled>
                                Delivery (Not available)
                              </MenuItem>
                            );
                            menuItems.push(
                              <MenuItem key="pickup" value="pickup" disabled>
                                Pickup (Not available)
                              </MenuItem>
                            );
                          }
                          
                          return menuItems;
                        })()}
                      </Select>
                    </FormControl>
                  </Box>
                    
                    {/* Address Selection - Only for delivery */}
                    {deliveryType === 'delivery' && (
                      <Box sx={{ mb: 2 }}>
                        <>
                          <Typography variant="subtitle2" gutterBottom>
                            Delivery Address
                          </Typography>
                          {addressesLoading ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              Loading addresses...
                            </Typography>
                          ) : null}
                          {addressesError ? (
                            <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                              Error loading addresses. Please try refreshing the page.
                            </Typography>
                          ) : null}
                          <FormControl fullWidth sx={{ mb: 1 }} disabled={addressesLoading}>
                            <Select
                              value={selectedAddress?.id?.toString() || ''}
                              onChange={(e) => {
                                const addr = addressesArray.find((a: CustomerAddress) => a.id.toString() === e.target.value);
                                setSelectedAddress(addr || null);
                              }}
                              displayEmpty
                            >
                              <MenuItem value="">
                                <em>Select or add address</em>
                              </MenuItem>
                              {addressesArray.map((addr: CustomerAddress) => (
                                <MenuItem key={addr.id} value={addr.id.toString()}>
                                  {addr.line1}, {addr.city} {addr.is_default && '(Default)'}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <Button
                            startIcon={<AddLocationIcon />}
                            onClick={() => {
                              setEditingAddress(null);
                              setAddressDialog(true);
                            }}
                            size="small"
                            sx={{ mb: 1 }}
                          >
                            Add New Address
                          </Button>
                          {addressesArray.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              {addressesArray.map((addr: CustomerAddress) => (
                                <Box key={addr.id} sx={{ p: 1, border: '1px solid #e0e0e0', borderRadius: 1, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Box>
                                    <Typography variant="body2">
                                      {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.postal_code}
                                    </Typography>
                                    {addr.is_default && <Chip label="Default" size="small" color="primary" sx={{ mt: 0.5 }} />}
                                  </Box>
                                  <Box>
                                    <IconButton size="small" onClick={() => { setEditingAddress(addr); setAddressDialog(true); }}>
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => handleDeleteAddress(String(addr.id))}>
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                    {!addr.is_default && (
                                      <Button size="small" onClick={() => handleSetDefaultAddress(String(addr.id))}>
                                        Set Default
                                      </Button>
                                    )}
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          )}
                          <TextField
                            fullWidth
                            label="Delivery Instructions (Optional)"
                            multiline
                            rows={2}
                            value={deliveryInstructions}
                            onChange={(e) => setDeliveryInstructions(e.target.value)}
                            sx={{ mt: 1, mb: 2 }}
                          />
                        </>
                      </Box>
                    )}
                    
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Button clicked');
                        handlePlaceOrder();
                      }}
                      disabled={cart.length === 0 || createOrder.isLoading}
                      sx={{ mt: 2 }}
                      type="button"
                    >
                      {createOrder.isLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        'Place Order'
                      )}
                    </Button>
                </>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVendorDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={orderDialog} onClose={() => setOrderDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Order Number</Typography>
                  <Typography variant="body1">{selectedOrder.order_uid}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Status</Typography>
                  <Chip
                    label={selectedOrder.current_status}
                    color={getOrderStatusColor(selectedOrder.current_status) as any}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Vendor</Typography>
                  <Typography variant="body1">{selectedOrder.vendor.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Total Amount</Typography>
                  <Typography variant="body1">R{selectedOrder.total_amount}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Order Timeline
                  </Typography>
                  <OrderTimeline
                    currentStatus={selectedOrder.current_status}
                    estimatedDeliveryTime={undefined}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Order Items
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Price</TableCell>
                          <TableCell>Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.line_items && selectedOrder.line_items.length > 0 ? (
                          selectedOrder.line_items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                  {item.product_service?.preview_image || item.product_service?.images?.[0]?.image ? (
                                    <img
                                      src={item.product_service.preview_image || item.product_service.images?.[0]?.image}
                                      alt={item.product_service?.name || 'Product'}
                                      style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                                    />
                                  ) : null}
                                  <Typography>{item.product_service?.name || 'Unknown'}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>R{item.unit_price_snapshot}</TableCell>
                              <TableCell>R{item.line_total}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} align="center">No items found</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                {(selectedOrder.current_status === 'Delivered' || selectedOrder.current_status === 'PickedUp' || selectedOrder.current_status === 'Refunded') && (
                  <Grid item xs={12}>
                    {(() => {
                      // Check if order has a review
                      const orderReview = Array.isArray(myReviews) ? myReviews.find((r: Review) => {
                        const reviewOrderId = typeof r.order === 'object' ? (r.order as any)?.id : r.order;
                        return reviewOrderId === selectedOrder.id;
                      }) : null;
                      
                      if (orderReview) {
                        return (
                          <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<ReviewIcon />}
                            onClick={() => {
                              setSelectedOrder(selectedOrder);
                              setSelectedReviewForEdit(orderReview);
                              setReviewDialogMode('edit');
                              setReviewDialog(true);
                              setOrderDialog(false);
                            }}
                          >
                            Edit Review
                          </Button>
                        );
                      } else {
                        return (
                          <Button
                            variant="outlined"
                            startIcon={<ReviewIcon />}
                            onClick={() => {
                              setSelectedOrder(selectedOrder);
                              setSelectedReviewForEdit(null);
                              setReviewDialogMode('create');
                              setReviewDialog(true);
                              setOrderDialog(false);
                            }}
                          >
                            Leave Review
                          </Button>
                        );
                      }
                    })()}
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Order Review Dialog */}
      <OrderReviewDialog
        open={reviewDialog}
        onClose={() => {
          setReviewDialog(false);
          setSelectedOrder(null);
          setSelectedReviewForEdit(null);
        }}
        order={selectedOrder}
        existingReview={selectedReviewForEdit}
        onSubmit={handleSubmitReview}
        isLoading={reviewDialogMode === 'edit' ? updateReview.isLoading : createOrderReview.isLoading}
        mode={reviewDialogMode}
      />

      {/* Address Form Dialog */}
      <AddressForm
        open={addressDialog}
        onClose={() => {
          setAddressDialog(false);
          setEditingAddress(null);
        }}
        onSubmit={editingAddress ? handleUpdateAddress : handleCreateAddress}
        initialData={editingAddress}
        title={editingAddress ? 'Edit Address' : 'Add Address'}
      />

      {/* Alert Message */}
      <AlertMessage
        message={alertMessage.message}
        severity={alertMessage.severity}
        open={alertMessage.open}
        onClose={() => setAlertMessage({ ...alertMessage, open: false })}
      />

      {/* Image Gallery Dialog for Product Images */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedItemName} - Images
          <IconButton
            aria-label="close"
            onClick={() => setImageDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedItemImages.length > 0 && (
            <ImageGallery
              images={selectedItemImages}
              showPreview={true}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* My Reviews Tab */}
      {activeTab === 4 && (
        <>
          {/* Debug info */}
         
          {reviewsError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load reviews: {(reviewsError as Error).message}
            </Alert>
          )}
          {reviewsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
              <CircularProgress />
            </Box>
          ) : Array.isArray(myReviews) && myReviews.length > 0 ? (
            <Grid container spacing={3}>
              {myReviews.map((review: Review) => (
                <Grid item xs={12} sm={6} md={4} key={review.id}>
                  <CustomerReviewCard
                    review={review}
                    onEdit={handleEditReview}
                    onDelete={handleDeleteReview}
                    onOrderClick={(orderId) => {
                      const order = myOrders?.find((o: Order) => o.id === orderId);
                      if (order) {
                        setSelectedOrder(order);
                        setOrderDetailsDialog(true);
                      }
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Card>
              <CardContent>
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <ReviewIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Reviews Yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    You haven't written any reviews yet. Leave a review for your completed orders!
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Container>
  );
};

export default CustomerDashboard;
