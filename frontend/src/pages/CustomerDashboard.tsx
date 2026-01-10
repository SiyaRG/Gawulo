import React, { useState } from 'react';
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
} from '@mui/icons-material';
import {
  useVendors, useVendor, useVendorMenu, useCreateOrder, useMyOrders, useCreateReview,
  useFavoriteVendors, useAddFavoriteVendor, useRemoveFavoriteVendor,
  useCustomerAddresses, useCreateCustomerAddress, useUpdateCustomerAddress, useDeleteCustomerAddress, useSetDefaultAddress
} from '../hooks/useApi';
import { Vendor, ProductService, Order, CustomerAddress, FavoriteVendor, ProductImage } from '../types/index';
import LoadingLogo from '../components/LoadingLogo';
import OrderTimeline from '../components/OrderTimeline';
import ImageGallery from '../components/ImageGallery';
import AddressForm from '../components/AddressForm';
import AlertMessage from '../components/AlertMessage';

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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedItemImages, setSelectedItemImages] = useState<Array<{ id: number; image: string; is_preview?: boolean; display_order?: number }>>([]);
  const [selectedItemName, setSelectedItemName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
  });
  const [addressDialog, setAddressDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ message: string; severity: 'success' | 'error' | 'info' | 'warning'; open: boolean }>({
    message: '',
    severity: 'info',
    open: false,
  });

  // API hooks
  const { data: vendors, isLoading: vendorsLoading } = useVendors({ search: searchQuery });
  const { data: vendorMenu } = useVendorMenu(selectedVendor ? String(selectedVendor.id) : '');
  const { data: myOrders, isLoading: ordersLoading } = useMyOrders();
  const { data: favoriteVendors } = useFavoriteVendors();
  const { data: addresses } = useCustomerAddresses();
  const createOrder = useCreateOrder();
  const createReview = useCreateReview();
  const addFavorite = useAddFavoriteVendor();
  const removeFavorite = useRemoveFavoriteVendor();
  const createAddress = useCreateCustomerAddress();
  const updateAddress = useUpdateCustomerAddress();
  const deleteAddress = useDeleteCustomerAddress();
  const setDefaultAddress = useSetDefaultAddress();

  // Get favorite vendor IDs - ensure favoriteVendors is an array
  const favoriteVendorsArray = Array.isArray(favoriteVendors) ? favoriteVendors : [];
  const favoriteVendorIds = new Set(favoriteVendorsArray.map((fv: FavoriteVendor) => fv.vendor.id));

  // Ensure myOrders is always an array
  const myOrdersArray = Array.isArray(myOrders) ? myOrders : [];
  
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

  const handlePlaceOrder = () => {
    if (!selectedVendor || cart.length === 0) return;

    const defaultAddress = addresses?.find((addr: CustomerAddress) => addr.is_default) || addresses?.[0];
    const deliveryAddress = selectedAddress || defaultAddress;

    if (!deliveryAddress) {
      setAlertMessage({ message: 'Please add a delivery address first', severity: 'warning', open: true });
      setAddressDialog(true);
      return;
    }

    const orderData = {
      vendor_id: String(selectedVendor.id),
      delivery_type: 'delivery' as const,
      delivery_address: `${deliveryAddress.line1}${deliveryAddress.line2 ? ', ' + deliveryAddress.line2 : ''}, ${deliveryAddress.city}, ${deliveryAddress.postal_code}`,
      delivery_instructions: deliveryInstructions,
      items: cart.map(item => ({
        menu_item_id: String(item.menuItem.id),
        quantity: item.quantity,
        special_instructions: item.specialInstructions,
      })),
    };

    createOrder.mutate(orderData, {
      onSuccess: () => {
        setCart([]);
        setVendorDialog(false);
        setDeliveryInstructions('');
        setAlertMessage({ message: 'Order placed successfully!', severity: 'success', open: true });
      },
      onError: () => {
        setAlertMessage({ message: 'Failed to place order', severity: 'error', open: true });
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

  const handleSubmitReview = () => {
    if (!selectedVendor) return;

    createReview.mutate({
      vendorId: String(selectedVendor.id),
      reviewData: reviewForm,
    }, {
      onSuccess: () => {
        setReviewDialog(false);
        setReviewForm({ rating: 5, comment: '' });
      },
    });
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
        <Tab label="Favorites" />
        <Tab label="My Orders" />
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
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          {myOrdersArray.length > 0 ? (
            myOrdersArray.map((order: Order) => (
            <Grid item xs={12} key={order.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      Order #{order.order_uid.substring(0, 8)}...
                    </Typography>
                    <Chip
                      label={order.current_status}
                      color={getOrderStatusColor(order.current_status) as any}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    {order.vendor.name}
                  </Typography>
                  <Typography variant="body1" mb={2}>
                    Total: R{order.total_amount}
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedOrder(order);
                        setOrderDialog(true);
                      }}
                    >
                      View Details
                    </Button>
                    {order.current_status === 'Delivered' && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ReviewIcon />}
                        onClick={() => {
                          setSelectedVendor(order.vendor);
                          setReviewDialog(true);
                        }}
                      >
                        Leave Review
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
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
      )}

      {/* Vendor Menu Dialog */}
      <Dialog open={vendorDialog} onClose={() => setVendorDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedVendor?.name}
          <Typography variant="body2" color="text.secondary">
            {selectedVendor?.profile_description || 'No description available'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
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
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Cart
              </Typography>
              {cart.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Your cart is empty
                </Typography>
              ) : (
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
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Total: R{calculateCartTotal().toFixed(2)}
                  </Typography>
                  
                  {/* Address Selection */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Delivery Address
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 1 }}>
                      <Select
                        value={selectedAddress?.id?.toString() || ''}
                        onChange={(e) => {
                          const addr = addresses?.find((a: CustomerAddress) => a.id.toString() === e.target.value);
                          setSelectedAddress(addr || null);
                        }}
                        displayEmpty
                      >
                        <MenuItem value="">
                          <em>Select or add address</em>
                        </MenuItem>
                        {addresses?.map((addr: CustomerAddress) => (
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
                    {addresses && addresses.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        {addresses.map((addr: CustomerAddress) => (
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
                  </Box>
                  
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handlePlaceOrder}
                    disabled={cart.length === 0 || createOrder.isLoading}
                    sx={{ mt: 2 }}
                  >
                    {createOrder.isLoading ? (
                      <CircularProgress size={20} />
                    ) : (
                      'Place Order'
                    )}
                  </Button>
                </List>
              )}
            </Grid>
          </Grid>
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
                {selectedOrder.current_status === 'Delivered' && (
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      startIcon={<ReviewIcon />}
                      onClick={() => {
                        setSelectedVendor(selectedOrder.vendor);
                        setReviewDialog(true);
                        setOrderDialog(false);
                      }}
                    >
                      Leave Review
                    </Button>
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

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onClose={() => setReviewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Leave a Review</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedVendor?.name}
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Typography component="legend">Rating</Typography>
              <Rating
                value={reviewForm.rating}
                onChange={(_, value) => setReviewForm({ ...reviewForm, rating: value || 5 })}
                size="large"
              />
            </Box>
            <TextField
              fullWidth
              label="Comment"
              multiline
              rows={4}
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitReview}
            variant="contained"
            disabled={createReview.isLoading}
          >
            {createReview.isLoading ? (
              <CircularProgress size={20} />
            ) : (
              'Submit Review'
            )}
          </Button>
        </DialogActions>
      </Dialog>

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
    </Container>
  );
};

export default CustomerDashboard;
