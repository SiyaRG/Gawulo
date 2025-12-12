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
  Autocomplete,
} from '@mui/material';
import {
  PersonAdd,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useRegister, useCountries, useLanguages } from '../hooks/useApi';
import { useQueryClient } from 'react-query';
import AlertMessage from './AlertMessage';
import PhoneNumberInput from './PhoneNumberInput';
import { RegisterForm, Country, Language } from '../types/index';

// Trust as a Service brand colors
const BRAND_COLORS = {
  primary: '#27AE60', // Vibrant Green
  accent: '#E3AD4D', // Gold/Yellow-Orange
  lightBg: '#FDF9F3', // Creamy Off-White
  darkText: '#333333', // Dark Gray
  white: '#FFFFFF', // Pure White
};

const UserRegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState<RegisterForm>({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    display_name: '',
    phone_number: '',
    country: '',
    primary_language: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasNavigated = useRef(false);

  const register = useRegister();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: countriesData, isLoading: countriesLoading } = useCountries();
  const { data: languagesData, isLoading: languagesLoading } = useLanguages();
  
  const countries = countriesData?.results || [];
  const languages = languagesData?.results || [];

  // Debug: Log countries to check flags
  useEffect(() => {
    if (countries.length > 0) {
      console.log('Sample country:', countries[0]);
      console.log('Countries with flags:', countries.filter(c => c.flags?.flag_emoji).length);
    }
  }, [countries]);

  // Capture error state from mutation and persist it locally
  useEffect(() => {
    if (register.error) {
      const message = register.error instanceof Error
        ? register.error.message
        : 'Registration failed. Please try again.';
      setErrorMessage(message);
    } else if (register.isSuccess) {
      setErrorMessage(null);
    }
  }, [register.error, register.isSuccess]);

  // Navigate after successful registration
  useEffect(() => {
    if (register.isSuccess && register.data && !hasNavigated.current) {
      const cachedUser = queryClient.getQueryData(['user', 'current']);
      if (cachedUser) {
        hasNavigated.current = true;
        const timer = setTimeout(() => {
          navigate('/customer', { replace: true });
        }, 50);
        return () => clearTimeout(timer);
      }
    }
  }, [register.isSuccess, register.data, queryClient, navigate]);

  // Reset navigation flag when registration mutation resets
  useEffect(() => {
    if (!register.isLoading && !register.isSuccess) {
      hasNavigated.current = false;
    }
  }, [register.isLoading, register.isSuccess]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your password';
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    // Validate phone number if provided
    if (formData.phone_number && formData.phone_number.trim()) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(formData.phone_number.trim())) {
        newErrors.phone_number = 'Please enter a valid phone number';
      }
    }

    // Validate country code if provided
    if (formData.country) {
      const countryCode = formData.country.trim();
      if (countryCode) {
        const countryExists = countries.some(c => c.iso_alpha2 === countryCode);
        if (!countryExists) {
          newErrors.country = 'Please select a valid country';
        }
      }
    }

    // Validate language code if provided
    if (formData.primary_language) {
      const languageCode = formData.primary_language.trim();
      if (languageCode) {
        const languageExists = languages.some(l => l.iso_639_1 === languageCode);
        if (!languageExists) {
          newErrors.primary_language = 'Please select a valid language';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrors({});

    if (!validateForm()) {
      return;
    }

    // Prepare registration data
    const registrationData = {
      username: formData.username.trim(),
      email: formData.email.trim(),
      password: formData.password,
      confirm_password: formData.confirm_password,
      first_name: formData.first_name?.trim() || '',
      last_name: formData.last_name?.trim() || '',
      display_name: formData.display_name?.trim() || formData.username.trim(),
      phone_number: formData.phone_number?.trim() || '',
      country: formData.country?.trim() || '',
      primary_language: formData.primary_language?.trim() || '',
    };

    register.mutate(registrationData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleCountryChange = (_event: any, newValue: Country | null) => {
    setFormData({
      ...formData,
      country: newValue?.iso_alpha2 || '',
    });
    if (errors.country) {
      setErrors({
        ...errors,
        country: '',
      });
    }
  };

  const handleLanguageChange = (_event: any, newValue: Language | null) => {
    setFormData({
      ...formData,
      primary_language: newValue?.iso_639_1 || '',
    });
    if (errors.primary_language) {
      setErrors({
        ...errors,
        primary_language: '',
      });
    }
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
          maxWidth: 600,
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
                <PersonAdd sx={{ fontSize: 40, color: BRAND_COLORS.white }} />
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
              Create Account
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
              Join ReachHub. Trust as a Service.
            </Typography>

            {/* Error Alert */}
            <AlertMessage
              open={!!errorMessage}
              message={errorMessage || 'Registration failed. Please try again.'}
              severity="error"
              duration={5000}
              onClose={() => setErrorMessage(null)}
            />

            {/* Registration Form */}
            <form onSubmit={handleSubmit}>
              {/* Account Information Section */}
              <Typography variant="h6" sx={{ mb: 2, color: BRAND_COLORS.darkText, fontWeight: 600 }}>
                Account Information
              </Typography>
              
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                margin="normal"
                required
                disabled={register.isLoading}
                autoComplete="username"
                error={!!errors.username}
                helperText={errors.username}
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
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                required
                disabled={register.isLoading}
                autoComplete="email"
                error={!!errors.email}
                helperText={errors.email}
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
                disabled={register.isLoading}
                autoComplete="new-password"
                error={!!errors.password}
                helperText={errors.password}
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
                label="Confirm Password"
                name="confirm_password"
                type="password"
                value={formData.confirm_password}
                onChange={handleChange}
                margin="normal"
                required
                disabled={register.isLoading}
                autoComplete="new-password"
                error={!!errors.confirm_password}
                helperText={errors.confirm_password}
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

              <Divider sx={{ my: 3 }} />

              {/* Personal Information Section */}
              <Typography variant="h6" sx={{ mb: 2, color: BRAND_COLORS.darkText, fontWeight: 600 }}>
                Personal Information (Optional)
              </Typography>
              
              <TextField
                fullWidth
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                margin="normal"
                disabled={register.isLoading}
                autoComplete="given-name"
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
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                margin="normal"
                disabled={register.isLoading}
                autoComplete="family-name"
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
                label="Display Name"
                name="display_name"
                value={formData.display_name}
                onChange={handleChange}
                margin="normal"
                disabled={register.isLoading}
                helperText="How your name will appear to others (defaults to username)"
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

              <Autocomplete
                options={countries}
                getOptionLabel={(option) => {
                  if (!option) return '';
                  if (typeof option === 'string') {
                    // If option is a string (iso_alpha2), find the country
                    const country = countries.find(c => c.iso_alpha2 === option);
                    return country ? country.country_name : option;
                  }
                  // Ensure we always return the country name
                  return option.country_name || '';
                }}
                value={formData.country ? countries.find(c => c.iso_alpha2 === formData.country) || null : null}
                onChange={handleCountryChange}
                loading={countriesLoading}
                disabled={register.isLoading}
                filterOptions={(options, { inputValue }) => {
                  // Custom filter to search by country name or code
                  return options.filter(option =>
                    option.country_name.toLowerCase().includes(inputValue.toLowerCase()) ||
                    option.iso_alpha2.toLowerCase().includes(inputValue.toLowerCase()) ||
                    option.iso_alpha3?.toLowerCase().includes(inputValue.toLowerCase())
                  );
                }}
                renderInput={(params) => {
                  const selectedCountry = countries.find(c => c.iso_alpha2 === formData.country);
                  return (
                    <TextField
                      {...params}
                      label="Country (Optional)"
                      margin="normal"
                      error={!!errors.country}
                      helperText={errors.country}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            {selectedCountry?.flags?.flag_svg_url && (
                              <Box
                                component="img"
                                src={selectedCountry.flags.flag_svg_url}
                                alt={selectedCountry.flags.flag_alt_text || `${selectedCountry.country_name} flag`}
                                sx={{
                                  mr: 1,
                                  width: '20px',
                                  height: '15px',
                                  objectFit: 'contain',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  verticalAlign: 'middle',
                                }}
                              />
                            )}
                            {params.InputProps.startAdornment}
                          </>
                        ),
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
                  );
                }}
                renderOption={(props, option) => {
                  const flagSvgUrl = option.flags?.flag_svg_url;
                  return (
                    <Box component="li" {...props} key={option.iso_alpha2}>
                      {flagSvgUrl && (
                        <Box
                          component="img"
                          src={flagSvgUrl}
                          alt={option.flags?.flag_alt_text || `${option.country_name} flag`}
                          sx={{
                            mr: 1.5,
                            width: '24px',
                            height: '18px',
                            objectFit: 'contain',
                            display: 'inline-block',
                            verticalAlign: 'middle',
                          }}
                        />
                      )}
                      <Box component="span">{option.country_name}</Box>
                    </Box>
                  );
                }}
                isOptionEqualToValue={(option, value) => option.iso_alpha2 === value.iso_alpha2}
              />

              <Box sx={{ mb: 2, mt: 2 }}>
                <PhoneNumberInput
                  value={formData.phone_number}
                  onChange={(value) => {
                    setFormData({
                      ...formData,
                      phone_number: value,
                    });
                    if (errors.phone_number) {
                      setErrors({
                        ...errors,
                        phone_number: '',
                      });
                    }
                  }}
                  error={!!errors.phone_number}
                  helperText={errors.phone_number}
                  disabled={register.isLoading}
                  label="Phone Number (Optional)"
                  defaultCountryCode={formData.country}
                />
              </Box>

              <Autocomplete
                options={languages}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') {
                    // If option is a string (iso_639_1), find the language
                    const language = languages.find(l => l.iso_639_1 === option);
                    return language ? language.language_name_en : option;
                  }
                  return option.language_name_en || option.iso_639_1 || '';
                }}
                value={languages.find(l => l.iso_639_1 === formData.primary_language) || null}
                onChange={handleLanguageChange}
                loading={languagesLoading}
                disabled={register.isLoading}
                filterOptions={(options, { inputValue }) => {
                  // Custom filter to search by language name or code
                  return options.filter(option =>
                    option.language_name_en.toLowerCase().includes(inputValue.toLowerCase()) ||
                    option.iso_639_1.toLowerCase().includes(inputValue.toLowerCase()) ||
                    option.native_name?.toLowerCase().includes(inputValue.toLowerCase())
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Primary Language (Optional)"
                    margin="normal"
                    error={!!errors.primary_language}
                    helperText={errors.primary_language}
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
                )}
                isOptionEqualToValue={(option, value) => option.iso_639_1 === value.iso_639_1}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={register.isLoading}
                startIcon={register.isLoading ? <CircularProgress size={20} color="inherit" /> : <PersonAdd />}
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
                {register.isLoading ? 'Creating Account...' : 'Create Account'}
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
              Already have an account?{' '}
              <Link 
                to="/login" 
                style={{ 
                  color: BRAND_COLORS.primary, 
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Sign In
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default UserRegistrationForm;

