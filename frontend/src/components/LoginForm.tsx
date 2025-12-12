import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Container,
} from '@mui/material';
import {
  Lock,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useLogin } from '../hooks/useApi';
import { useQueryClient } from 'react-query';
import AlertMessage from './AlertMessage';

interface LoginFormProps {
  onSuccess?: () => void;
}

// Trust as a Service brand colors
const BRAND_COLORS = {
  primary: '#27AE60', // Vibrant Green
  accent: '#E3AD4D', // Gold/Yellow-Orange
  lightBg: '#FDF9F3', // Creamy Off-White
  darkText: '#333333', // Dark Gray
  white: '#FFFFFF', // Pure White
};

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasNavigated = useRef(false);

  const login = useLogin();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Capture error state from mutation and persist it locally
  useEffect(() => {
    if (login.error) {
      const message = login.error instanceof Error
        ? login.error.message
        : 'Invalid credentials. Please try again.';
      setErrorMessage(message);
    } else if (login.isSuccess) {
      // Clear error on successful login
      setErrorMessage(null);
    }
  }, [login.error, login.isSuccess]);

  // Navigate after successful login when user data is confirmed in cache
  useEffect(() => {
    if (login.isSuccess && login.data && !hasNavigated.current) {
      const cachedUser = queryClient.getQueryData(['user', 'current']);
      if (cachedUser) {
        hasNavigated.current = true;
        // Small delay to ensure App state has updated
        const timer = setTimeout(() => {
          const username = login.data.user.username;
          if (username === 'admin') {
            navigate('/home', { replace: true });
          } else if (username === 'street_food_vendor') {
            navigate('/vendor', { replace: true });
          } else {
            navigate('/customer', { replace: true });
          }
          onSuccess?.();
        }, 50); // Small delay to ensure state propagation
        
        return () => clearTimeout(timer);
      }
    }
  }, [login.isSuccess, login.data, queryClient, navigate, onSuccess]);

  // Reset navigation flag when login mutation resets
  useEffect(() => {
    if (!login.isLoading && !login.isSuccess) {
      hasNavigated.current = false;
    }
  }, [login.isLoading, login.isSuccess]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Clear previous error when starting new login attempt
    setErrorMessage(null);
    login.mutate(formData);
    // Navigation is handled by useEffect watching login.isSuccess
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Box 
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: BRAND_COLORS.lightBg,
        py: { xs: 4, sm: 0 },
        px: { xs: 2, sm: 0 },
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ 
          maxWidth: 480,
          width: '100%',
          mx: 'auto',
          borderRadius: 3,
          boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15)',
          borderTop: `4px solid ${BRAND_COLORS.primary}`,
          backgroundColor: BRAND_COLORS.white,
        }}>
          <CardContent sx={{ 
            p: { xs: 4, sm: 5 },
          }}>
            {/* Logo/Icon Section */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mb: 3 
            }}>
              <Box sx={{
                backgroundColor: BRAND_COLORS.primary,
                borderRadius: 2,
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 40px -10px rgba(39, 174, 96, 0.5)',
              }}>
                <Lock sx={{ fontSize: 40, color: BRAND_COLORS.white }} />
              </Box>
            </Box>

            {/* Header */}
            <Typography 
              variant="h3" 
              align="center" 
              gutterBottom
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.75rem', sm: '2rem' },
                color: BRAND_COLORS.darkText,
                mb: 1,
              }}
            >
              Welcome Back
            </Typography>
            <Typography 
              variant="body1" 
              align="center" 
              sx={{ 
                mb: 4,
                color: '#666666',
                fontSize: '1rem',
              }}
            >
              Trust as a Service. Verifiable Certainty.
            </Typography>

            {/* Error Alert */}
            <AlertMessage
              open={!!errorMessage}
              message={errorMessage || 'Invalid credentials. Please try again.'}
              severity="error"
              duration={5000}
              onClose={() => setErrorMessage(null)}
            />

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                margin="normal"
                required
                disabled={login.isLoading}
                autoComplete="username"
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: BRAND_COLORS.primary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: BRAND_COLORS.primary,
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                margin="normal"
                required
                disabled={login.isLoading}
                autoComplete="current-password"
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: BRAND_COLORS.primary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: BRAND_COLORS.primary,
                    },
                  },
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={login.isLoading}
                startIcon={login.isLoading ? <CircularProgress size={20} color="inherit" /> : <Lock />}
                sx={{ 
                  mt: 2,
                  mb: 2,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  backgroundColor: BRAND_COLORS.primary,
                  borderRadius: '9999px',
                  boxShadow: '0 0 40px -10px rgba(39, 174, 96, 0.5)',
                  '&:hover': {
                    backgroundColor: '#1E7D47',
                    transform: 'scale(1.02)',
                    transition: 'all 0.3s ease',
                  },
                  '&:disabled': {
                    backgroundColor: BRAND_COLORS.primary,
                    opacity: 0.7,
                  },
                }}
              >
                {login.isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            {/* Footer Text */}
            <Typography 
              variant="body2" 
              align="center" 
              sx={{ 
                mt: 3,
                color: '#666666',
                fontSize: '0.875rem',
              }}
            >
              Don't have an account?{' '}
              <Link 
                to="/register" 
                style={{ 
                  color: BRAND_COLORS.primary, 
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Sign Up
              </Link>
            </Typography>
            <Typography 
              variant="body2" 
              align="center" 
              sx={{ 
                mt: 1,
                color: '#666666',
                fontSize: '0.75rem',
              }}
            >
              Secure login powered by Trust as a Service
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default LoginForm;
