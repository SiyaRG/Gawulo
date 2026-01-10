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
} from '../hooks/useApi';
import { ProductService, Order, ProductImage, VendorImage } from '../types/index';
import LoadingLogo from '../components/LoadingLogo';
import AlertMessage from '../components/AlertMessage';
import ImageCarousel from '../components/ImageCarousel';

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

  // API hooks
  const { data: vendor, isLoading: vendorLoading } = useCurrentVendor();
  const { data: orders, isLoading: ordersLoading } = useVendorOrders();
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

    const productData = {
      name: productForm.name,
      description: productForm.description || undefined,
      current_price: price,
      is_service: productForm.is_service || null,
    };

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

  const getStatusColor = (status: string) => {
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

  const formatCurrency = (amount: number | string) => {
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
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Orders
            </Typography>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.isArray(orders) && orders.length > 0 ? (
                    orders.slice(0, 10).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.order_uid.substring(0, 8)}...</TableCell>
                        <TableCell>{order.customer?.display_name || 'Unknown'}</TableCell>
                        <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                        <TableCell>
                          <Chip
                            label={order.current_status}
                            color={getStatusColor(order.current_status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedOrder(order);
                              setOrderDialog(true);
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
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
      )}

      {/* Analytics Tab */}
      {activeTab === 2 && stats && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Revenue Overview
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">Today</Typography>
                  <Typography variant="h5">{formatCurrency(stats.today_revenue)}</Typography>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">This Week</Typography>
                  <Typography variant="h5">{formatCurrency(stats.week_revenue)}</Typography>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">This Month</Typography>
                  <Typography variant="h5">{formatCurrency(stats.month_revenue)}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Order Status Breakdown
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {Object.entries(stats.status_breakdown).map(([status, count]) => (
                    <Box key={status} display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="body2">{status}</Typography>
                      <Typography variant="body2" fontWeight="bold">{count}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          {stats.popular_products && stats.popular_products.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Popular Products
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell align="right">Orders</TableCell>
                          <TableCell align="right">Total Quantity</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stats.popular_products.map((product: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{product.product_service__name}</TableCell>
                            <TableCell align="right">{product.order_count}</TableCell>
                            <TableCell align="right">{product.total_quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
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

      {/* Order Details Dialog */}
      <Dialog open={orderDialog} onClose={() => setOrderDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Order ID</Typography>
                  <Typography variant="body1">{selectedOrder.order_uid}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Status</Typography>
                  <Chip
                    label={selectedOrder.current_status}
                    color={getStatusColor(selectedOrder.current_status) as any}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Customer</Typography>
                  <Typography variant="body1">
                    {selectedOrder.customer?.display_name || 'Unknown'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Total Amount</Typography>
                  <Typography variant="body1">{formatCurrency(selectedOrder.total_amount)}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Order Items
                  </Typography>
                  {selectedOrder.line_items && selectedOrder.line_items.length > 0 ? (
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
                          {selectedOrder.line_items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.product_service?.name || 'Unknown'}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>{formatCurrency(item.unit_price_snapshot)}</TableCell>
                              <TableCell>{formatCurrency(item.line_total)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="textSecondary">No items found</Typography>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Update Status
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {['Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
                      <Button
                        key={status}
                        variant="outlined"
                        size="small"
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, status)}
                        disabled={updateOrderStatus.isLoading || selectedOrder.current_status === status}
                      >
                        {status}
                      </Button>
                    ))}
                  </Box>
                </Grid>
              </Grid>
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
    </Container>
  );
};

export default VendorDashboard;
