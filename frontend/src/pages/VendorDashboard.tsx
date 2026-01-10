import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
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
  Alert,
  CircularProgress,
  Fab,
  Tooltip,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Restaurant as RestaurantIcon,
  ShoppingCart as OrdersIcon,
  Star as RatingIcon,
  TrendingUp as StatsIcon,
  Person as PersonIcon,
  BarChart as ChartIcon,
  CloudUpload as UploadIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { 
  useVendorOrders, 
  useMyVendorMenu, 
  useCreateMenuItem, 
  useUpdateMenuItem, 
  useDeleteMenuItem, 
  useUpdateOrderStatus,
  useCurrentVendor,
  useVendorStats,
  useVendorReviews,
  useUpdateVendorProfile,
  useUploadVendorProfileImage,
  useUploadProductServiceImage,
  useProductImages,
  useUploadProductImages,
  useUpdateProductImage,
  useDeleteProductImage,
  useVendorImages,
  useUploadVendorImages,
  useUpdateVendorImage,
  useDeleteVendorImage,
  useRefundRequests,
  useApproveRefundRequest,
  useDenyRefundRequest,
} from '../hooks/useApi';
import { useOrderUpdates } from '../hooks/useWebSocket';
import { ProductService, Order, ProductImage, VendorImage, RefundRequest } from '../types/index';
import LoadingLogo from '../components/LoadingLogo';
import AlertMessage from '../components/AlertMessage';
import ReviewStatistics from '../components/reviews/ReviewStatistics';
import ReviewsList from '../components/reviews/ReviewsList';
import ImageCarousel from '../components/ImageCarousel';
import OrderDetails from '../components/OrderDetails';
import RevenueTrendChart from '../components/analytics/RevenueTrendChart';
import ProductPerformanceChart from '../components/analytics/ProductPerformanceChart';
import StatusDistributionChart from '../components/analytics/StatusDistributionChart';
import CustomerInsightsCard from '../components/analytics/CustomerInsightsCard';
import OrderVolumeChart from '../components/analytics/OrderVolumeChart';
import { getStatusColor, getValidNextStatuses } from '../utils/orderStatus';

interface VendorDashboardProps {
  appState: any;
}

const VendorDashboard: React.FC<VendorDashboardProps> = ({ appState }) => {
  const [selectedProduct, setSelectedProduct] = useState<ProductService | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [productDialog, setProductDialog] = useState(false);
  const [orderDialog, setOrderDialog] = useState(false);
  const [profileDialog, setProfileDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    current_price: '',
    is_service: false,
    available_for: 'both' as 'delivery' | 'pickup' | 'both',
    estimated_preparation_time_minutes: '',
  });
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    category: '',
    profile_description: '',
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
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
  const { data: vendor, isLoading: vendorLoading } = useCurrentVendor();
  const { data: orders, isLoading: ordersLoading, error: ordersError } = useVendorOrders(orderFilters);
  const { data: refundRequests = [], isLoading: refundRequestsLoading } = useRefundRequests({ status: 'pending' });
  const { data: reviews = [], isLoading: reviewsLoading } = useVendorReviews(vendor ? String(vendor.id) : '');
  
  // WebSocket for real-time order updates
  const { isConnected: wsConnected } = useOrderUpdates({
    userType: 'vendor',
    enabled: true,
  });
  const approveRefundRequest = useApproveRefundRequest();
  const denyRefundRequest = useDenyRefundRequest();
  const [denyDialogOpen, setDenyDialogOpen] = useState(false);
  const [selectedRefundRequest, setSelectedRefundRequest] = useState<RefundRequest | null>(null);
  const [denialReason, setDenialReason] = useState('');
  
  // Debug logging
  React.useEffect(() => {
    console.log('Vendor Orders data:', { orders, ordersLoading, ordersError, orderFilters });
  }, [orders, ordersLoading, ordersError, orderFilters]);
  const { data: products, isLoading: productsLoading } = useMyVendorMenu();
  const { data: stats, isLoading: statsLoading } = useVendorStats();
  const createProduct = useCreateMenuItem();
  const updateProduct = useUpdateMenuItem();
  const deleteProduct = useDeleteMenuItem();
  const updateOrderStatus = useUpdateOrderStatus();
  const updateVendorProfile = useUpdateVendorProfile();
  const uploadVendorProfileImage = useUploadVendorProfileImage();
  const uploadProductImage = useUploadProductServiceImage();
  
  // Image management hooks
  const { data: productImages, isLoading: productImagesLoading } = useProductImages(selectedProduct ? String(selectedProduct.id) : '');
  const uploadProductImages = useUploadProductImages();
  const updateProductImage = useUpdateProductImage();
  const deleteProductImage = useDeleteProductImage();
  
  const { data: vendorImages, isLoading: vendorImagesLoading } = useVendorImages();
  const uploadVendorImages = useUploadVendorImages();
  const updateVendorImage = useUpdateVendorImage();
  const deleteVendorImage = useDeleteVendorImage();

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setProductForm({
      name: '',
      description: '',
      current_price: '',
      is_service: false,
      available_for: 'both',
      estimated_preparation_time_minutes: '',
    });
    setProductImage(null);
    setProductImagePreview(null);
    setProductDialog(true);
  };

  const handleEditProduct = (product: ProductService) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      current_price: String(product.current_price),
      is_service: product.is_service || false,
      available_for: product.available_for || 'both',
      estimated_preparation_time_minutes: product.estimated_preparation_time_minutes ? String(product.estimated_preparation_time_minutes) : '',
    });
    setProductImage(null);
    setProductImagePreview(null);
    setProductDialog(true);
  };

  const handleDeleteProduct = (id: number) => {
    if (window.confirm('Are you sure you want to delete this product/service?')) {
      deleteProduct.mutate(String(id));
    }
  };

  const handleSaveProduct = async () => {
    const price = parseFloat(productForm.current_price);
    if (isNaN(price) || price < 0) {
      return; // Invalid price, don't save
    }

    const productData: any = {
      name: productForm.name,
      description: productForm.description || undefined,
      current_price: price,
      is_service: productForm.is_service || null,
      available_for: productForm.available_for,
    };
    
    // Add estimated_preparation_time_minutes if provided
    if (productForm.estimated_preparation_time_minutes) {
      const prepTime = parseInt(productForm.estimated_preparation_time_minutes, 10);
      if (!isNaN(prepTime) && prepTime > 0) {
        productData.estimated_preparation_time_minutes = prepTime;
      }
    }

    try {
      let productId: string;
      if (selectedProduct) {
        await updateProduct.mutateAsync({ menuItemId: String(selectedProduct.id), menuItemData: productData });
        productId = String(selectedProduct.id);
      } else {
        const newProduct = await createProduct.mutateAsync(productData);
        productId = String(newProduct.id);
      }

      // Upload legacy single image if one was selected (for backward compatibility)
      if (productImage) {
        await uploadProductImage.mutateAsync({ productServiceId: productId, file: productImage });
      }

      setProductDialog(false);
      setProductImage(null);
      setProductImagePreview(null);
    } catch (error) {
      // Error handling is done via AlertMessage in the component
    }
  };

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadProductImages = async (files: File[]) => {
    if (!selectedProduct) return;
    try {
      await uploadProductImages.mutateAsync({ productServiceId: String(selectedProduct.id), files });
    } catch (error) {
      // Error handling is done via AlertMessage
    }
  };

  const handleSetProductPreview = async (imageId: number) => {
    try {
      await updateProductImage.mutateAsync({ imageId: String(imageId), imageData: { is_preview: true } });
    } catch (error) {
      // Error handling is done via AlertMessage
    }
  };

  const handleDeleteProductImage = async (imageId: number) => {
    if (!selectedProduct) return;
    try {
      await deleteProductImage.mutateAsync(String(imageId));
    } catch (error) {
      // Error handling is done via AlertMessage
    }
  };

  const handleReorderProductImage = async (imageId: number, direction: 'up' | 'down') => {
    if (!productImages || !Array.isArray(productImages)) return;
    const currentImage = productImages.find(img => img.id === imageId);
    if (!currentImage) return;
    
    const sortedImages = [...productImages].sort((a, b) => a.display_order - b.display_order);
    const currentIndex = sortedImages.findIndex(img => img.id === imageId);
    
    if (direction === 'up' && currentIndex > 0) {
      const newOrder = sortedImages[currentIndex - 1].display_order;
      const oldOrder = currentImage.display_order;
      // Swap orders
      await updateProductImage.mutateAsync({ imageId: String(imageId), imageData: { display_order: newOrder } });
      await updateProductImage.mutateAsync({ imageId: String(sortedImages[currentIndex - 1].id), imageData: { display_order: oldOrder } });
    } else if (direction === 'down' && currentIndex < sortedImages.length - 1) {
      const newOrder = sortedImages[currentIndex + 1].display_order;
      const oldOrder = currentImage.display_order;
      // Swap orders
      await updateProductImage.mutateAsync({ imageId: String(imageId), imageData: { display_order: newOrder } });
      await updateProductImage.mutateAsync({ imageId: String(sortedImages[currentIndex + 1].id), imageData: { display_order: oldOrder } });
    }
  };

  const handleUploadVendorImages = async (files: File[]) => {
    try {
      await uploadVendorImages.mutateAsync(files);
    } catch (error) {
      // Error handling is done via AlertMessage
    }
  };

  const handleSetVendorPreview = async (imageId: number) => {
    try {
      await updateVendorImage.mutateAsync({ imageId: String(imageId), imageData: { is_preview: true } });
    } catch (error) {
      // Error handling is done via AlertMessage
    }
  };

  const handleDeleteVendorImage = async (imageId: number) => {
    try {
      await deleteVendorImage.mutateAsync(String(imageId));
    } catch (error) {
      // Error handling is done via AlertMessage
    }
  };

  const handleReorderVendorImage = async (imageId: number, direction: 'up' | 'down') => {
    if (!vendorImages || !Array.isArray(vendorImages)) return;
    const currentImage = vendorImages.find(img => img.id === imageId);
    if (!currentImage) return;
    
    const sortedImages = [...vendorImages].sort((a, b) => a.display_order - b.display_order);
    const currentIndex = sortedImages.findIndex(img => img.id === imageId);
    
    if (direction === 'up' && currentIndex > 0) {
      const newOrder = sortedImages[currentIndex - 1].display_order;
      const oldOrder = currentImage.display_order;
      // Swap orders
      await updateVendorImage.mutateAsync({ imageId: String(imageId), imageData: { display_order: newOrder } });
      await updateVendorImage.mutateAsync({ imageId: String(sortedImages[currentIndex - 1].id), imageData: { display_order: oldOrder } });
    } else if (direction === 'down' && currentIndex < sortedImages.length - 1) {
      const newOrder = sortedImages[currentIndex + 1].display_order;
      const oldOrder = currentImage.display_order;
      // Swap orders
      await updateVendorImage.mutateAsync({ imageId: String(imageId), imageData: { display_order: newOrder } });
      await updateVendorImage.mutateAsync({ imageId: String(sortedImages[currentIndex + 1].id), imageData: { display_order: oldOrder } });
    }
  };

  const handleUpdateOrderStatus = (orderId: number, status: string) => {
    updateOrderStatus.mutate({ orderId: String(orderId), status });
  };

  const handleEditProfile = () => {
    if (vendor) {
      setProfileForm({
        name: vendor.name,
        category: vendor.category,
        profile_description: vendor.profile_description || '',
      });
      // Set image preview if vendor has a profile image
      if (vendor.profile_image) {
        const imageUrl = vendor.profile_image.startsWith('http') ? vendor.profile_image : `${process.env.REACT_APP_API_URL || 'http://localhost:9033'}${vendor.profile_image}`;
        setProfileImagePreview(imageUrl);
      } else {
        setProfileImagePreview(null);
      }
      setProfileImage(null);
      setProfileDialog(true);
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateVendorProfile.mutateAsync(profileForm);

      // Upload image if one was selected
      if (profileImage) {
        await uploadVendorProfileImage.mutateAsync(profileImage);
      }

      setProfileDialog(false);
      setProfileImage(null);
      setProfileImagePreview(null);
    } catch (error) {
      // Error handling is done via AlertMessage in the component
    }
  };


  const formatCurrency = (amount: number | string) => {
    // Format as South African Rand (ZAR)
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return 'R0.00';
    return `R${numAmount.toFixed(2)}`;
  };

  if (vendorLoading || ordersLoading || productsLoading || statsLoading) {
    return <LoadingLogo />;
  }

  if (!vendor) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">You need to be a vendor to access this dashboard.</Alert>
      </Container>
    );
  }

  return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            {(() => {
              const previewImage = vendor.preview_image || 
                (vendor.images && vendor.images.length > 0 
                  ? (vendor.images.find(img => img.is_preview) || vendor.images[0]).image
                  : null) ||
                vendor.profile_image;
              const imageUrl = previewImage 
                ? (previewImage.startsWith('http') ? previewImage : `${process.env.REACT_APP_API_URL || 'http://localhost:9033'}${previewImage}`)
                : null;
              return imageUrl ? (
                <Box
                  component="img"
                  src={imageUrl}
                  alt={vendor.name}
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid',
                    borderColor: 'primary.main',
                  }}
                />
              ) : null;
            })()}
            <Typography variant="h4">
              Vendor Dashboard
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<PersonIcon />}
            onClick={handleEditProfile}
          >
            Edit Profile
          </Button>
        </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <RestaurantIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats?.products_count || products?.length || 0}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Products/Services
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <OrdersIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats?.total_orders || orders?.length || 0}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Orders
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <RatingIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">
                    {(stats?.average_rating ? Number(stats.average_rating) : Number(vendor.average_rating) || 0).toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Average Rating
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <StatsIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{stats ? formatCurrency(stats.today_revenue) : 'R0.00'}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Today's Revenue
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Products/Services" />
          <Tab label="Orders" />
          <Tab label="Analytics" />
          <Tab label="Reviews" />
        </Tabs>
      </Box>

      {/* Products/Services Tab */}
      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Products/Services</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateProduct}
              >
                Add Product/Service
              </Button>
            </Box>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Image</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.isArray(products) && products.length > 0 ? (
                    products.map((product) => {
                      // Get preview image or first image
                      const previewImage = product.preview_image || 
                        (product.images && product.images.length > 0 
                          ? (product.images.find(img => img.is_preview) || product.images[0]).image
                          : null) ||
                        product.image;
                      const imageUrl = previewImage 
                        ? (previewImage.startsWith('http') ? previewImage : `${process.env.REACT_APP_API_URL || 'http://localhost:9033'}${previewImage}`)
                        : null;
                      return (
                      <TableRow key={product.id}>
                        <TableCell>
                          {imageUrl ? (
                            <Box
                              component="img"
                              src={imageUrl}
                              alt={product.name}
                              sx={{
                                width: 50,
                                height: 50,
                                objectFit: 'cover',
                                borderRadius: 1,
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 50,
                                height: 50,
                                bgcolor: 'grey.200',
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <RestaurantIcon color="disabled" />
                            </Box>
                          )}
                        </TableCell>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{product.description || '-'}</TableCell>
                          <TableCell>{formatCurrency(product.current_price)}</TableCell>
                          <TableCell>
                            <Chip
                              label={product.is_service ? 'Service' : 'Product'}
                              size="small"
                              color={product.is_service ? 'primary' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleEditProduct(product)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteProduct(product.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        {productsLoading ? (
                          <CircularProgress size={20} />
                        ) : (
                          'No products/services found'
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Orders Tab */}
      {activeTab === 1 && (
        <Box>
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
                    label="Search Order UID or Customer"
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

          {/* Orders Table */}
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Orders
                </Typography>
                <Chip
                  label={wsConnected ? 'Connected' : 'Disconnected'}
                  color={wsConnected ? 'success' : 'default'}
                  size="small"
                  sx={{ ml: 2 }}
                />
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.isArray(orders) && orders.length > 0 ? (
                      orders.map((order) => {
                        const validNextStatuses = getValidNextStatuses(order.current_status as any, 'vendor', order.delivery_type);
                        return (
                          <TableRow key={order.id} hover>
                            <TableCell>{order.order_uid}</TableCell>
                            <TableCell>
                              {new Date(order.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{order.customer_name || 'Unknown'}</TableCell>
                            <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                            <TableCell>
                              <Chip
                                label={order.current_status}
                                color={getStatusColor(order.current_status as any)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Box display="flex" gap={1}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setOrderDetailsDialog(true);
                                  }}
                                >
                                  Details
                                </Button>
                                {validNextStatuses.length > 0 && (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="primary"
                                    onClick={() => {
                                      setSelectedOrder(order);
                                      setOrderDialog(true);
                                    }}
                                  >
                                    Update Status
                                  </Button>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          {ordersLoading ? (
                            <CircularProgress size={20} />
                          ) : (
                            'No orders found'
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Refund Requests Section */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Refund Requests
              </Typography>
              {refundRequestsLoading ? (
                <Box display="flex" justifyContent="center" py={3}>
                  <CircularProgress size={20} />
                </Box>
              ) : refundRequests.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Order ID</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell>Requested Date</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {refundRequests.map((refundRequest) => {
                        // Only show action buttons if status is pending
                        const isPending = refundRequest.status === 'pending';
                        return (
                          <TableRow key={refundRequest.id} hover>
                            <TableCell>{refundRequest.order_uid}</TableCell>
                            <TableCell>{refundRequest.requested_by_name}</TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {refundRequest.reason}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {new Date(refundRequest.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {isPending ? (
                                <Box display="flex" gap={1}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    onClick={() => {
                                      approveRefundRequest.mutate(
                                        { refundRequestId: String(refundRequest.id) },
                                        {
                                          onSuccess: () => {
                                            setAlertMessage({
                                              message: 'Refund request approved successfully',
                                              severity: 'success',
                                              open: true,
                                            });
                                          },
                                          onError: (error: any) => {
                                            setAlertMessage({
                                              message: error?.message || 'Failed to approve refund request',
                                              severity: 'error',
                                              open: true,
                                            });
                                          },
                                        }
                                      );
                                    }}
                                    disabled={approveRefundRequest.isLoading}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={() => {
                                      setSelectedRefundRequest(refundRequest);
                                      setDenyDialogOpen(true);
                                    }}
                                    disabled={denyRefundRequest.isLoading}
                                  >
                                    Deny
                                  </Button>
                                </Box>
                              ) : (
                                <Chip
                                  label={refundRequest.status.charAt(0).toUpperCase() + refundRequest.status.slice(1)}
                                  color={refundRequest.status === 'approved' ? 'success' : 'default'}
                                  size="small"
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box display="flex" justifyContent="center" py={3}>
                  <Typography variant="body2" color="text.secondary">
                    No pending refund requests
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Deny Refund Request Dialog */}
          <Dialog open={denyDialogOpen} onClose={() => setDenyDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Deny Refund Request</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Please provide a reason for denying this refund request.
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Denial Reason"
                value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
                placeholder="Please explain why this refund request is being denied..."
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setDenyDialogOpen(false);
                setDenialReason('');
                setSelectedRefundRequest(null);
              }}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedRefundRequest) {
                    denyRefundRequest.mutate(
                      { refundRequestId: String(selectedRefundRequest.id), denialReason },
                      {
                        onSuccess: () => {
                          setDenyDialogOpen(false);
                          setDenialReason('');
                          setSelectedRefundRequest(null);
                          setAlertMessage({
                            message: 'Refund request denied successfully',
                            severity: 'success',
                            open: true,
                          });
                        },
                        onError: (error: any) => {
                          setAlertMessage({
                            message: error?.message || 'Failed to deny refund request',
                            severity: 'error',
                            open: true,
                          });
                        },
                      }
                    );
                  }
                }}
                variant="contained"
                color="error"
                disabled={denyRefundRequest.isLoading}
              >
                {denyRefundRequest.isLoading ? 'Denying...' : 'Deny Request'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Order Details Dialog */}
          {selectedOrder && (
            <OrderDetails
              order={selectedOrder}
              userType="vendor"
              open={orderDetailsDialog}
              onClose={() => {
                setOrderDetailsDialog(false);
                setSelectedOrder(null);
              }}
              onStatusUpdate={(orderId, status) => {
                updateOrderStatus.mutate(
                  { orderId: String(orderId), status },
                  {
                    onSuccess: () => {
                      setAlertMessage({ message: 'Order status updated successfully', severity: 'success', open: true });
                      setOrderDetailsDialog(false);
                      setSelectedOrder(null);
                    },
                    onError: (error: unknown) => {
                      const errorMessage = error instanceof Error ? error.message : 'Failed to update order status';
                      setAlertMessage({ message: errorMessage, severity: 'error', open: true });
                    },
                  }
                );
              }}
              isUpdatingStatus={updateOrderStatus.isLoading}
            />
          )}
        </Box>
      )}

      {/* Analytics Tab */}
      {activeTab === 2 && (
        <Box>
          {statsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
              <CircularProgress />
            </Box>
          ) : stats ? (
            <Grid container spacing={3}>
              {/* Revenue Trend Chart - Full Width */}
              {stats.revenue_trends_30d && stats.revenue_trends_30d.length > 0 && (
                <Grid item xs={12}>
                  <RevenueTrendChart data={stats.revenue_trends_30d} />
                </Grid>
              )}

              {/* Product Performance and Status Distribution - Two Columns */}
              <Grid item xs={12} md={6}>
                {stats.product_revenue && stats.product_revenue.length > 0 ? (
                  <ProductPerformanceChart
                    data={stats.product_revenue}
                    onProductClick={(productId) => {
                      // Optional: Handle product click to view details
                      console.log('Product clicked:', productId);
                    }}
                  />
                ) : (
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Top Products by Revenue
                      </Typography>
                      <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          No product revenue data available
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                {stats.status_breakdown && Object.keys(stats.status_breakdown).length > 0 ? (
                  <StatusDistributionChart data={stats.status_breakdown} />
                ) : (
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Order Status Distribution
                      </Typography>
                      <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          No order status data available
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </Grid>

              {/* Customer Insights - Full Width */}
              {stats.customer_insights && (
                <Grid item xs={12}>
                  <CustomerInsightsCard data={stats.customer_insights} />
                </Grid>
              )}

              {/* Order Volume Chart - Full Width */}
              {stats.order_volume_trends && stats.order_volume_trends.length > 0 && (
                <Grid item xs={12}>
                  <OrderVolumeChart data={stats.order_volume_trends} />
                </Grid>
              )}

              {/* Revenue Summary Cards */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Today's Revenue
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(stats.today_revenue)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      This Week's Revenue
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(stats.week_revenue)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      This Month's Revenue
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(stats.month_revenue)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Unable to load analytics data. Please try refreshing the page.
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Reviews Tab */}
      {activeTab === 3 && (
        <Box>
          <ReviewStatistics reviews={reviews} />
          <ReviewsList
            reviews={reviews}
            isLoading={reviewsLoading}
            onOrderClick={(orderId) => {
              // Find the order and open order details
              const order = orders?.find((o: Order) => o.id === orderId);
              if (order) {
                setSelectedOrder(order);
                setOrderDialog(true);
              }
            }}
          />
        </Box>
      )}

      {/* Product/Service Dialog */}
      <Dialog open={productDialog} onClose={() => setProductDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedProduct ? 'Edit Product/Service' : 'Add New Product/Service'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Price"
              type="number"
              value={productForm.current_price}
              onChange={(e) => setProductForm({ ...productForm, current_price: e.target.value })}
              sx={{ mb: 2 }}
              required
              inputProps={{ min: 0, step: 0.01 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={productForm.is_service}
                  onChange={(e) => setProductForm({ ...productForm, is_service: e.target.checked })}
                />
              }
              label="This is a service"
            />
            <FormControl fullWidth sx={{ mb: 2, mt: 2 }}>
              <InputLabel>Available For</InputLabel>
              <Select
                value={productForm.available_for}
                label="Available For"
                onChange={(e) => setProductForm({ ...productForm, available_for: e.target.value as 'delivery' | 'pickup' | 'both' })}
              >
                <MenuItem value="both">Both Delivery and Pickup</MenuItem>
                <MenuItem value="delivery">Delivery Only</MenuItem>
                <MenuItem value="pickup">Pickup Only</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Estimated Preparation Time (minutes)"
              type="number"
              value={productForm.estimated_preparation_time_minutes}
              onChange={(e) => setProductForm({ ...productForm, estimated_preparation_time_minutes: e.target.value })}
              sx={{ mb: 2 }}
              inputProps={{ min: 1 }}
              helperText="Optional: Used as default estimated ready time for orders"
            />
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Product Images
              </Typography>
              {selectedProduct && productImages && Array.isArray(productImages) && productImages.length > 0 ? (
                <Box sx={{ mt: 2 }}>
                  <ImageCarousel
                    images={productImages.map(img => ({
                      id: img.id,
                      image: img.image,
                      is_preview: img.is_preview,
                      display_order: img.display_order,
                    }))}
                    onSetPreview={handleSetProductPreview}
                    onDelete={handleDeleteProductImage}
                    onReorder={handleReorderProductImage}
                    editable={true}
                    maxImages={5}
                  />
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    size="small"
                    sx={{ mt: 2 }}
                    disabled={productImages.length >= 5 || uploadProductImages.isLoading}
                  >
                    Upload More Images
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0 && selectedProduct) {
                          const remainingSlots = 5 - (productImages?.length || 0);
                          const filesToUpload = files.slice(0, remainingSlots);
                          handleUploadProductImages(filesToUpload);
                        }
                      }}
                    />
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    size="small"
                  >
                    Upload Images
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0 && selectedProduct) {
                          handleUploadProductImages(files.slice(0, 5));
                        }
                      }}
                    />
                  </Button>
                  <Typography variant="caption" color="textSecondary">
                    (Max 5 images)
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveProduct}
            variant="contained"
            disabled={createProduct.isLoading || updateProduct.isLoading || uploadProductImage.isLoading || !productForm.name || !productForm.current_price}
          >
            {createProduct.isLoading || updateProduct.isLoading || uploadProductImage.isLoading || uploadProductImages.isLoading ? (
              <CircularProgress size={20} />
            ) : (
              'Save'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Status Update Dialog */}
      <Dialog open={orderDialog} onClose={() => setOrderDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Status
              </Typography>
              <Chip
                label={selectedOrder.current_status}
                color={getStatusColor(selectedOrder.current_status as any)}
                sx={{ mb: 3, fontWeight: 600 }}
              />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Select New Status
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap" mt={2}>
                {getValidNextStatuses(selectedOrder.current_status as any, 'vendor', selectedOrder.delivery_type).map((status) => (
                  <Button
                    key={status}
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      handleUpdateOrderStatus(selectedOrder.id, status);
                      setOrderDialog(false);
                    }}
                    disabled={updateOrderStatus.isLoading}
                  >
                    {updateOrderStatus.isLoading ? 'Updating...' : status}
                  </Button>
                ))}
                {getValidNextStatuses(selectedOrder.current_status as any, 'vendor', selectedOrder.delivery_type).length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No valid status transitions available. This order is in a final state.
                  </Typography>
                )}
              </Box>
              {updateOrderStatus.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {updateOrderStatus.error instanceof Error ? updateOrderStatus.error.message : 'Failed to update order status'}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={profileDialog} onClose={() => setProfileDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Vendor Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Business Name"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Category"
              value={profileForm.category}
              onChange={(e) => setProfileForm({ ...profileForm, category: e.target.value })}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              value={profileForm.profile_description}
              onChange={(e) => setProfileForm({ ...profileForm, profile_description: e.target.value })}
              sx={{ mb: 2 }}
            />
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Profile Images
              </Typography>
              {vendorImages && Array.isArray(vendorImages) && vendorImages.length > 0 ? (
                <Box sx={{ mt: 2 }}>
                  <ImageCarousel
                    images={vendorImages.map(img => ({
                      id: img.id,
                      image: img.image,
                      is_preview: img.is_preview,
                      display_order: img.display_order,
                    }))}
                    onSetPreview={handleSetVendorPreview}
                    onDelete={handleDeleteVendorImage}
                    onReorder={handleReorderVendorImage}
                    editable={true}
                    maxImages={5}
                  />
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    size="small"
                    sx={{ mt: 2 }}
                    disabled={vendorImages.length >= 5 || uploadVendorImages.isLoading}
                  >
                    Upload More Images
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          const remainingSlots = 5 - (vendorImages?.length || 0);
                          const filesToUpload = files.slice(0, remainingSlots);
                          handleUploadVendorImages(filesToUpload);
                        }
                      }}
                    />
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    size="small"
                  >
                    Upload Images
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          handleUploadVendorImages(files.slice(0, 5));
                        }
                      }}
                    />
                  </Button>
                  <Typography variant="caption" color="textSecondary">
                    (Max 5 images)
                  </Typography>
                </Box>
              )}
            </Box>
            <Alert severity="info" sx={{ mt: 2 }}>
              Verification status: {vendor.is_verified ? 'Verified' : 'Pending Verification'}
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveProfile}
            variant="contained"
            disabled={updateVendorProfile.isLoading || uploadVendorProfileImage.isLoading || !profileForm.name || !profileForm.category}
          >
            {updateVendorProfile.isLoading || uploadVendorProfileImage.isLoading ? (
              <CircularProgress size={20} />
            ) : (
              'Save'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Tooltip title="Add Product/Service">
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleCreateProduct}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      {/* Error Messages */}
      {createProduct.isError && (
        <AlertMessage
          open={true}
          message={createProduct.error instanceof Error ? createProduct.error.message : 'Failed to create product/service'}
          severity="error"
        />
      )}
      {updateProduct.isError && (
        <AlertMessage
          open={true}
          message={updateProduct.error instanceof Error ? updateProduct.error.message : 'Failed to update product/service'}
          severity="error"
        />
      )}
      {deleteProduct.isError && (
        <AlertMessage
          open={true}
          message={deleteProduct.error instanceof Error ? deleteProduct.error.message : 'Failed to delete product/service'}
          severity="error"
        />
      )}
      {updateOrderStatus.isError && (
        <AlertMessage
          open={true}
          message={updateOrderStatus.error instanceof Error ? updateOrderStatus.error.message : 'Failed to update order status'}
          severity="error"
        />
      )}
      {updateVendorProfile.isError && (
        <AlertMessage
          open={true}
          message={updateVendorProfile.error instanceof Error ? updateVendorProfile.error.message : 'Failed to update profile'}
          severity="error"
        />
      )}

      {/* Alert Message */}
      <AlertMessage
        message={alertMessage.message}
        severity={alertMessage.severity}
        open={alertMessage.open}
        onClose={() => setAlertMessage({ ...alertMessage, open: false })}
      />
    </Container>
  );
};

export default VendorDashboard;
