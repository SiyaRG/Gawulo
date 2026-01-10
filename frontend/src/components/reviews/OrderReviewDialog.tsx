import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Rating,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  ShoppingBag as OrderIcon,
  Store as VendorIcon,
} from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';
import { Order, Review } from '../../types/index';

interface OrderReviewDialogProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
  existingReview?: Review | null;
  onSubmit: (reviewData: { rating: number; comment: string }) => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

const OrderReviewDialog: React.FC<OrderReviewDialogProps> = ({
  open,
  onClose,
  order,
  existingReview,
  onSubmit,
  isLoading = false,
  mode,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || '');
    } else {
      setRating(5);
      setComment('');
    }
  }, [existingReview, open]);

  const handleSubmit = () => {
    if (rating < 1 || rating > 5) {
      return;
    }
    onSubmit({ rating, comment });
  };

  const handleClose = () => {
    if (!isLoading) {
      setRating(5);
      setComment('');
      onClose();
    }
  };

  if (!order) {
    return null;
  }

  const vendorName = typeof order.vendor === 'object' && order.vendor
    ? (order.vendor as any).name || (order.vendor as any).business_name || 'Unknown Vendor'
    : 'Unknown Vendor';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {mode === 'edit' ? 'Edit Review' : 'Leave a Review'}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            disabled={isLoading}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {/* Order Details */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <OrderIcon fontSize="small" color="action" />
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Order: {order.order_uid}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <VendorIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {vendorName}
              </Typography>
            </Box>
            {order.line_items && order.line_items.length > 0 && (
              <Box mt={1}>
                <Typography variant="caption" color="text.secondary">
                  Items: {order.line_items.length} item{order.line_items.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Rating */}
          <Box sx={{ mb: 3 }}>
            <Typography component="legend" variant="subtitle2" gutterBottom>
              Rating *
            </Typography>
            <Rating
              value={rating}
              onChange={(_, value) => setRating(value || 5)}
              size="large"
              disabled={isLoading}
            />
          </Box>

          {/* Comment */}
          <TextField
            fullWidth
            label="Comment"
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isLoading}
            placeholder="Share your experience with this order..."
            helperText="Optional: Tell others about your experience"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading || rating < 1 || rating > 5}
          startIcon={isLoading ? <CircularProgress size={16} /> : null}
        >
          {isLoading ? (mode === 'edit' ? 'Updating...' : 'Submitting...') : (mode === 'edit' ? 'Update Review' : 'Submit Review')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderReviewDialog;

