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
    
    // Remove any whitespace and normalize
    const normalized = phone.trim();
    
    // Try to extract country code from phone number
    // Format: +27 12 345 6789 or +27123456789 or 27 12 345 6789 or +27-12-345-6789
    // Try matching with + prefix first
    const withPlusMatch = normalized.match(/^\+(\d{1,4})[\s\-]*(.+)$/);
    if (withPlusMatch) {
      const code = withPlusMatch[1];
      const num = withPlusMatch[2].trim();
      // Find country by calling code (try with and without +)
      const country = countries.find(c => {
        const callingCode = c.codes?.calling_code;
        if (!callingCode) return false;
        // Remove + if present and compare
        const normalizedCallingCode = callingCode.replace(/^\+/, '');
        return normalizedCallingCode === code;
      });
      if (country) {
        return { countryCode: country.iso_alpha2, number: num };
      }
    }
    
    // Try matching without + prefix
    const withoutPlusMatch = normalized.match(/^(\d{1,4})[\s\-]+(.+)$/);
    if (withoutPlusMatch) {
      const code = withoutPlusMatch[1];
      const num = withoutPlusMatch[2].trim();
      // Find country by calling code
      const country = countries.find(c => {
        const callingCode = c.codes?.calling_code;
        if (!callingCode) return false;
        // Remove + if present and compare
        const normalizedCallingCode = callingCode.replace(/^\+/, '');
        return normalizedCallingCode === code;
      });
      if (country) {
        return { countryCode: country.iso_alpha2, number: num };
      }
    }
    
    // If no match found, check if the entire number starts with a known country code
    // This handles cases like "27123456789" where there's no separator
    if (countries.length > 0) {
      // Try matching longest country codes first (up to 4 digits)
      for (let codeLength = 4; codeLength >= 1; codeLength--) {
        const potentialCode = normalized.substring(0, codeLength);
        const remainingNumber = normalized.substring(codeLength);
        
        const country = countries.find(c => {
          const callingCode = c.codes?.calling_code;
          if (!callingCode) return false;
          const normalizedCallingCode = callingCode.replace(/^\+/, '');
          return normalizedCallingCode === potentialCode && remainingNumber.length > 0;
        });
        
        if (country) {
          return { countryCode: country.iso_alpha2, number: remainingNumber };
        }
      }
    }
    
    // If no country code found, return the whole thing as the number
    return { countryCode: '', number: normalized };
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
        // Ensure we only set the number part (without country code)
        // Remove any remaining country code patterns that might have slipped through
        let cleanNumber = parsed.number;
        // Remove any leading country code patterns that might still be in the number
        if (country?.codes?.calling_code) {
          const callingCode = country.codes.calling_code.replace(/^\+/, '');
          // Remove country code if it appears at the start of the number
          cleanNumber = cleanNumber.replace(new RegExp(`^\\+?${callingCode}[\\s\\-]*`), '');
        }
        setPhoneNumber(cleanNumber);
        userManuallyChangedCountry.current = true; // Value came from external source
      } else {
        // No country code found, use the whole value as the number
        // But ensure it doesn't start with a known country code
        let cleanNumber = parsed.number;
        // Try to remove any leading country codes that might be in the number
        if (countries.length > 0) {
          for (let codeLength = 4; codeLength >= 1; codeLength--) {
            const potentialCode = cleanNumber.substring(0, codeLength);
            const country = countries.find(c => {
              const callingCode = c.codes?.calling_code;
              if (!callingCode) return false;
              const normalizedCallingCode = callingCode.replace(/^\+/, '');
              return normalizedCallingCode === potentialCode;
            });
            if (country) {
              cleanNumber = cleanNumber.substring(codeLength).trim();
              setSelectedCountry(country);
              break;
            }
          }
        }
        setPhoneNumber(cleanNumber);
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
    let num = e.target.value;
    
    // Prevent "0" as the first character
    // If the field is empty (or was just cleared) and user tries to enter "0", ignore it
    if (phoneNumber === '' && num === '0') {
      return; // Ignore the input completely
    }
    
    // If the new value starts with "0" and the field was empty, remove leading zeros
    // This handles cases like pasting "0123" or typing "0" followed by other digits
    if (phoneNumber === '' && num.startsWith('0')) {
      const cleanedNum = num.replace(/^0+/, ''); // Remove all leading zeros
      if (cleanedNum === '') {
        return; // If only zeros were entered, ignore
      }
      num = cleanedNum; // Use the cleaned number
    }
    
    setPhoneNumber(num);
    updatePhoneValue(selectedCountry, num);
  };

  const updatePhoneValue = (country: Country | null, number: string) => {
    if (onChange) {
      // Always emit only the number part (without country code)
      // The country code is stored separately in the country field
      // The number parameter is already clean (from the input field which only shows the number)
      const cleanNumber = number.trim();
      
      // Store the emitted value for comparison (we store it with country code for comparison purposes)
      // but emit only the number
      if (country?.codes?.calling_code && cleanNumber) {
        const code = country.codes.calling_code.startsWith('+') 
          ? country.codes.calling_code 
          : `+${country.codes.calling_code}`;
        // Store full value for comparison, but emit only the number
        lastEmittedValue.current = `${code} ${cleanNumber}`;
      } else {
        lastEmittedValue.current = cleanNumber;
      }
      
      // Emit only the number part (without country code)
      onChange(cleanNumber);
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
                      fontSize: '0.7rem',
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
              <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.7rem', mr: 1 }}>
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

