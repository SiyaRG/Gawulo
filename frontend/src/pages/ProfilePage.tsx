import React from 'react';
import { Box, Typography } from '@mui/material';
import { AppState } from '../types/index';

interface ProfilePageProps {
  appState: AppState;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ appState }) => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Manage your profile settings
      </Typography>
    </Box>
  );
};

export default ProfilePage;
