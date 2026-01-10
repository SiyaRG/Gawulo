import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  Grid,
  TextField,
  IconButton,
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { Order, OrderLineItem } from '../types/index';
import OrderTimeline from './OrderTimeline';
import { getStatusColor, canCustomerCancel, getValidNextStatuses } from '../utils/orderStatus';
import { useUpdateOrderEstimatedTime, useRequestRefund, useRefundRequests } from '../hooks/useApi';
import Alert from '@mui/material/Alert';

interface OrderDetailsProps {
  order: Order;
  userType: 'customer' | 'vendor';
  open: boolean;
  onClose: () => void;
  onCancel?: (orderId: number) => void;
  onStatusUpdate?: (orderId: number, status: string) => void;
  isCancelling?: boolean;
  isUpdatingStatus?: boolean;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({
  order,
  userType,
  open,
  onClose,
  onCancel,
  onStatusUpdate,
  isCancelling = false,
  isUpdatingStatus = false,
}) => {
  const [isEditingEstimatedTime, setIsEditingEstimatedTime] = useState(false);
  const [estimatedTimeValue, setEstimatedTimeValue] = useState(
    order.estimated_ready_time ? new Date(order.estimated_ready_time).toISOString().slice(0, 16) : ''
  );
  const [refundRequestDialogOpen, setRefundRequestDialogOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const updateEstimatedTime = useUpdateOrderEstimatedTime();
  const requestRefund = useRequestRefund();
  const { data: refundRequests = [] } = useRefundRequests({ order: String(order.id) });
  const existingRefundRequest = refundRequests.find(rr => rr.order === order.id);
  
  const validNextStatuses = getValidNextStatuses(order.current_status as any, userType, order.delivery_type);
  const canCancel = userType === 'customer' 
    ? canCustomerCancel(order.current_status as any)
    : order.current_status !== 'Delivered' && order.current_status !== 'Cancelled' && order.current_status !== 'Refunded';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleSaveEstimatedTime = () => {
    if (estimatedTimeValue) {
      updateEstimatedTime.mutate(
        { orderId: String(order.id), estimatedTime: estimatedTimeValue },
        {
          onSuccess: () => {
            setIsEditingEstimatedTime(false);
          },
        }
      );
    }
  };

  const handleRequestRefund = () => {
    if (!refundReason.trim()) {
      return;
    }
    requestRefund.mutate(
      { orderId: String(order.id), reason: refundReason },
      {
        onSuccess: () => {
          setRefundRequestDialogOpen(false);
          setRefundReason('');
        },
      }
    );
  };

  const canRequestRefund = userType === 'customer' 
    && order.current_status !== 'Cancelled' 
    && order.current_status !== 'Refunded'
    && !existingRefundRequest;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Order Details</Typography>
          <Chip
            label={order.current_status}
            color={getStatusColor(order.current_status as any)}
            sx={{ fontWeight: 600 }}
          />
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Order Header Info */}
          <Grid item xs={12}>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Order UID
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {order.order_uid}
              </Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Order Date
              </Typography>
              <Typography variant="body1">
                {formatDate(order.created_at)}
              </Typography>
            </Box>
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Total Amount
              </Typography>
              <Typography variant="h6" color="primary" fontWeight={600}>
                R{typeof order.total_amount === 'number' 
                  ? order.total_amount.toFixed(2) 
                  : parseFloat(order.total_amount || '0').toFixed(2)}
              </Typography>
            </Box>
            {userType === 'vendor' && (
              <Box mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    Estimated Ready Time
                  </Typography>
                  {!isEditingEstimatedTime && (
                    <IconButton
                      size="small"
                      onClick={() => setIsEditingEstimatedTime(true)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                {isEditingEstimatedTime ? (
                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                    <TextField
                      type="datetime-local"
                      value={estimatedTimeValue}
                      onChange={(e) => setEstimatedTimeValue(e.target.value)}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <IconButton
                      size="small"
                      onClick={handleSaveEstimatedTime}
                      disabled={updateEstimatedTime.isLoading}
                      color="primary"
                    >
                      <SaveIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setIsEditingEstimatedTime(false);
                        setEstimatedTimeValue(
                          order.estimated_ready_time ? new Date(order.estimated_ready_time).toISOString().slice(0, 16) : ''
                        );
                      }}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <Typography variant="body1">
                    {order.estimated_ready_time 
                      ? formatDate(order.estimated_ready_time)
                      : 'Not set'}
                  </Typography>
                )}
              </Box>
            )}
            {userType === 'customer' && order.estimated_ready_time && (
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Estimated Ready Time
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {formatDate(order.estimated_ready_time)}
                </Typography>
              </Box>
            )}
          </Grid>

          {/* Vendor/Customer Info */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              {userType === 'customer' ? 'Vendor' : 'Customer'} Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {userType === 'customer' ? (
              <>
                <Typography variant="body2" color="text.secondary">
                  Vendor Name
                </Typography>
                <Typography variant="body1" fontWeight={600} mb={1}>
                  {order.vendor.name}
                </Typography>
                {order.vendor.category && (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      Category
                    </Typography>
                    <Typography variant="body1" mb={1}>
                      {order.vendor.category}
                    </Typography>
                  </>
                )}
              </>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  Customer Name
                </Typography>
                <Typography variant="body1" fontWeight={600} mb={1}>
                  {order.customer.display_name || 'N/A'}
                </Typography>
              </>
            )}
          </Grid>

          {/* Line Items */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Order Items
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                    {userType === 'vendor' && (
                      <TableCell align="right">Fulfilled</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.line_items && order.line_items.length > 0 ? (
                    order.line_items.map((item: OrderLineItem) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.product_service ? (
                            <>
                              <Typography variant="body1" fontWeight={600}>
                                {item.product_service.name}
                              </Typography>
                              {item.product_service.description && (
                                <Typography variant="caption" color="text.secondary">
                                  {item.product_service.description}
                                </Typography>
                              )}
                            </>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Product no longer available
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">
                          R{typeof item.unit_price_snapshot === 'number'
                            ? item.unit_price_snapshot.toFixed(2)
                            : parseFloat(item.unit_price_snapshot || '0').toFixed(2)}
                        </TableCell>
                        <TableCell align="right">
                          R{typeof item.line_total === 'number'
                            ? item.line_total.toFixed(2)
                            : parseFloat(item.line_total || '0').toFixed(2)}
                        </TableCell>
                        {userType === 'vendor' && (
                          <TableCell align="right">
                            {item.quantity_fulfilled || 0} / {item.quantity}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={userType === 'vendor' ? 5 : 4} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No items found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Refund Request Status */}
          {existingRefundRequest && (
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Refund Request
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Alert 
                severity={existingRefundRequest.status === 'approved' ? 'success' : existingRefundRequest.status === 'denied' ? 'error' : 'info'}
                sx={{ mb: 2 }}
              >
                <Typography variant="body2" fontWeight={600}>
                  Status: {existingRefundRequest.status.charAt(0).toUpperCase() + existingRefundRequest.status.slice(1)}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Reason: {existingRefundRequest.reason}
                </Typography>
                {existingRefundRequest.denial_reason && (
                  <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                    Denial Reason: {existingRefundRequest.denial_reason}
                  </Typography>
                )}
                {existingRefundRequest.processed_at && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Processed: {formatDate(existingRefundRequest.processed_at)}
                  </Typography>
                )}
              </Alert>
            </Grid>
          )}

          {/* Status Timeline */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Order Status Timeline
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <OrderTimeline
              currentStatus={order.current_status}
              statusHistory={order.status_history}
              deliveryType={order.delivery_type}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {canRequestRefund && (
          <Button
            onClick={() => setRefundRequestDialogOpen(true)}
            color="warning"
            variant="outlined"
          >
            Request Refund
          </Button>
        )}
        {canCancel && onCancel && (
          <Button
            onClick={() => onCancel(order.id)}
            color="error"
            variant="outlined"
            disabled={isCancelling}
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Order'}
          </Button>
        )}
        {userType === 'vendor' && validNextStatuses.length > 0 && onStatusUpdate && (
          <>
            {validNextStatuses.map((status) => (
              <Button
                key={status}
                onClick={() => onStatusUpdate(order.id, status)}
                variant="contained"
                color="primary"
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? 'Updating...' : `Mark as ${status}`}
              </Button>
            ))}
          </>
        )}
      </DialogActions>

      {/* Refund Request Dialog */}
      <Dialog open={refundRequestDialogOpen} onClose={() => setRefundRequestDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Refund</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide a reason for requesting a refund for order {order.order_uid}.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Reason"
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            placeholder="Please explain why you are requesting a refund..."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundRequestDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRequestRefund}
            variant="contained"
            color="warning"
            disabled={!refundReason.trim() || requestRefund.isLoading}
          >
            {requestRefund.isLoading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default OrderDetails;

