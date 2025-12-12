import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import { Country } from '../types/index';
import { useCountries } from '../hooks/useApi';

interface PhoneNumberInputProps {
  value?: string;
  onChange?: (value: string) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  margin?: 'none' | 'dense' | 'normal';
  defaultCountryCode?: string; // ISO alpha-2 code to preselect the country code
}

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value = '',
  onChange,
  error = false,
  helperText,
  disabled = false,
  label = 'Phone Number',
  required = false,
  margin = 'normal',
  defaultCountryCode,
}) => {
  const { data: countriesData, isLoading: countriesLoading } = useCountries();
  const countries = countriesData?.results || [];

  // Parse existing phone number to extract country code and number
  const parsePhoneNumber = (phone: string): { countryCode: string; number: string } => {
    if (!phone) return { countryCode: '', number: '' };
    
    // Try to extract country code from phone number
    // Format: +27 12 345 6789 or +27123456789 or 27 12 345 6789
    const match = phone.match(/^\+?(\d{1,4})\s*(.+)$/);
    if (match) {
      const code = match[1];
      const num = match[2].trim();
      // Find country by calling code (without +)
      const country = countries.find(c => c.codes?.calling_code === code);
      if (country) {
        return { countryCode: country.iso_alpha2, number: num };
      }
    }
    
    return { countryCode: '', number: phone };
  };

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const lastEmittedValue = React.useRef<string>('');
  const userManuallyChangedCountry = React.useRef<boolean>(false);
  const userClearedCountryCode = React.useRef<boolean>(false);
  const lastDefaultCountryCode = React.useRef<string | undefined>(undefined);

  // Initialize from value prop (only when value changes externally)
  useEffect(() => {
    // Skip if this is the value we just emitted
    if (value === lastEmittedValue.current) {
      return;
    }
    
    if (value) {
      const parsed = parsePhoneNumber(value);
      if (parsed.countryCode) {
        const country = countries.find(c => c.iso_alpha2 === parsed.countryCode);
        setSelectedCountry(country || null);
        setPhoneNumber(parsed.number);
        userManuallyChangedCountry.current = true; // Value came from external source
      } else {
        setPhoneNumber(parsed.number);
      }
    } else {
      setSelectedCountry(null);
      setPhoneNumber('');
      userManuallyChangedCountry.current = false;
    }
  }, [value, countries]);

  // Preselect country code from defaultCountryCode prop
  useEffect(() => {
    if (defaultCountryCode && countries.length > 0) {
      // Don't auto-select if user has explicitly cleared the country code
      if (userClearedCountryCode.current) {
        lastDefaultCountryCode.current = defaultCountryCode;
        return;
      }
      
      // Only auto-select if:
      // 1. No country is currently selected AND user hasn't manually changed it, OR
      // 2. The defaultCountryCode changed and user hasn't manually changed it
      const shouldAutoSelect = (!selectedCountry && !userManuallyChangedCountry.current) || 
        (!userManuallyChangedCountry.current && defaultCountryCode !== lastDefaultCountryCode.current);
      
      if (shouldAutoSelect) {
        const country = countries.find(c => c.iso_alpha2 === defaultCountryCode && c.codes?.calling_code);
        if (country && country.iso_alpha2 !== selectedCountry?.iso_alpha2) {
          setSelectedCountry(country);
          userManuallyChangedCountry.current = false;
          userClearedCountryCode.current = false;
        }
      }
      
      lastDefaultCountryCode.current = defaultCountryCode;
    } else if (!defaultCountryCode && lastDefaultCountryCode.current) {
      // If defaultCountryCode is cleared, allow clearing the flag
      lastDefaultCountryCode.current = undefined;
      userClearedCountryCode.current = false;
    }
  }, [defaultCountryCode, countries, selectedCountry]);

  const handleCountryChange = (_event: any, newValue: Country | null) => {
    setSelectedCountry(newValue);
    // Mark as manually changed whether they selected a country or cleared it (null)
    userManuallyChangedCountry.current = true;
    // Track if user explicitly cleared the country code
    if (newValue === null) {
      userClearedCountryCode.current = true;
    } else {
      userClearedCountryCode.current = false;
    }
    updatePhoneValue(newValue, phoneNumber);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value;
    setPhoneNumber(num);
    updatePhoneValue(selectedCountry, num);
  };

  const updatePhoneValue = (country: Country | null, number: string) => {
    if (onChange) {
      let newValue = '';
      if (country?.codes?.calling_code && number) {
        // Store as calling_code + number (calling_code format from API, no extra +)
        const code = country.codes.calling_code.startsWith('+') 
          ? country.codes.calling_code 
          : `+${country.codes.calling_code}`;
        newValue = `${code} ${number}`;
      } else if (number) {
        newValue = number;
      }
      lastEmittedValue.current = newValue;
      onChange(newValue);
    }
  };

  // Filter countries that have calling codes
  const countriesWithCodes = countries.filter(c => c.codes?.calling_code);

  return (
    <TextField
      fullWidth
      label={label}
      type="tel"
      value={phoneNumber}
      onChange={handleNumberChange}
      error={error}
      helperText={helperText}
      disabled={disabled}
      required={required}
      margin={margin}
      autoComplete="tel-national"
      placeholder="12 345 6789"
      InputProps={{
        startAdornment: (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Autocomplete
              options={countriesWithCodes}
              getOptionLabel={(option) => {
                if (!option) return '';
                if (typeof option === 'string') {
                  const country = countriesWithCodes.find(c => c.iso_alpha2 === option);
                  return country?.codes?.calling_code || option;
                }
                // Return just the calling code without + prefix
                return option.codes?.calling_code || '';
              }}
              value={selectedCountry}
              onChange={handleCountryChange}
              loading={countriesLoading}
              disabled={disabled}
              sx={{ width: 80, minWidth: 80 }}
              size="small"
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="standard"
                  InputProps={{
                    ...params.InputProps,
                    disableUnderline: true,
                    startAdornment: selectedCountry?.flags?.flag_svg_url ? (
                      <Box
                        component="img"
                        src={selectedCountry.flags.flag_svg_url}
                        alt={selectedCountry.iso_alpha2}
                        sx={{
                          width: '36px',
                          height: '27px',
                          objectFit: 'contain',
                        }}
                      />
                    ) : null,
                  }}
                  inputProps={{
                    ...params.inputProps,
                    style: { 
                      padding: '0',
                      width: '0',
                      minWidth: '0',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                    },
                  }}
                  placeholder=""
                />
              )}
              renderOption={(props, option) => {
                const flagSvgUrl = option.flags?.flag_svg_url;
                const callingCode = option.codes?.calling_code;
                return (
                  <Box component="li" {...props} key={option.iso_alpha2}>
                    {flagSvgUrl && (
                      <Box
                        component="img"
                        src={flagSvgUrl}
                        alt={option.iso_alpha2}
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
                    <Box component="span">
                      {callingCode || ''}
                    </Box>
                  </Box>
                );
              }}
              filterOptions={(options, { inputValue }) => {
                return options.filter(option =>
                  option.codes?.calling_code?.includes(inputValue) ||
                  option.country_name.toLowerCase().includes(inputValue.toLowerCase()) ||
                  option.iso_alpha2.toLowerCase().includes(inputValue.toLowerCase())
                );
              }}
              isOptionEqualToValue={(option, value) => option.iso_alpha2 === value.iso_alpha2}
            />
            {selectedCountry?.codes?.calling_code && (
              <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.875rem', mr: 1 }}>
                {selectedCountry.codes.calling_code}
              </Box>
            )}
          </Box>
        ),
      }}
    />
  );
};

export default PhoneNumberInput;

