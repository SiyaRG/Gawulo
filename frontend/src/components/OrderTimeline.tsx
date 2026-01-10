import React from 'react';
import { Box, Stepper, Step, StepLabel, StepContent, Typography, Chip } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked, Schedule } from '@mui/icons-material';
import { OrderStatusHistory } from '../types/index';
import { ORDER_STATUSES, getStatusColor } from '../utils/orderStatus';

interface OrderTimelineProps {
  currentStatus: string;
  statusHistory?: OrderStatusHistory[];
  estimatedDeliveryTime?: string;
  deliveryType?: 'delivery' | 'pickup';
}

const OrderTimeline: React.FC<OrderTimelineProps> = ({
  currentStatus,
  statusHistory = [],
  estimatedDeliveryTime,
  deliveryType,
}) => {
  // Filter statuses based on delivery type
  let relevantStatuses = ORDER_STATUSES;
  if (deliveryType === 'pickup') {
    // For pickup, show: Pending, Confirmed, Processing, Ready, PickedUp, Cancelled, Refunded
    relevantStatuses = ORDER_STATUSES.filter(s => 
      ['Pending', 'Confirmed', 'Processing', 'Ready', 'PickedUp', 'Cancelled', 'Refunded'].includes(s.value)
    );
  } else {
    // For delivery, show: Pending, Confirmed, Processing, Shipped, Delivered, Cancelled, Refunded
    relevantStatuses = ORDER_STATUSES.filter(s => 
      ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'].includes(s.value)
    );
  }
  
  const currentIndex = relevantStatuses.findIndex(s => s.value === currentStatus);
  const activeStep = currentIndex >= 0 ? currentIndex : 0;

  return (
    <Box sx={{ width: '100%', py: 2 }}>
      <Stepper activeStep={activeStep} orientation="vertical">
        {relevantStatuses.map((status, index) => {
          const isCompleted = index < activeStep;
          const isActive = index === activeStep;
          const statusData = statusHistory?.find(s => s.status === status.value);

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
                      color={getStatusColor(status.value) as any}
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
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {new Date(statusData.timestamp).toLocaleString()}
                    </Typography>
                    {statusData.confirmed_by_name && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        Confirmed by: {statusData.confirmed_by_name}
                      </Typography>
                    )}
                  </Box>
                )}
              </StepContent>
            </Step>
          );
        })}
      </Stepper>
      {estimatedDeliveryTime && activeStep < relevantStatuses.length - 1 && (
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
