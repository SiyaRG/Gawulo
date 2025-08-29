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

  const handleLogout = () => {
    logout.mutate();
    handleMenuClose();
    navigate('/');
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
    </Menu>
  );

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.primary.main,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <Toolbar>
        {/* Mobile Menu Button */}
        {isMobile && onMenuToggle && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Logo/Brand */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            flexGrow: 1,
            cursor: 'pointer',
            '&:hover': {
              opacity: 0.8,
            }
          }}
          onClick={() => navigate('/')}
        >
          <img 
            src="/logo.svg" 
            alt="Gawulo Logo" 
            style={{ 
              height: '32px', 
              width: '32px',
              filter: 'brightness(0) invert(1)', // Make logo white
              marginRight: '8px',
              display: 'block'
            }} 
          />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 700,
              display: { xs: 'none', sm: 'block' } // Hide on mobile, show on tablet+
            }}
          >
            Gawulo
          </Typography>
        </Box>

        {/* Online/Offline Status */}
        <Chip
          label={appState.isOnline ? 'Online' : 'Offline'}
          color={appState.isOnline ? 'success' : 'error'}
          size="small"
          sx={{ 
            mr: 2,
            display: { xs: 'none', sm: 'flex' } // Hide on mobile
          }}
        />

        {/* Development Cache Clear Button */}
        {process.env.NODE_ENV === 'development' && (
          <Button
            variant="outlined"
            size="small"
            onClick={handleClearCache}
            sx={{ 
              mr: 2, 
              color: 'white', 
              borderColor: 'white',
              display: { xs: 'none', md: 'block' }, // Hide on mobile and tablet
              '&:hover': {
                borderColor: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            🧹 Clear Cache
          </Button>
        )}

        {/* Desktop Navigation */}
        {!isMobile && appState.isAuthenticated && (
          <Box sx={{ 
            display: { xs: 'none', md: 'flex' }, 
            alignItems: 'center', 
            gap: 1 
          }}>
            <Button 
              color="inherit" 
              onClick={() => navigate('/home')}
              sx={{ textTransform: 'none' }}
            >
              Dashboard
            </Button>
            <Button 
              color="inherit" 
              onClick={() => navigate('/vendor')}
              sx={{ textTransform: 'none' }}
            >
              Vendor
            </Button>
            <Button 
              color="inherit" 
              onClick={() => navigate('/customer')}
              sx={{ textTransform: 'none' }}
            >
              Customer
            </Button>
          </Box>
        )}

        {/* Notifications */}
        <IconButton
          size="large"
          aria-label="show notifications"
          color="inherit"
          sx={{ 
            ml: 1,
            display: { xs: 'none', sm: 'flex' } // Hide on mobile
          }}
        >
          <Notifications />
        </IconButton>

        {/* User Menu */}
        {appState.isAuthenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
              {appState.user?.username || 'User'}
            </Typography>
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls={menuId}
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {appState.user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
          </Box>
        ) : (
          <Button 
            color="inherit" 
            onClick={() => navigate('/login')}
            sx={{ textTransform: 'none' }}
          >
            Login
          </Button>
        )}

        {/* Mobile Menu Button */}
        {isMobile && appState.isAuthenticated && (
          <IconButton
            size="large"
            aria-label="show more"
            aria-controls={mobileMenuId}
            aria-haspopup="true"
            onClick={handleMobileMenuOpen}
            color="inherit"
            sx={{ ml: 1 }}
          >
            <AccountCircle />
          </IconButton>
        )}
      </Toolbar>
      {renderMenu}
      {renderMobileMenu}
    </AppBar>
  );
};

export default TopNavigation;
