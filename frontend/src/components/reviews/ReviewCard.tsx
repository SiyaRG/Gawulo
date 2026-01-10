import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Rating,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Person as PersonIcon,
  ShoppingBag as OrderIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Review } from '../../types/index';

interface ReviewCardProps {
  review: Review;
  onOrderClick?: (orderId: number) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onOrderClick }) => {
  const theme = useTheme();

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return theme.palette.success.main;
    if (rating >= 3) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const customerName =
    typeof review.customer === 'object' && review.customer
      ? review.customer.display_name ||
        `${review.customer.first_name || ''} ${review.customer.last_name || ''}`.trim() ||
        review.customer.username ||
        'Anonymous'
      : review.customer_name || 'Anonymous';

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
        {/* Header with Customer Name and Rating */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <PersonIcon color="action" fontSize="small" />
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {customerName}
            </Typography>
          </Box>
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

        {/* Rating Stars */}
        <Box mb={2}>
          <Rating value={review.rating} readOnly size="small" />
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
                if (onOrderClick && review.order && typeof review.order === 'number') {
                  onOrderClick(review.order);
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

export default ReviewCard;

