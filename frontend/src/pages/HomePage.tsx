import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  Stack,
} from '@mui/material';
import {
  Restaurant,
  ShoppingCart,
  Person,
  Settings,
  TrendingUp,
  LocalShipping,
} from '@mui/icons-material';
import { AppState } from '../types/index';

interface HomePageProps {
  appState: AppState;
}

const HomePage: React.FC<HomePageProps> = ({ appState }) => {
  const navigate = useNavigate();

  const dashboardCards = [
    {
      title: 'Vendor Dashboard',
      description: 'Manage your menu, orders, and business',
      icon: <Restaurant sx={{ fontSize: 40 }} />,
      color: '#FF6B35',
      path: '/vendor',
      action: 'Manage Business',
    },
    {
      title: 'Customer Dashboard',
      description: 'Browse vendors and place orders',
      icon: <ShoppingCart sx={{ fontSize: 40 }} />,
      color: '#00798C',
      path: '/customer',
      action: 'Start Ordering',
    },
    {
      title: 'Profile',
      description: 'View and edit your profile information',
      icon: <Person sx={{ fontSize: 40 }} />,
      color: '#4F372D',
      path: '/profile',
      action: 'View Profile',
    },
    {
      title: 'Settings',
      description: 'Configure your account preferences',
      icon: <Settings sx={{ fontSize: 40 }} />,
      color: '#FFD639',
      path: '/settings',
      action: 'Configure',
    },
  ];

  return (
    <Box sx={{ py: 4 }}>
      {/* Welcome Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Welcome back, {appState.user?.username || 'User'}!
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Your Gawulo Dashboard - Offline-first food ordering platform
        </Typography>
        
        {/* Status Indicators */}
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
          <Chip
            icon={<TrendingUp />}
            label="System Online"
            color="success"
            variant="outlined"
          />
          <Chip
            icon={<LocalShipping />}
            label="Ready for Orders"
            color="primary"
            variant="outlined"
          />
        </Stack>
      </Box>

      {/* Dashboard Cards */}
      <Grid container spacing={4}>
        {dashboardCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mx: 'auto',
                    mb: 2,
                    bgcolor: card.color,
                  }}
                >
                  {card.icon}
                </Avatar>
                <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {card.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate(card.path)}
                  sx={{
                    bgcolor: card.color,
                    '&:hover': {
                      bgcolor: card.color,
                      opacity: 0.9,
                    },
                  }}
                >
                  {card.action}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Stats */}
      <Box sx={{ mt: 6, p: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          Quick Overview
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Orders
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed Orders
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 700 }}>
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Vendors
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default HomePage;
