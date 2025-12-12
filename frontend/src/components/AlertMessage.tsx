import React from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

// Trust as a Service brand colors
const BRAND_COLORS = {
  primary: '#27AE60', // Vibrant Green
  accent: '#E3AD4D', // Gold/Yellow-Orange
  lightBg: '#FDF9F3', // Creamy Off-White
  darkText: '#333333', // Dark Gray
  white: '#FFFFFF', // Pure White
};

interface AlertMessageProps {
  open: boolean;
  message: string;
  severity?: AlertColor;
  duration?: number;
  onClose?: () => void;
  position?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
}

const AlertMessage: React.FC<AlertMessageProps> = ({
  open,
  message,
  severity = 'success',
  duration = 4000,
  onClose,
  position = { vertical: 'top', horizontal: 'center' },
}) => {
  const getBrandColor = (severity: AlertColor) => {
    switch (severity) {
      case 'success':
        return BRAND_COLORS.primary;
      case 'error':
        return '#ef4444';
      case 'warning':
        return BRAND_COLORS.accent;
      case 'info':
        return '#3b82f6';
      default:
        return BRAND_COLORS.primary;
    }
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={position}
      sx={{
        '& .MuiSnackbarContent-root': {
          backgroundColor: getBrandColor(severity),
          color: BRAND_COLORS.white,
        },
      }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        sx={{
          width: '100%',
          backgroundColor: getBrandColor(severity),
          color: BRAND_COLORS.white,
          '& .MuiAlert-icon': {
            color: BRAND_COLORS.white,
          },
          '& .MuiAlert-message': {
            color: BRAND_COLORS.white,
          },
          '& .MuiAlert-action': {
            color: BRAND_COLORS.white,
            '& .MuiIconButton-root': {
              color: BRAND_COLORS.white,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            },
          },
          boxShadow: severity === 'success' 
            ? '0 0 40px -10px rgba(39, 174, 96, 0.5)' 
            : '0 4px 6px rgba(0,0,0,0.1)',
          borderRadius: 2,
          fontWeight: 500,
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default AlertMessage;

