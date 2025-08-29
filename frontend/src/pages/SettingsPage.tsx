import React from 'react';
import { Box, Typography } from '@mui/material';
import { AppState } from '../types/index';

interface SettingsPageProps {
  appState: AppState;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ appState }) => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Configure your app preferences
      </Typography>
    </Box>
  );
};

export default SettingsPage;
