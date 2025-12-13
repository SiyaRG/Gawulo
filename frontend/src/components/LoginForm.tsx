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
  Divider,
} from '@mui/material';
import {
  Email as EmailIcon,
  Google,
  Facebook,
} from '@mui/icons-material';
import { useLogin } from '../hooks/useApi';
import { useQueryClient } from 'react-query';
import AlertMessage from './AlertMessage';
import api from '../services/api';

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
    email: '',
    password: '',
  });
  const [otpCode, setOtpCode] = useState('');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
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
    } else if (login.isSuccess && login.data) {
      // Check if 2FA is required
      if ('requires_2fa' in login.data && login.data.requires_2fa) {
        setRequires2FA(true);
        // Type guard: if requires_2fa is true, it's TwoFactorAuthResponse
        const twoFactorResponse = login.data as { requires_2fa: true; session_token: string; message: string };
        setSessionToken(twoFactorResponse.session_token);
        setErrorMessage(null);
      } else {
        // Clear error on successful login
        setErrorMessage(null);
      }
    }
  }, [login.error, login.isSuccess, login.data]);

  // Navigate after successful login when user data is confirmed in cache
  useEffect(() => {
    if (login.isSuccess && login.data && !('requires_2fa' in login.data && login.data.requires_2fa) && !hasNavigated.current) {
      const cachedUser = queryClient.getQueryData(['user', 'current']);
      if (cachedUser) {
        hasNavigated.current = true;
        // Small delay to ensure App state has updated
        const timer = setTimeout(() => {
          // Type guard: if it's not a 2FA response, it must be AuthResponse
          if ('user' in login.data) {
            const email = login.data.user.email;
            if (email === 'admin@gawulo.com') {
              navigate('/home', { replace: true });
            } else {
              navigate('/customer', { replace: true });
            }
            onSuccess?.();
          }
        }, 50);
        
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (requires2FA && sessionToken) {
      // Verify OTP
      setIsVerifyingOTP(true);
      try {
        const response = await api.verifyOTP(otpCode, sessionToken);
        // Store tokens
        localStorage.setItem('accessToken', response.access);
        localStorage.setItem('refreshToken', response.refresh);
        
        // Invalidate and refetch user data
        queryClient.invalidateQueries(['user', 'current']);
        
        // Navigate
        const email = response.user.email;
        if (email === 'admin@gawulo.com') {
          navigate('/home', { replace: true });
        } else {
          navigate('/customer', { replace: true });
        }
        onSuccess?.();
      } catch (error: any) {
        setErrorMessage(error.message || 'Invalid OTP code. Please try again.');
      } finally {
        setIsVerifyingOTP(false);
      }
    } else {
      // Initial login
      login.mutate(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(value);
  };

  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    try {
      setErrorMessage(null);
      const response = await api.oauthInitiate(provider);
      // Redirect to OAuth provider
      window.location.href = response.auth_url;
    } catch (error: any) {
      setErrorMessage(error.message || `Failed to initiate ${provider} login`);
    }
  };

  const handleBackToLogin = () => {
    setRequires2FA(false);
    setSessionToken(null);
    setOtpCode('');
    setErrorMessage(null);
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
                
                borderRadius: 2,
                p: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 40px -10px rgba(39, 174, 96, 0.5)',
              }}>
                <Box
                  component="img"
                  src="/logo.svg"
                  alt="ReachHub Logo"
                  sx={{
                    width: 80,
                    height: 80,
                    objectFit: 'contain',
                  }}
                />
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
              {requires2FA ? 'Enter Verification Code' : 'Welcome Back'}
            </Typography>
            <Typography 
              variant="body1" 
              align="center" 
              sx={{ 
                mb: 4,
                color: '#666666',
                fontSize: '0.8rem',
              }}
            >
              {requires2FA 
                ? 'We sent a 6-digit code to your email' 
                : 'Trust as a Service. Verifiable Certainty.'}
            </Typography>

            {/* Error Alert */}
            <AlertMessage
              open={!!errorMessage}
              message={errorMessage || 'An error occurred. Please try again.'}
              severity="error"
              duration={5000}
              onClose={() => setErrorMessage(null)}
            />

            {requires2FA ? (
              /* 2FA OTP Form */
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Enter 6-digit code"
                  name="otp"
                  value={otpCode}
                  onChange={handleOTPChange}
                  margin="normal"
                  required
                  disabled={isVerifyingOTP}
                  autoComplete="off"
                  inputProps={{
                    maxLength: 6,
                    pattern: '[0-9]*',
                    inputMode: 'numeric',
                  }}
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
                  disabled={isVerifyingOTP || otpCode.length !== 6}
                  startIcon={isVerifyingOTP ? <CircularProgress size={20} color="inherit" /> : (
                    <Box
                      component="img"
                      src="/logo.svg"
                      alt="Logo"
                      sx={{
                        width: 20,
                        height: 20,
                        objectFit: 'contain',
                      }}
                    />
                  )}
                  sx={{ 
                    mt: 2,
                    mb: 2,
                    py: 1.5,
                    fontSize: '0.88rem',
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
                  {isVerifyingOTP ? 'Verifying...' : 'Verify Code'}
                </Button>
                <Button
                  fullWidth
                  variant="text"
                  onClick={handleBackToLogin}
                  sx={{ mt: 1 }}
                >
                  Back to Login
                </Button>
              </form>
            ) : (
              <>
                {/* OAuth Buttons */}
                <Box sx={{ mb: 3 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    startIcon={<Google />}
                    onClick={() => handleOAuthLogin('google')}
                    sx={{
                      mb: 2,
                      py: 1.5,
                      borderColor: '#db4437',
                      color: '#db4437',
                      '&:hover': {
                        borderColor: '#c23321',
                        backgroundColor: 'rgba(219, 68, 55, 0.04)',
                      },
                    }}
                  >
                    Continue with Google
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    startIcon={<Facebook />}
                    onClick={() => handleOAuthLogin('facebook')}
                    sx={{
                      mb: 2,
                      py: 1.5,
                      borderColor: '#4267B2',
                      color: '#4267B2',
                      '&:hover': {
                        borderColor: '#365899',
                        backgroundColor: 'rgba(66, 103, 178, 0.04)',
                      },
                    }}
                  >
                    Continue with Facebook
                  </Button>
                </Box>

                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" sx={{ color: '#666666' }}>
                    OR
                  </Typography>
                </Divider>

                {/* Email/Password Login Form */}
                <form onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    margin="normal"
                    required
                    disabled={login.isLoading}
                    autoComplete="email"
                    InputProps={{
                      startAdornment: <EmailIcon sx={{ mr: 1, color: '#666666' }} />,
                    }}
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
                    startIcon={login.isLoading ? <CircularProgress size={20} color="inherit" /> : (
                      <Box
                        component="img"
                        src="/logo.svg"
                        alt="Logo"
                        sx={{
                          width: 20,
                          height: 20,
                          objectFit: 'contain',
                        }}
                      />
                    )}
                    sx={{ 
                      mt: 2,
                      mb: 2,
                      py: 1.5,
                      fontSize: '0.88rem',
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
              </>
            )}

            {/* Footer Text */}
            <Typography 
              variant="body2" 
              align="center" 
              sx={{ 
                mt: 3,
                color: '#666666',
                fontSize: '0.7rem',
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
                fontSize: '0.6rem',
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
