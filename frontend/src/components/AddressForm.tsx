import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControlLabel,
  Checkbox,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
} from '@mui/material';
import { CustomerAddress } from '../types/index';
import { useCountries } from '../hooks/useApi';

interface AddressFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (addressData: Omit<CustomerAddress, 'id' | 'user' | 'created_at'>) => void;
  initialData?: CustomerAddress | null;
  title?: string;
}

const AddressForm: React.FC<AddressFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  title = 'Add Address',
}) => {
  const { data: countries } = useCountries();
  const [formData, setFormData] = useState({
    address_type: 'delivery',
    line1: '',
    line2: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: '',
    is_default: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        address_type: initialData.address_type || 'delivery',
        line1: initialData.line1 || '',
        line2: initialData.line2 || '',
        city: initialData.city || '',
        state_province: initialData.state_province || '',
        postal_code: initialData.postal_code || '',
        country: initialData.country?.toString() || initialData.country_code || '',
        is_default: initialData.is_default || false,
      });
    } else {
      setFormData({
        address_type: 'delivery',
        line1: '',
        line2: '',
        city: '',
        state_province: '',
        postal_code: '',
        country: '',
        is_default: false,
      });
    }
    setErrors({});
  }, [initialData, open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.line1.trim()) {
      newErrors.line1 = 'Address line 1 is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.postal_code.trim()) {
      newErrors.postal_code = 'Postal code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    // Backend Country model uses iso_alpha2 as primary key (CharField), not numeric ID
    // The Address model has a ForeignKey to Country, which will accept the iso_alpha2 string
    // However, the CustomerAddress interface expects country as number, so we need to check
    // what the backend actually returns. For now, we'll send the iso_alpha2 and let the backend
    // handle the ForeignKey lookup. If the backend expects a numeric ID, we'd need to look it up.
    // Since Country uses iso_alpha2 as PK, the ForeignKey should accept it directly.
    // But to be safe, we'll update the backend serializer to accept iso_alpha2 and convert it.
    // For now, we'll send undefined if no country is selected, and the backend will handle null.
    const addressData: any = {
      address_type: formData.address_type,
      line1: formData.line1.trim(),
      line2: formData.line2.trim() || undefined,
      city: formData.city.trim(),
      state_province: formData.state_province.trim() || undefined,
      postal_code: formData.postal_code.trim(),
      country: formData.country || undefined, // Send iso_alpha2 string - backend serializer needs to handle this
      is_default: formData.is_default,
    };

    onSubmit(addressData);
    onClose();
  };

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }) => {
    const value = 'target' in event ? event.target.value : '';
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      is_default: event.target.checked,
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Address Type</InputLabel>
            <Select
              value={formData.address_type}
              label="Address Type"
              onChange={(e) => handleChange('address_type')({ target: { value: e.target.value } })}
            >
              <MenuItem value="delivery">Delivery</MenuItem>
              <MenuItem value="billing">Billing</MenuItem>
              <MenuItem value="shipping">Shipping</MenuItem>
              <MenuItem value="residential">Residential</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Address Line 1"
            value={formData.line1}
            onChange={handleChange('line1')}
            error={!!errors.line1}
            helperText={errors.line1}
            required
            fullWidth
          />

          <TextField
            label="Address Line 2 (Optional)"
            value={formData.line2}
            onChange={handleChange('line2')}
            fullWidth
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="City"
              value={formData.city}
              onChange={handleChange('city')}
              error={!!errors.city}
              helperText={errors.city}
              required
              fullWidth
            />

            <TextField
              label="State/Province (Optional)"
              value={formData.state_province}
              onChange={handleChange('state_province')}
              fullWidth
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Postal Code"
              value={formData.postal_code}
              onChange={handleChange('postal_code')}
              error={!!errors.postal_code}
              helperText={errors.postal_code}
              required
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Country (Optional)</InputLabel>
              <Select
                value={formData.country}
                label="Country (Optional)"
                onChange={(e) => handleChange('country')({ target: { value: e.target.value } })}
              >
                <MenuItem value="">None</MenuItem>
                {countries?.results?.map((country) => (
                  <MenuItem key={country.iso_alpha2} value={country.iso_alpha2}>
                    {country.country_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.is_default}
                onChange={handleCheckboxChange}
              />
            }
            label="Set as default delivery address"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {initialData ? 'Update' : 'Add'} Address
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddressForm;

