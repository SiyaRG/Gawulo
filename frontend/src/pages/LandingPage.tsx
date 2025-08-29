import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia,
  Stack,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Restaurant, 
  WifiOff, 
  AttachMoney, 
  PhoneAndroid, 
  QrCode2,
  ArrowForward,
  Star,
  People,
  DeliveryDining
} from '@mui/icons-material';

// Color palette constants
const COLORS = {
  primaryAction: '#FF6B35',
  primaryBrand: '#4F372D',
  secondary: '#00798C',
  secondaryYellow: '#FFD639',
  neutralDark: '#2D323A',
  neutralLight: '#FDFDFC'
};

const LandingPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const trustFeatures = [
    {
      icon: <People sx={{ fontSize: 40, color: COLORS.secondary }} />,
      title: 'Support Your Local Businesses',
      description: 'Help grow your community by ordering from neighborhood vendors'
    },
    {
      icon: <WifiOff sx={{ fontSize: 40, color: COLORS.secondary }} />,
      title: 'Offline-First Ordering',
      description: 'Order even when you have no internet connection'
    },
    {
      icon: <AttachMoney sx={{ fontSize: 40, color: COLORS.secondary }} />,
      title: 'No Extra Fees',
      description: 'Transparent pricing with no hidden charges'
    }
  ];

  const appFeatures = [
    {
      icon: <Star sx={{ fontSize: 24, color: COLORS.secondaryYellow }} />,
      title: 'Simple Navigation',
      description: 'Easy-to-use interface designed for everyone'
    },
    {
      icon: <DeliveryDining sx={{ fontSize: 24, color: COLORS.secondaryYellow }} />,
      title: 'Real-time Tracking',
      description: 'Know exactly when your food will arrive'
    },
    {
      icon: <Restaurant sx={{ fontSize: 24, color: COLORS.secondaryYellow }} />,
      title: 'Local Favorites',
      description: 'Discover the best food in your area'
    }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: COLORS.neutralLight,
      color: COLORS.neutralDark
    }}>


             {/* Hero Section */}
       <Box sx={{
         background: `linear-gradient(135deg, ${COLORS.primaryBrand} 0%, ${COLORS.secondary} 100%)`,
         color: 'white',
         py: { xs: 8, md: 12 },
         mt: -3, // Compensate for Layout padding
         position: 'relative',
         overflow: 'hidden'
       }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h2" 
                component="h1" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  mb: 2,
                  lineHeight: 1.2
                }}
              >
                Delicious Food, Delivered to Your Doorstep
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  mb: 4, 
                  opacity: 0.9,
                  fontSize: { xs: '1.1rem', md: '1.3rem' }
                }}
              >
                Connect with local vendors in your township. Order offline, save data, and support your community.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    backgroundColor: COLORS.primaryAction,
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: '#E55A2B',
                      transform: 'translateY(-2px)',
                      transition: 'all 0.3s ease'
                    }
                  }}
                  endIcon={<ArrowForward />}
                >
                  Download App
                </Button>
                                 <Button
                   variant="outlined"
                   size="large"
                   onClick={() => navigate('/login')}
                   sx={{
                     borderColor: 'white',
                     color: 'white',
                     px: 4,
                     py: 1.5,
                     fontSize: '1.1rem',
                     fontWeight: 600,
                     borderRadius: 2,
                     '&:hover': {
                       backgroundColor: 'rgba(255,255,255,0.1)',
                       borderColor: 'white'
                     }
                   }}
                 >
                   Login Now
                 </Button>
                <Button
                  variant="text"
                  size="large"
                  sx={{
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Learn More
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                position: 'relative'
              }}>
                {/* Mock phone with app screenshot */}
                <Box sx={{
                  width: { xs: 280, md: 320 },
                  height: { xs: 560, md: 640 },
                  backgroundColor: COLORS.neutralDark,
                  borderRadius: 4,
                  p: 2,
                  position: 'relative',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                }}>
                  <Box sx={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: COLORS.neutralLight,
                    borderRadius: 2,
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    {/* Mock app interface */}
                    <Box sx={{
                      height: '60px',
                      backgroundColor: COLORS.primaryBrand,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 600
                    }}>
                      Gawulo
                    </Box>
                    <Box sx={{ p: 2 }}>
                      <Typography variant="h6" sx={{ mb: 2, color: COLORS.primaryBrand }}>
                        Local Vendors
                      </Typography>
                      {[1, 2, 3].map((item) => (
                        <Box key={item} sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: 2,
                          p: 1,
                          backgroundColor: 'white',
                          borderRadius: 1,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                          <Box sx={{
                            width: 40,
                            height: 40,
                            backgroundColor: COLORS.secondary,
                            borderRadius: '50%',
                            mr: 2
                          }} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Vendor {item}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'gray' }}>
                              ⭐ 4.{item} • 2km away
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Trust-Building Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Typography 
          variant="h3" 
          component="h2" 
          align="center" 
          sx={{ 
            mb: 6,
            color: COLORS.primaryBrand,
            fontWeight: 700,
            fontSize: { xs: '2rem', md: '2.5rem' }
          }}
        >
          Why Choose Gawulo?
        </Typography>
        <Grid container spacing={4}>
          {trustFeatures.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{
                height: '100%',
                textAlign: 'center',
                p: 3,
                borderRadius: 3,
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)'
                }
              }}>
                <CardContent>
                  <Box sx={{ mb: 3 }}>
                    {feature.icon}
                  </Box>
                  <Typography 
                    variant="h5" 
                    component="h3" 
                    sx={{ 
                      mb: 2,
                      color: COLORS.primaryBrand,
                      fontWeight: 600
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: 'gray.600',
                      lineHeight: 1.6
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Feature Highlight Section */}
      <Box sx={{ 
        backgroundColor: COLORS.secondaryYellow,
        py: { xs: 6, md: 8 }
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h3" 
                component="h2" 
                sx={{ 
                  mb: 4,
                  color: COLORS.primaryBrand,
                  fontWeight: 700,
                  fontSize: { xs: '2rem', md: '2.5rem' }
                }}
              >
                Simple & User-Friendly
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 4,
                  color: COLORS.neutralDark,
                  lineHeight: 1.6
                }}
              >
                Our app is designed with you in mind. Easy navigation, clear language, and touch-friendly buttons make ordering food simple for everyone.
              </Typography>
              <Stack spacing={2}>
                {appFeatures.map((feature, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ mr: 2 }}>
                      {feature.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: COLORS.primaryBrand }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: COLORS.neutralDark }}>
                        {feature.description}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                position: 'relative'
              }}>
                {/* Feature mockup */}
                <Box sx={{
                  width: { xs: 300, md: 350 },
                  height: { xs: 600, md: 700 },
                  backgroundColor: 'white',
                  borderRadius: 3,
                  p: 3,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                  position: 'relative'
                }}>
                  <Box sx={{
                    height: '50px',
                    backgroundColor: COLORS.primaryAction,
                    borderRadius: 2,
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 600
                  }}>
                    Order Details
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: COLORS.primaryBrand }}>
                      Your Order
                    </Typography>
                    {['Chicken Curry', 'Rice', 'Coke'].map((item, index) => (
                      <Box key={index} sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1,
                        borderBottom: '1px solid #eee'
                      }}>
                        <Typography variant="body1">{item}</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          R{25 + index * 5}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{
                    backgroundColor: COLORS.secondary,
                    color: 'white',
                    p: 2,
                    borderRadius: 2,
                    textAlign: 'center',
                    fontWeight: 600
                  }}>
                    Total: R35
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Call-to-Action Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Box sx={{ 
          textAlign: 'center',
          backgroundColor: COLORS.primaryBrand,
          color: 'white',
          borderRadius: 4,
          p: { xs: 4, md: 6 },
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Typography 
            variant="h3" 
            component="h2" 
            sx={{ 
              mb: 3,
              fontWeight: 700,
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
            Ready to Get Started?
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 4,
              opacity: 0.9,
              maxWidth: 600,
              mx: 'auto'
            }}
          >
            Download the Gawulo app today and start supporting local vendors in your community. 
            Order offline, save money, and enjoy delicious food delivered to your doorstep.
          </Typography>
          
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                sx={{
                  backgroundColor: COLORS.primaryAction,
                  color: 'white',
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: '#E55A2B'
                  }
                }}
                startIcon={<PhoneAndroid />}
              >
                Download for Android
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                sx={{
                  backgroundColor: COLORS.secondary,
                  color: 'white',
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: '#006B7A'
                  }
                }}
                startIcon={<QrCode2 />}
              >
                Scan QR Code
              </Button>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4 }}>
            <Chip 
              label="No registration fees • No hidden costs • 100% local" 
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontSize: '0.9rem'
              }} 
            />
          </Box>
        </Box>
      </Container>

      {/* Footer */}
      <Box sx={{ 
        backgroundColor: COLORS.neutralDark,
        color: 'white',
        py: 4,
        textAlign: 'center'
      }}>
        <Container maxWidth="lg">
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            © 2024 Gawulo. Empowering local vendors, connecting communities.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
