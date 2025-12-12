import React, { ReactNode, useState } from 'react';
import { Box, Container, Drawer, useTheme, useMediaQuery } from '@mui/material';
import { AppState } from '../types/index';
import TopNavigation from './TopNavigation';

interface LayoutProps {
  children: ReactNode;
  appState: AppState;
}

const Layout: React.FC<LayoutProps> = ({ children, appState }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Navigation Bar */}
      <TopNavigation 
        appState={appState} 
        onMenuToggle={isMobile ? handleDrawerToggle : undefined}
      />
      
      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          pt: 8, // Account for fixed AppBar
          minHeight: 'calc(100vh - 64px)', // Subtract AppBar height
          backgroundColor: '#FDF9F3', // Brand light background
        }}
      >
        {children}
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: 240,
            top: 64, // Below the AppBar
            height: 'calc(100% - 64px)',
          },
        }}
      >
        {/* Mobile menu content can be added here if needed */}
      </Drawer>
    </Box>
  );
};

export default Layout;
