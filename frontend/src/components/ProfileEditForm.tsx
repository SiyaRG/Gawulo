import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Autocomplete,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
} from '@mui/icons-material';
import { User, ProfileUpdateForm, Country, Language } from '../types/index';
import { useCountries, useLanguages } from '../hooks/useApi';
import PhoneNumberInput from './PhoneNumberInput';
import AlertMessage from './AlertMessage';

// Trust as a Service brand colors
const BRAND_COLORS = {
  primary: '#27AE60', // Vibrant Green
  accent: '#E3AD4D', // Gold/Yellow-Orange
  lightBg: '#FDF9F3', // Creamy Off-White
  darkText: '#333333', // Dark Gray
  white: '#FFFFFF', // Pure White
};

interface ProfileEditFormProps {
  user: User | null;
  isLoading?: boolean;
  onSave?: (data: ProfileUpdateForm) => void;
  onCancel?: () => void;
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  user,
  isLoading = false,
  onSave,
  onCancel,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<ProfileUpdateForm>({
    email: '',
    first_name: '',
    last_name: '',
    display_name: '',
    phone_number: '',
    country: '',
    primary_language: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { data: countriesData, isLoading: countriesLoading } = useCountries();
  const { data: languagesData, isLoading: languagesLoading } = useLanguages();
  
  const countries = countriesData?.results || [];
  const languages = languagesData?.results || [];

  // Initialize form data from user
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        display_name: (user as any).display_name || user.username || '',
        phone_number: user.phone_number || '',
        country: (user as any).country || '',
        primary_language: (user as any).primary_language || '',
      });
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
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

  const handleEdit = () => {
    setIsEditMode(true);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleCancel = () => {
    // Reset form data to original user data
    if (user) {
      setFormData({
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        display_name: (user as any).display_name || user.username || '',
        phone_number: user.phone_number || '',
        country: (user as any).country || '',
        primary_language: (user as any).primary_language || '',
      });
    }
    setErrors({});
    setIsEditMode(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    if (onCancel) {
      onCancel();
    }
  };

  const handleSave = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setErrors({});

    if (!validateForm()) {
      return;
    }

    // Prepare update data (only include fields that have values)
    const updateData: ProfileUpdateForm = {};
    if (formData.email?.trim()) updateData.email = formData.email.trim();
    if (formData.first_name?.trim()) updateData.first_name = formData.first_name.trim();
    if (formData.last_name?.trim()) updateData.last_name = formData.last_name.trim();
    if (formData.display_name?.trim()) updateData.display_name = formData.display_name.trim();
    if (formData.phone_number?.trim()) updateData.phone_number = formData.phone_number.trim();
    if (formData.country?.trim()) updateData.country = formData.country.trim();
    if (formData.primary_language?.trim()) updateData.primary_language = formData.primary_language.trim();

    if (onSave) {
      onSave(updateData);
      // Note: Success/error handling will be done by parent component
      // For now, just exit edit mode
      setIsEditMode(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No user data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
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
        message={errorMessage || 'Failed to update profile. Please try again.'}
        severity="error"
        duration={5000}
        onClose={() => setErrorMessage(null)}
      />

      <Card sx={{ 
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        mb: 3,
      }}>
        <CardContent sx={{ p: 3 }}>
          {/* Header with Edit Button */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: BRAND_COLORS.darkText }}>
              Profile Information
            </Typography>
            {!isEditMode && (
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={handleEdit}
                disabled={isLoading}
                sx={{
                  borderColor: BRAND_COLORS.primary,
                  color: BRAND_COLORS.primary,
                  '&:hover': {
                    borderColor: BRAND_COLORS.primary,
                    backgroundColor: `${BRAND_COLORS.primary}10`,
                  },
                }}
              >
                Edit
              </Button>
            )}
          </Box>

          {/* Account Information Section */}
          <Typography variant="h6" sx={{ mb: 2, color: BRAND_COLORS.darkText, fontWeight: 600 }}>
            Account Information
          </Typography>

          <TextField
            fullWidth
            label="Username"
            value={user.username}
            margin="normal"
            disabled
            sx={{ mb: 2 }}
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
            disabled={!isEditMode || isLoading}
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

          <Divider sx={{ my: 3 }} />

          {/* Personal Information Section */}
          <Typography variant="h6" sx={{ mb: 2, color: BRAND_COLORS.darkText, fontWeight: 600 }}>
            Personal Information
          </Typography>

          <TextField
            fullWidth
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            margin="normal"
            disabled={!isEditMode || isLoading}
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
            disabled={!isEditMode || isLoading}
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
            disabled={!isEditMode || isLoading}
            helperText="How your name will appear to others"
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

          <Divider sx={{ my: 3 }} />

          {/* Contact Information Section */}
          <Typography variant="h6" sx={{ mb: 2, color: BRAND_COLORS.darkText, fontWeight: 600 }}>
            Contact Information
          </Typography>

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
            disabled={!isEditMode || isLoading}
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
                  label="Country"
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
              disabled={!isEditMode || isLoading}
              label="Phone Number"
              defaultCountryCode={formData.country}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Language Preferences Section */}
          <Typography variant="h6" sx={{ mb: 2, color: BRAND_COLORS.darkText, fontWeight: 600 }}>
            Language Preferences
          </Typography>

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
            disabled={!isEditMode || isLoading}
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
                label="Primary Language"
                margin="normal"
                error={!!errors.primary_language}
                helperText={errors.primary_language}
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
            )}
            isOptionEqualToValue={(option, value) => option.iso_639_1 === value.iso_639_1}
          />

          {/* Action Buttons */}
          {isEditMode && (
            <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={handleCancel}
                disabled={isLoading}
                sx={{
                  borderColor: '#666',
                  color: '#666',
                  '&:hover': {
                    borderColor: '#333',
                    backgroundColor: '#f5f5f5',
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Save />}
                onClick={handleSave}
                disabled={isLoading}
                sx={{
                  backgroundColor: BRAND_COLORS.primary,
                  '&:hover': {
                    backgroundColor: '#1E7D47',
                  },
                }}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProfileEditForm;

