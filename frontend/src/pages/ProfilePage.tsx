import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Container } from '@mui/material';
import { AppState, ProfileUpdateForm } from '../types/index';
import { useCurrentUser, useUpdateProfile } from '../hooks/useApi';
import ProfileEditForm from '../components/ProfileEditForm';
import AlertMessage from '../components/AlertMessage';
import LoadingLogo from '../components/LoadingLogo';

// Trust as a Service brand colors
const BRAND_COLORS = {
  primary: '#27AE60', // Vibrant Green
  accent: '#E3AD4D', // Gold/Yellow-Orange
  lightBg: '#FDF9F3', // Creamy Off-White
  darkText: '#333333', // Dark Gray
  white: '#FFFFFF', // Pure White
};

interface ProfilePageProps {
  appState: AppState;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ appState }) => {
  const { data: user, isLoading, error, refetch } = useCurrentUser();
  const updateProfileMutation = useUpdateProfile();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle mutation success
  useEffect(() => {
    if (updateProfileMutation.isSuccess) {
      setSuccessMessage('Profile updated successfully!');
      setErrorMessage(null);
      // Refetch user data to ensure we have the latest
      refetch();
    }
  }, [updateProfileMutation.isSuccess, refetch]);

  // Handle mutation error
  useEffect(() => {
    if (updateProfileMutation.isError) {
      const error = updateProfileMutation.error as Error;
      setErrorMessage(error.message || 'Failed to update profile. Please try again.');
      setSuccessMessage(null);
    }
  }, [updateProfileMutation.isError, updateProfileMutation.error]);

  const handleSave = async (updateData: ProfileUpdateForm) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    updateProfileMutation.mutate(updateData);
  };

  const handleCancel = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  if (isLoading) {
    return (
      <Container maxWidth="md">
        <LoadingLogo />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <AlertMessage
            open={true}
            message="Failed to load profile data. Please try again."
            severity="error"
            duration={0}
            onClose={() => {}}
          />
        </Box>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No user data available. Please log in.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        {/* Page Header */}
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{
            fontWeight: 700,
            color: BRAND_COLORS.darkText,
            mb: 1,
          }}
        >
          My Profile
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ mb: 4 }}
        >
          Manage your profile settings and personal information
        </Typography>

        {/* Success/Error Messages */}
        <AlertMessage
          open={!!successMessage}
          message={successMessage || ''}
          severity="success"
          duration={5000}
          onClose={() => setSuccessMessage(null)}
        />
        <AlertMessage
          open={!!errorMessage}
          message={errorMessage || 'An error occurred. Please try again.'}
          severity="error"
          duration={5000}
          onClose={() => setErrorMessage(null)}
        />

        {/* Profile Edit Form */}
        <ProfileEditForm
          user={user}
          isLoading={updateProfileMutation.isLoading}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </Box>
    </Container>
  );
};

export default ProfilePage;
