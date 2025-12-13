import React from 'react';
import { Box } from '@mui/material';

interface LoadingLogoProps {
  size?: number | { xs?: number; sm?: number; md?: number };
  minHeight?: string | number;
}

const LoadingLogo: React.FC<LoadingLogoProps> = ({ 
  size = { xs: 120, sm: 160 },
  minHeight = '400px'
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: minHeight,
      }}
    >
      <Box
        component="img"
        src="/logo_animate.svg"
        alt="Loading..."
        sx={{
          width: size,
          height: size,
          objectFit: 'contain',
        }}
      />
    </Box>
  );
};

export default LoadingLogo;

