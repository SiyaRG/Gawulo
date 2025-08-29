import React from 'react';
import { Box, Typography } from '@mui/material';
import { AppState } from '../types/index';

interface PaymentPageProps {
  appState: AppState;
}

const PaymentPage: React.FC<PaymentPageProps> = ({ appState }) => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Payment
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Complete your payment
      </Typography>
    </Box>
  );
};

export default PaymentPage;
