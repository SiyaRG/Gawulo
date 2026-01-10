import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { Review } from '../../types/index';
import ReviewCard from './ReviewCard';

interface ReviewsListProps {
  reviews: Review[];
  isLoading?: boolean;
  onOrderClick?: (orderId: number) => void;
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';
type RatingFilter = 'all' | '5' | '4' | '3' | '2' | '1';

const ReviewsList: React.FC<ReviewsListProps> = ({
  reviews,
  isLoading = false,
  onOrderClick,
}) => {
  const theme = useTheme();
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');

  const filteredAndSortedReviews = useMemo(() => {
    // Ensure reviews is an array
    const reviewsArray = Array.isArray(reviews) ? reviews : [];
    
    if (!reviewsArray || reviewsArray.length === 0) return [];

    // Filter by rating
    let filtered = reviewsArray;
    if (ratingFilter !== 'all') {
      const rating = parseInt(ratingFilter);
      filtered = reviews.filter((review) => review.rating === rating);
    }

    // Sort reviews
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case 'oldest':
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

    return sorted;
  }, [reviews, sortBy, ratingFilter]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  // Ensure reviews is an array
  const reviewsArray = Array.isArray(reviews) ? reviews : [];
  
  if (!reviewsArray || reviewsArray.length === 0) {
    return (
      <Box
        sx={{
          p: 4,
          textAlign: 'center',
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Reviews Yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You haven't received any reviews from customers yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Filter and Sort Controls */}
      <Box
        display="flex"
        gap={2}
        sx={{ mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}
      >
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="rating-filter-label">Filter by Rating</InputLabel>
          <Select
            labelId="rating-filter-label"
            id="rating-filter"
            value={ratingFilter}
            label="Filter by Rating"
            onChange={(e) => setRatingFilter(e.target.value as RatingFilter)}
          >
            <MenuItem value="all">All Ratings</MenuItem>
            <MenuItem value="5">5 Stars</MenuItem>
            <MenuItem value="4">4 Stars</MenuItem>
            <MenuItem value="3">3 Stars</MenuItem>
            <MenuItem value="2">2 Stars</MenuItem>
            <MenuItem value="1">1 Star</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="sort-by-label">Sort By</InputLabel>
          <Select
            labelId="sort-by-label"
            id="sort-by"
            value={sortBy}
            label="Sort By"
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <MenuItem value="newest">Newest First</MenuItem>
            <MenuItem value="oldest">Oldest First</MenuItem>
            <MenuItem value="highest">Highest Rating</MenuItem>
            <MenuItem value="lowest">Lowest Rating</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredAndSortedReviews.length} of {reviewsArray.length} review
            {reviewsArray.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </Box>

      {/* Reviews Grid */}
      {filteredAndSortedReviews.length === 0 ? (
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            backgroundColor: theme.palette.background.paper,
            borderRadius: 2,
          }}
        >
          <Typography variant="body1" color="text.secondary">
            No reviews match the selected filter.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredAndSortedReviews.map((review) => (
            <Grid item xs={12} sm={6} md={4} key={review.id}>
              <ReviewCard review={review} onOrderClick={onOrderClick} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ReviewsList;

