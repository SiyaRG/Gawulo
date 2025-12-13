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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Fab,
  Tooltip,
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
} from '@mui/icons-material';
import { useVendorOrders, useVendorMenu, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem, useUpdateOrderStatus } from '../hooks/useApi';
import { MenuItem as MenuItemType, Order } from '../types/index';
import LoadingLogo from '../components/LoadingLogo';

interface VendorDashboardProps {
  appState: any;
}

const VendorDashboard: React.FC<VendorDashboardProps> = ({ appState }) => {
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItemType | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [menuItemDialog, setMenuItemDialog] = useState(false);
  const [orderDialog, setOrderDialog] = useState(false);
  const [menuItemForm, setMenuItemForm] = useState({
    name: '',
    description: '',
    price: '',
    preparation_time: '',
    category: '',
    is_featured: false,
  });

  // API hooks
  const { data: orders, isLoading: ordersLoading } = useVendorOrders();
  const { data: menuItems, isLoading: menuLoading } = useVendorMenu('vendor-id'); // Replace with actual vendor ID
  const createMenuItem = useCreateMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();
  const updateOrderStatus = useUpdateOrderStatus();

  const handleCreateMenuItem = () => {
    setSelectedMenuItem(null);
    setMenuItemForm({
      name: '',
      description: '',
      price: '',
      preparation_time: '',
      category: '',
      is_featured: false,
    });
    setMenuItemDialog(true);
  };

  const handleEditMenuItem = (item: MenuItemType) => {
    setSelectedMenuItem(item);
    setMenuItemForm({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      preparation_time: item.preparation_time.toString(),
      category: item.category.toString(),
      is_featured: item.is_featured,
    });
    setMenuItemDialog(true);
  };

  const handleDeleteMenuItem = (id: string) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      deleteMenuItem.mutate(id);
    }
  };

  const handleSaveMenuItem = () => {
    const menuItemData = {
      name: menuItemForm.name,
      description: menuItemForm.description,
      price: parseFloat(menuItemForm.price),
      preparation_time: parseInt(menuItemForm.preparation_time),
      category: parseInt(menuItemForm.category),
      is_featured: menuItemForm.is_featured,
    };

    if (selectedMenuItem) {
      updateMenuItem.mutate({ id: selectedMenuItem.id, data: menuItemData });
    } else {
      // For creating, we only need the basic fields - backend will handle the rest
      createMenuItem.mutate(menuItemData as any);
    }
    setMenuItemDialog(false);
  };

  const handleUpdateOrderStatus = (orderId: string, status: string) => {
    updateOrderStatus.mutate({ id: orderId, status });
  };

  const getStatusColor = (status: string) => {
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

  if (ordersLoading || menuLoading) {
    return <LoadingLogo />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Vendor Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <RestaurantIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">{menuItems?.length || 0}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Menu Items
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
                  <Typography variant="h6">{orders?.length || 0}</Typography>
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
                  <Typography variant="h6">4.5</Typography>
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
                  <Typography variant="h6">R2,450</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Today's Revenue
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Menu Items Section */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Menu Items</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateMenuItem}
                >
                  Add Item
                </Button>
              </Box>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.isArray(menuItems) && menuItems.length > 0 ? (
                      menuItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>R{item.price}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.availability_status}
                            color={item.availability_status === 'available' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleEditMenuItem(item)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteMenuItem(item.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          {menuLoading ? (
                            <CircularProgress size={20} />
                          ) : (
                            'No menu items found'
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Orders Section */}
        <Grid item xs={12} lg={6}>
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
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.isArray(orders) && orders.length > 0 ? (
                      orders.slice(0, 5).map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>{order.order_number}</TableCell>
                          <TableCell>{order.customer?.first_name} {order.customer?.last_name}</TableCell>
                          <TableCell>
                            <Chip
                              label={order.status}
                              color={getStatusColor(order.status) as any}
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
                        <TableCell colSpan={4} align="center">
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
        </Grid>
      </Grid>

      {/* Menu Item Dialog */}
      <Dialog open={menuItemDialog} onClose={() => setMenuItemDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedMenuItem ? 'Edit Menu Item' : 'Add New Menu Item'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={menuItemForm.name}
              onChange={(e) => setMenuItemForm({ ...menuItemForm, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={menuItemForm.description}
              onChange={(e) => setMenuItemForm({ ...menuItemForm, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={menuItemForm.price}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, price: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Preparation Time (minutes)"
                  type="number"
                  value={menuItemForm.preparation_time}
                  onChange={(e) => setMenuItemForm({ ...menuItemForm, preparation_time: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMenuItemDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveMenuItem}
            variant="contained"
            disabled={createMenuItem.isLoading || updateMenuItem.isLoading}
          >
            {createMenuItem.isLoading || updateMenuItem.isLoading ? (
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
                  <Typography variant="subtitle2">Order Number</Typography>
                  <Typography variant="body1">{selectedOrder.order_number}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Status</Typography>
                  <Chip
                    label={selectedOrder.status}
                    color={getStatusColor(selectedOrder.status) as any}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Customer</Typography>
                  <Typography variant="body1">
                    {selectedOrder.customer.first_name} {selectedOrder.customer.last_name}
                  </Typography>
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
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Update Status
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {['confirmed', 'preparing', 'ready', 'delivered'].map((status) => (
                      <Button
                        key={status}
                        variant="outlined"
                        size="small"
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, status)}
                        disabled={updateOrderStatus.isLoading}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
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

      {/* Floating Action Button */}
      <Tooltip title="Add Menu Item">
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleCreateMenuItem}
        >
          <AddIcon />
        </Fab>
      </Tooltip>
    </Container>
  );
};

export default VendorDashboard;
