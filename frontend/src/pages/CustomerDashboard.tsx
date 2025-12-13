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
} from '@mui/icons-material';
import { useVendors, useVendor, useVendorMenu, useCreateOrder, useMyOrders, useCreateReview } from '../hooks/useApi';
import { Vendor, MenuItem as MenuItemType, Order } from '../types/index';
import LoadingLogo from '../components/LoadingLogo';

interface CustomerDashboardProps {
  appState: any;
}

interface CartItem {
  menuItem: MenuItemType;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
  });

  // API hooks
  const { data: vendors, isLoading: vendorsLoading } = useVendors({ search: searchQuery });
  const { data: vendorMenu } = useVendorMenu(selectedVendor?.id || '');
  const { data: myOrders, isLoading: ordersLoading } = useMyOrders();
  const createOrder = useCreateOrder();
  const createReview = useCreateReview();

  const handleVendorClick = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setVendorDialog(true);
  };

  const handleAddToCart = (menuItem: MenuItemType) => {
    const existingItem = cart.find(item => item.menuItem.id === menuItem.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.menuItem.id === menuItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { menuItem, quantity: 1 }]);
    }
  };

  const handleRemoveFromCart = (menuItemId: string) => {
    setCart(cart.filter(item => item.menuItem.id !== menuItemId));
  };

  const handleUpdateQuantity = (menuItemId: string, quantity: number) => {
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

  const handlePlaceOrder = () => {
    if (!selectedVendor || cart.length === 0) return;

    const orderData = {
      vendor_id: selectedVendor.id,
      delivery_type: 'delivery' as const,
      delivery_address: '123 Main Street, Johannesburg',
      delivery_instructions: 'Please call when arriving',
      items: cart.map(item => ({
        menu_item_id: item.menuItem.id,
        quantity: item.quantity,
        special_instructions: item.specialInstructions,
      })),
    };

    createOrder.mutate(orderData, {
      onSuccess: () => {
        setCart([]);
        setVendorDialog(false);
      },
    });
  };

  const handleSubmitReview = () => {
    if (!selectedVendor) return;

    createReview.mutate({
      vendorId: selectedVendor.id,
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
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'preparing': return 'primary';
      case 'ready': return 'success';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const calculateCartTotal = () => {
    return cart.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  };

  if (vendorsLoading || ordersLoading) {
    return <LoadingLogo />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Customer Dashboard
      </Typography>

      {/* Search Bar */}
      <Box sx={{ mb: 4 }}>
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
        <Tab label="My Orders" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          {Array.isArray(vendors?.results) && vendors?.results && vendors.results.length > 0 ? (
            vendors?.results.map((vendor) => (
            <Grid item xs={12} sm={6} md={4} key={vendor.id}>
              <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => handleVendorClick(vendor)}>
                <CardMedia
                  component="img"
                  height="140"
                  image={`https://source.unsplash.com/400x200/?food,${vendor.business_type}`}
                  alt={vendor.business_name}
                />
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {vendor.business_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {vendor.description}
                  </Typography>
                  <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                    <Rating value={vendor.rating} readOnly size="small" />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      ({vendor.rating})
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Chip
                      label={vendor.business_type.replace('_', ' ')}
                      size="small"
                      color="primary"
                    />
                    <Typography variant="body2">
                      Min: R{vendor.minimum_order}
                    </Typography>
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
          {Array.isArray(myOrders) && myOrders.length > 0 ? (
            myOrders.map((order) => (
            <Grid item xs={12} key={order.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      Order #{order.order_number}
                    </Typography>
                    <Chip
                      label={order.status}
                      color={getOrderStatusColor(order.status) as any}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    {order.vendor.business_name}
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
                    {order.status === 'delivered' && (
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
          {selectedVendor?.business_name}
          <Typography variant="body2" color="text.secondary">
            {selectedVendor?.description}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Menu
              </Typography>
              <Grid container spacing={2}>
                {Array.isArray(vendorMenu) && vendorMenu.length > 0 ? (
                  vendorMenu.map((item) => (
                  <Grid item xs={12} sm={6} key={item.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">{item.name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {item.description}
                        </Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="h6" color="primary">
                            R{item.price}
                          </Typography>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleAddToCart(item)}
                          >
                            Add to Cart
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
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
                        secondary={`R${item.menuItem.price} x ${item.quantity}`}
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
                  <Typography variant="h6">
                    Total: R{calculateCartTotal().toFixed(2)}
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handlePlaceOrder}
                    disabled={createOrder.isLoading}
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
                  <Typography variant="body1">{selectedOrder.order_number}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Status</Typography>
                  <Chip
                    label={selectedOrder.status}
                    color={getOrderStatusColor(selectedOrder.status) as any}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Vendor</Typography>
                  <Typography variant="body1">{selectedOrder.vendor.business_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Total Amount</Typography>
                  <Typography variant="body1">R{selectedOrder.total_amount}</Typography>
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
                        {selectedOrder.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.menu_item.name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>R{item.unit_price}</TableCell>
                            <TableCell>R{item.total_price}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                {selectedOrder.status === 'delivered' && (
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
              {selectedVendor?.business_name}
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
    </Container>
  );
};

export default CustomerDashboard;
