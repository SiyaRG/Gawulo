import React from 'react';
import { Box, Typography } from '@mui/material';

const LoadingScreen: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Box
        component="img"
        src="/logo_animate.svg"
        alt="Loading..."
        sx={{
          width: { xs: 120, sm: 160 },
          height: { xs: 120, sm: 160 },
          mb: 3,
        }}
      />
      <Typography variant="h6" color="text.secondary">
        Loading ReachHub...
      </Typography>
    </Box>
  );
};

export default LoadingScreen;
