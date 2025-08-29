import React from 'react';
import { Box, Typography } from '@mui/material';
import { AppState } from '../types/index';

interface OrderTrackingProps {
  appState: AppState;
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ appState }) => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Order Tracking
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Track your order status
      </Typography>
    </Box>
  );
};

export default OrderTracking;
