import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  ShoppingCart,
  Notifications,
  Logout,
  Dashboard,
  Person,
  Settings,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../hooks/useApi';
import { useQueryClient } from 'react-query';
import { clearAllCaches } from '../utils/cacheUtils';
import { disableServiceWorkers, clearBrowserCache } from '../utils/serviceWorkerUtils';

interface TopNavigationProps {
  appState: any;
  onMenuToggle?: () => void;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ appState, onMenuToggle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const logout = useLogout();
  const queryClient = useQueryClient();
  
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = React.useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchor(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    try {
      await logout.mutateAsync();
      // Navigate after logout completes
      navigate('/');
    } catch (error) {
      // Even if logout fails, navigate to home
      navigate('/');
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleMenuClose();
  };

  const handleClearCache = async () => {
    console.log('🧹 Clearing all caches and service workers...');
    
    // Clear React Query cache
    clearAllCaches(queryClient);
    
    // Disable service workers
    await disableServiceWorkers();
    
    // Clear browser cache
    await clearBrowserCache();
    
    // Force a page reload to ensure fresh data
    window.location.reload();
  };

  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMenuAnchor);

  const menuId = 'primary-account-menu';
  const mobileMenuId = 'primary-account-menu-mobile';

  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      id={menuId}
      keepMounted
      open={isMenuOpen}
      onClose={handleMenuClose}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <MenuItem onClick={() => handleNavigation('/home')}>
        <Dashboard sx={{ mr: 1 }} />
        Dashboard
      </MenuItem>
      <MenuItem onClick={() => handleNavigation('/vendor')}>
        <Dashboard sx={{ mr: 1 }} />
        Vendor Dashboard
      </MenuItem>
      <MenuItem onClick={() => handleNavigation('/customer')}>
        <ShoppingCart sx={{ mr: 1 }} />
        Customer Dashboard
      </MenuItem>
      <Divider />
      <MenuItem onClick={() => handleNavigation('/profile')}>
        <Person sx={{ mr: 1 }} />
        Profile
      </MenuItem>
      <MenuItem onClick={() => handleNavigation('/settings')}>
        <Settings sx={{ mr: 1 }} />
        Settings
      </MenuItem>
      <Divider />
      <MenuItem onClick={handleLogout}>
        <Logout sx={{ mr: 1 }} />
        Logout
      </MenuItem>
    </Menu>
  );

  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMenuAnchor}
      id={mobileMenuId}
      keepMounted
      open={isMobileMenuOpen}
      onClose={handleMenuClose}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {appState.isAuthenticated ? (
        <>
          <MenuItem onClick={() => handleNavigation('/home')}>
            <Dashboard sx={{ mr: 1 }} />
            Dashboard
          </MenuItem>
          <MenuItem onClick={() => handleNavigation('/vendor')}>
            <Dashboard sx={{ mr: 1 }} />
            Vendor Dashboard
          </MenuItem>
          <MenuItem onClick={() => handleNavigation('/customer')}>
            <ShoppingCart sx={{ mr: 1 }} />
            Customer Dashboard
          </MenuItem>
          <MenuItem onClick={() => handleNavigation('/profile')}>
            <Person sx={{ mr: 1 }} />
            Profile
          </MenuItem>
          <MenuItem onClick={() => handleNavigation('/settings')}>
            <Settings sx={{ mr: 1 }} />
            Settings
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <Logout sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </>
      ) : (
        <>
          <MenuItem onClick={() => handleNavigation('/login')}>
            Sign In
          </MenuItem>
          <MenuItem onClick={() => handleNavigation('/register')}>
            Sign Up
          </MenuItem>
        </>
      )}
    </Menu>
  );

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#FFFFFF',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }}
    >
      <Toolbar sx={{ 
        maxWidth: '1280px',
        width: '100%',
        mx: 'auto',
        px: { xs: 2, sm: 3, md: 4 },
        height: '64px',
        justifyContent: 'space-between',
      }}>
        {/* Logo Left */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            flexShrink: 0,
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.8,
            }
          }}
          onClick={() => navigate('/')}
        >
          <Box sx={{
            height: '40px',
            width: '40px',
            borderRadius: 1,
            p: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 1,
          }}>
            <img 
              src="/logo.svg" 
              alt="TaaS Logo Icon" 
              style={{ 
                height: '100%', 
                width: '100%',
                objectFit: 'contain',
              }} 
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/32x32/27AE60/FFFFFF?text=R';
              }}
            />
          </Box>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#333333',
              letterSpacing: '-0.025em',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Box component="span" sx={{ color: '#333333' }}>Reach</Box>
            <Box component="span" sx={{ color: '#E3AD4D' }}>Hub</Box>
          </Typography>
        </Box>

        {/* Navigation Links (Hidden on small screen and when authenticated) */}
        {!appState.isAuthenticated && (
          <Box sx={{ 
            display: { xs: 'none', sm: 'flex' },
            ml: 6,
            gap: 2,
          }}>
            <Button
              onClick={() => navigate('/about')}
              sx={{
                color: '#333333',
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                '&:hover': {
                  color: '#27AE60',
                  backgroundColor: 'transparent',
                },
              }}
            >
              Why Trust?
            </Button>
            <Button
              onClick={() => navigate('/services')}
              sx={{
                color: '#333333',
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                '&:hover': {
                  color: '#27AE60',
                  backgroundColor: 'transparent',
                },
              }}
            >
              Services
            </Button>
            <Button
              onClick={() => navigate('/contact')}
              sx={{
                color: '#333333',
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                '&:hover': {
                  color: '#27AE60',
                  backgroundColor: 'transparent',
                },
              }}
            >
              Contact
            </Button>
          </Box>
        )}

        {/* CTA Buttons Right */}
        {!appState.isAuthenticated ? (
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/login')}
              sx={{
                alignItems: 'center',
                justifyContent: 'center',
                px: 2,
                py: 0.75,
                borderColor: '#27AE60',
                borderWidth: 1.5,
                fontSize: '0.875rem',
                fontWeight: 500,
                borderRadius: '9999px',
                color: '#27AE60',
                '&:hover': {
                  borderColor: '#1E7D47',
                  borderWidth: 1.5,
                  backgroundColor: 'rgba(39, 174, 96, 0.05)',
                },
              }}
            >
              Sign In
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/register')}
              sx={{
                alignItems: 'center',
                justifyContent: 'center',
                px: 2,
                py: 0.75,
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                borderRadius: '9999px',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                backgroundColor: '#27AE60',
                color: '#FFFFFF',
                '&:hover': {
                  backgroundColor: 'rgba(39, 174, 96, 0.9)',
                },
              }}
            >
              Sign Up
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, color: '#333333', fontSize: '0.875rem' }}>
              {appState.user?.display_name || appState.user?.first_name || 'User'}
            </Typography>
            <IconButton
              size="small"
              edge="end"
              aria-label="account of current user"
              aria-controls={menuId}
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              sx={{ color: '#333333' }}
            >
              <Avatar 
                src={appState.user?.profile_picture || undefined}
                sx={{ width: 32, height: 32, bgcolor: '#E3AD4D' }}
              >
                {(appState.user?.display_name || appState.user?.first_name || appState.user?.username || 'U').charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
        )}

        {/* Mobile Menu Button */}
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="menu"
            onClick={appState.isAuthenticated ? onMenuToggle : handleMobileMenuOpen}
            sx={{ 
              color: '#333333',
              ml: 1,
            }}
          >
            <MenuIcon />
          </IconButton>
        )}
      </Toolbar>
      {renderMenu}
      {renderMobileMenu}
    </AppBar>
  );
};

export default TopNavigation;
