import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from 'react-query';
import { Box, CircularProgress, Typography } from '@mui/material';
import api from '../services/api';

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get tokens from URL hash
        const hash = window.location.hash.substring(1); // Remove #
        
        console.log('OAuth callback - hash:', hash ? 'present' : 'missing');
        console.log('OAuth callback - full URL:', window.location.href);
        
        if (!hash) {
          console.error('No hash found in URL');
          throw new Error('No tokens found in callback');
        }

        // Decode base64 tokens (URL-safe base64)
        try {
          // Handle URL-safe base64 (replace - with + and _ with /)
          let base64 = hash.replace(/-/g, '+').replace(/_/g, '/');
          // Add padding if needed
          while (base64.length % 4) {
            base64 += '=';
          }
          const tokensJson = atob(base64);
          const tokenData = JSON.parse(tokensJson);
          console.log('OAuth callback - decoded token data:', tokenData);
          
          // Store tokens
          localStorage.setItem('accessToken', tokenData.access);
          localStorage.setItem('refreshToken', tokenData.refresh);

          // Update API service tokens
          (api as any).accessToken = tokenData.access;
          (api as any).refreshToken = tokenData.refresh;

          // Set user data in cache
          queryClient.setQueryData(['user', 'current'], tokenData.user);

          // Clear hash from URL
          window.history.replaceState(null, '', window.location.pathname);

          // Navigate based on user
          const email = tokenData.user.email;
          if (email === 'admin@gawulo.com') {
            navigate('/home', { replace: true });
          } else {
            navigate('/customer', { replace: true });
          }
        } catch (decodeError: any) {
          console.error('Token decode error:', decodeError);
          throw new Error(`Failed to decode tokens: ${decodeError.message}`);
        }
      } catch (error: any) {
        console.error('OAuth callback error:', error);
        console.error('Error stack:', error.stack);
        // Redirect to login with error
        navigate(`/login?error=${encodeURIComponent(error.message || 'oauth_failed')}`, { replace: true });
      }
    };

    handleOAuthCallback();
  }, [navigate, queryClient]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FDF9F3',
      }}
    >
      <CircularProgress size={60} sx={{ mb: 3, color: '#27AE60' }} />
      <Typography variant="h6" sx={{ color: '#333333' }}>
        Completing authentication...
      </Typography>
    </Box>
  );
};

export default OAuthCallback;

