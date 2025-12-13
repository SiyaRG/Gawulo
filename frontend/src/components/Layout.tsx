import React, { ReactNode, useState } from 'react';
import { 
  Box, 
  Drawer, 
  useTheme, 
  useMediaQuery,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Dashboard,
  ShoppingCart,
  Person,
  Settings,
  Logout,
  Info,
  Business,
  ContactMail,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../hooks/useApi';
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
  const navigate = useNavigate();
  const logout = useLogout();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    setMobileOpen(false);
    try {
      await logout.mutateAsync();
      navigate('/');
    } catch (error) {
      navigate('/');
    }
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
        <Box sx={{ width: 240, pt: 2 }}>
          {appState.isAuthenticated ? (
            <List>
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavigation('/home')}>
                  <ListItemIcon>
                    <Dashboard />
                  </ListItemIcon>
                  <ListItemText primary="Dashboard" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavigation('/vendor')}>
                  <ListItemIcon>
                    <Dashboard />
                  </ListItemIcon>
                  <ListItemText primary="Vendor Dashboard" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavigation('/customer')}>
                  <ListItemIcon>
                    <ShoppingCart />
                  </ListItemIcon>
                  <ListItemText primary="Customer Dashboard" />
                </ListItemButton>
              </ListItem>
              <Divider sx={{ my: 1 }} />
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavigation('/profile')}>
                  <ListItemIcon>
                    <Person />
                  </ListItemIcon>
                  <ListItemText primary="Profile" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavigation('/settings')}>
                  <ListItemIcon>
                    <Settings />
                  </ListItemIcon>
                  <ListItemText primary="Settings" />
                </ListItemButton>
              </ListItem>
              <Divider sx={{ my: 1 }} />
              <ListItem disablePadding>
                <ListItemButton onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout />
                  </ListItemIcon>
                  <ListItemText primary="Logout" />
                </ListItemButton>
              </ListItem>
            </List>
          ) : (
            <List>
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavigation('/about')}>
                  <ListItemIcon>
                    <Info />
                  </ListItemIcon>
                  <ListItemText primary="Why Trust?" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavigation('/services')}>
                  <ListItemIcon>
                    <Business />
                  </ListItemIcon>
                  <ListItemText primary="Services" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavigation('/contact')}>
                  <ListItemIcon>
                    <ContactMail />
                  </ListItemIcon>
                  <ListItemText primary="Contact" />
                </ListItemButton>
              </ListItem>
              <Divider sx={{ my: 1 }} />
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavigation('/login')}>
                  <ListItemText primary="Sign In" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavigation('/register')}>
                  <ListItemText primary="Sign Up" />
                </ListItemButton>
              </ListItem>
            </List>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default Layout;
