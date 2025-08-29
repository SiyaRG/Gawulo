import React from 'react';
import { Alert, Snackbar } from '@mui/material';
import { WifiOff } from '@mui/icons-material';

interface OfflineIndicatorProps {
  isOnline: boolean;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ isOnline }) => {
  return (
    <Snackbar
      open={!isOnline}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        severity="warning"
        icon={<WifiOff />}
        sx={{ width: '100%' }}
      >
        You are currently offline. Some features may be limited.
      </Alert>
    </Snackbar>
  );
};

export default OfflineIndicator;
