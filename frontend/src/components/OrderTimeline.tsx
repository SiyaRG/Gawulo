import React from 'react';
import { Box, Stepper, Step, StepLabel, StepContent, Typography, Chip } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked, Schedule } from '@mui/icons-material';

export interface OrderStatus {
  status: string;
  timestamp?: string;
  estimatedTime?: string;
}

interface OrderTimelineProps {
  currentStatus: string;
  statusHistory?: OrderStatus[];
  estimatedDeliveryTime?: string;
}

const ORDER_STATUSES = [
  { value: 'Pending', label: 'Pending', description: 'Order received' },
  { value: 'Confirmed', label: 'Confirmed', description: 'Order confirmed' },
  { value: 'Processing', label: 'Processing', description: 'Preparing your order' },
  { value: 'Shipped', label: 'Shipped', description: 'Out for delivery' },
  { value: 'Delivered', label: 'Delivered', description: 'Order delivered' },
  { value: 'Cancelled', label: 'Cancelled', description: 'Order cancelled' },
  { value: 'Refunded', label: 'Refunded', description: 'Order refunded' },
];

const getStatusIndex = (status: string): number => {
  return ORDER_STATUSES.findIndex(s => s.value === status);
};

const getStatusColor = (status: string): 'default' | 'primary' | 'success' | 'error' | 'warning' => {
  switch (status) {
    case 'Delivered':
      return 'success';
    case 'Cancelled':
    case 'Refunded':
      return 'error';
    case 'Processing':
    case 'Shipped':
      return 'primary';
    default:
      return 'default';
  }
};

const OrderTimeline: React.FC<OrderTimelineProps> = ({
  currentStatus,
  statusHistory = [],
  estimatedDeliveryTime,
}) => {
  const currentIndex = getStatusIndex(currentStatus);
  const activeStep = currentIndex >= 0 ? currentIndex : 0;

  return (
    <Box sx={{ width: '100%', py: 2 }}>
      <Stepper activeStep={activeStep} orientation="vertical">
        {ORDER_STATUSES.map((status, index) => {
          const isCompleted = index < activeStep;
          const isActive = index === activeStep;
          const isUpcoming = index > activeStep;
          const statusData = statusHistory.find(s => s.status === status.value);

          return (
            <Step key={status.value} completed={isCompleted} active={isActive}>
              <StepLabel
                StepIconComponent={() => {
                  if (isCompleted) {
                    return <CheckCircle color="success" />;
                  } else if (isActive) {
                    return <Schedule color="primary" />;
                  } else {
                    return <RadioButtonUnchecked color="disabled" />;
                  }
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body1" fontWeight={isActive ? 'bold' : 'normal'}>
                    {status.label}
                  </Typography>
                  {isActive && (
                    <Chip
                      label="Current"
                      size="small"
                      color={getStatusColor(status.value)}
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {status.description}
                </Typography>
                {statusData?.timestamp && (
                  <Typography variant="caption" color="text.secondary">
                    {new Date(statusData.timestamp).toLocaleString()}
                  </Typography>
                )}
                {statusData?.estimatedTime && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    • Estimated: {statusData.estimatedTime}
                  </Typography>
                )}
              </StepContent>
            </Step>
          );
        })}
      </Stepper>
      {estimatedDeliveryTime && activeStep < ORDER_STATUSES.length - 1 && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Estimated Delivery:</strong> {estimatedDeliveryTime}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default OrderTimeline;

