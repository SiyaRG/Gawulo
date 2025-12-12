import React, { useState } from 'react';
import { Box, Typography, CircularProgress, Container } from '@mui/material';
import { AppState, ProfileUpdateForm } from '../types/index';
import { useCurrentUser } from '../hooks/useApi';
import ProfileEditForm from '../components/ProfileEditForm';
import AlertMessage from '../components/AlertMessage';
import api from '../services/api';

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (updateData: ProfileUpdateForm) => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Note: This endpoint doesn't exist yet, but we prepare the structure
      // When the backend endpoint is created, uncomment this:
      // await api.updateProfile(updateData);
      
      // For now, show a message that the feature is coming soon
      setErrorMessage('Profile update endpoint is not yet available. This feature will be available soon.');
      
      // When backend is ready, uncomment this:
      // setSuccessMessage('Profile updated successfully!');
      // await refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  if (isLoading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress sx={{ color: BRAND_COLORS.primary }} />
        </Box>
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
          isLoading={isSaving}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </Box>
    </Container>
  );
};

export default ProfilePage;
