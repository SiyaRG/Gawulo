import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  useTheme,
} from '@mui/material';
import {
  Star as StarIcon,
  RateReview as ReviewIcon,
} from '@mui/icons-material';
import { Rating } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Review } from '../../types/index';

interface ReviewStatisticsProps {
  reviews: Review[];
}

const ReviewStatistics: React.FC<ReviewStatisticsProps> = ({ reviews }) => {
  const theme = useTheme();

  const statistics = useMemo(() => {
    // Ensure reviews is an array
    const reviewsArray = Array.isArray(reviews) ? reviews : [];
    
    if (!reviewsArray || reviewsArray.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: [
          { rating: 5, count: 0, percentage: 0 },
          { rating: 4, count: 0, percentage: 0 },
          { rating: 3, count: 0, percentage: 0 },
          { rating: 2, count: 0, percentage: 0 },
          { rating: 1, count: 0, percentage: 0 },
        ],
      };
    }

    const totalReviews = reviewsArray.length;
    const averageRating =
      reviewsArray.reduce((sum, review) => sum + review.rating, 0) / totalReviews;

    // Calculate rating distribution
    const distribution = [5, 4, 3, 2, 1].map((rating) => {
      const count = reviewsArray.filter((r) => r.rating === rating).length;
      return {
        rating,
        count,
        percentage: totalReviews > 0 ? (count / totalReviews) * 100 : 0,
      };
    });

    return {
      averageRating,
      totalReviews,
      ratingDistribution: distribution,
    };
  }, [reviews]);

  // Ensure reviews is an array for the empty check
  const reviewsArray = Array.isArray(reviews) ? reviews : [];
  
  if (!reviewsArray || reviewsArray.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Review Statistics
          </Typography>
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No reviews yet
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: 1.5,
            boxShadow: theme.shadows[3],
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {payload[0].payload.rating} Star{payload[0].payload.rating !== 1 ? 's' : ''}
          </Typography>
          <Typography variant="body2" color="primary">
            Count: {payload[0].value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Percentage: {payload[0].payload.percentage.toFixed(1)}%
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {/* Average Rating Card */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <StarIcon color="primary" sx={{ mr: 1, fontSize: 32 }} />
              <Typography variant="h6">Average Rating</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {statistics.averageRating.toFixed(1)}
              </Typography>
              <Rating
                value={statistics.averageRating}
                readOnly
                precision={0.1}
                size="large"
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Based on {statistics.totalReviews} review{statistics.totalReviews !== 1 ? 's' : ''}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Total Reviews Card */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <ReviewIcon color="primary" sx={{ mr: 1, fontSize: 32 }} />
              <Typography variant="h6">Total Reviews</Typography>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              {statistics.totalReviews}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Customer feedback received
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Rating Distribution Chart */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Rating Distribution
            </Typography>
            <Box sx={{ width: '100%', height: 200, mt: 2 }}>
              <ResponsiveContainer>
                <BarChart
                  data={statistics.ratingDistribution}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 'dataMax']} />
                  <YAxis
                    type="category"
                    dataKey="rating"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value}★`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    fill={theme.palette.primary.main}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Detailed Rating Breakdown */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Rating Breakdown
            </Typography>
            <Box sx={{ mt: 2 }}>
              {statistics.ratingDistribution
                .slice()
                .reverse()
                .map((item) => (
                  <Box key={item.rating} sx={{ mb: 2 }}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={0.5}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" sx={{ minWidth: 40 }}>
                          {item.rating}★
                        </Typography>
                        <Box
                          sx={{
                            flex: 1,
                            height: 24,
                            backgroundColor: theme.palette.grey[200],
                            borderRadius: 1,
                            overflow: 'hidden',
                            position: 'relative',
                          }}
                        >
                          <Box
                            sx={{
                              width: `${item.percentage}%`,
                              height: '100%',
                              backgroundColor:
                                item.rating >= 4
                                  ? theme.palette.success.main
                                  : item.rating >= 3
                                  ? theme.palette.warning.main
                                  : theme.palette.error.main,
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </Box>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{ minWidth: 80, textAlign: 'right', ml: 2 }}
                      >
                        {item.count} ({item.percentage.toFixed(1)}%)
                      </Typography>
                    </Box>
                  </Box>
                ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ReviewStatistics;

