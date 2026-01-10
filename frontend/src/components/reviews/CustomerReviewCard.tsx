import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Rating,
  Chip,
  IconButton,
  useTheme,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Store as VendorIcon,
  ShoppingBag as OrderIcon,
  AccessTime as TimeIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Review } from '../../types/index';

interface CustomerReviewCardProps {
  review: Review;
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void;
  onOrderClick?: (orderId: number) => void;
}

const CustomerReviewCard: React.FC<CustomerReviewCardProps> = ({
  review,
  onEdit,
  onDelete,
  onOrderClick,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    if (onEdit) {
      onEdit(review);
    }
  };

  const handleDelete = () => {
    handleMenuClose();
    if (onDelete) {
      onDelete(review);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return theme.palette.success.main;
    if (rating >= 3) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const vendorName = review.vendor_name || 
    (typeof review.vendor === 'object' && review.vendor
      ? (review.vendor as any).name || (review.vendor as any).business_name
      : 'Unknown Vendor');

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header with Vendor Name and Actions */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <VendorIcon color="action" fontSize="small" />
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {vendorName}
            </Typography>
          </Box>
          {(onEdit || onDelete) && (
            <>
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                aria-label="more options"
              >
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                {onEdit && (
                  <MenuItem onClick={handleEdit}>
                    <EditIcon fontSize="small" sx={{ mr: 1 }} />
                    Edit
                  </MenuItem>
                )}
                {onDelete && (
                  <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                    Delete
                  </MenuItem>
                )}
              </Menu>
            </>
          )}
        </Box>

        {/* Rating */}
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Rating value={review.rating} readOnly size="small" />
          <Chip
            label={`${review.rating}★`}
            size="small"
            sx={{
              backgroundColor: getRatingColor(review.rating),
              color: 'white',
              fontWeight: 'bold',
            }}
          />
        </Box>

        {/* Comment */}
        {review.comment && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              flexGrow: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {review.comment}
          </Typography>
        )}

        {/* Footer with Order Info and Date */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mt: 'auto', pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}
        >
          {review.order_uid && (
            <Box
              display="flex"
              alignItems="center"
              gap={0.5}
              sx={{
                cursor: onOrderClick ? 'pointer' : 'default',
                '&:hover': onOrderClick ? { opacity: 0.7 } : {},
              }}
              onClick={() => {
                if (onOrderClick && review.order) {
                  const orderId = typeof review.order === 'object' && review.order !== null
                    ? (review.order as any).id
                    : review.order;
                  if (typeof orderId === 'number') {
                    onOrderClick(orderId);
                  }
                }
              }}
            >
              <OrderIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Order: {review.order_uid}
              </Typography>
            </Box>
          )}
          <Box display="flex" alignItems="center" gap={0.5}>
            <TimeIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {format(new Date(review.created_at), 'MMM dd, yyyy')}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CustomerReviewCard;

