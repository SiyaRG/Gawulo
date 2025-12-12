import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Lock,
  Visibility,
  VerifiedUser,
  ArrowForward,
} from '@mui/icons-material';

// Trust as a Service brand colors
const BRAND_COLORS = {
  primary: '#27AE60', // Vibrant Green
  accent: '#E3AD4D', // Gold/Yellow-Orange
  lightBg: '#FDF9F3', // Creamy Off-White
  darkText: '#333333', // Dark Gray
  white: '#FFFFFF', // Pure White
};

const LandingPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  
  // Refs for scroll animations
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const missionRef = useRef<HTMLDivElement>(null);
  
  // State for animation triggers
  const [isVisible, setIsVisible] = useState({
    hero: false,
    features: false,
    services: false,
    mission: false,
  });

  // Animate hero section on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible((prev) => ({ ...prev, hero: true }));
    }, 100); // Small delay for smooth animation on load

    return () => clearTimeout(timer);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    const createObserver = (ref: React.RefObject<HTMLDivElement>, key: keyof typeof isVisible) => {
      if (!ref.current) return;
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible((prev) => ({ ...prev, [key]: true }));
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
      );
      
      observer.observe(ref.current);
      observers.push(observer);
    };

    // Don't observe hero - it animates on load
    createObserver(featuresRef, 'features');
    createObserver(servicesRef, 'services');
    createObserver(missionRef, 'mission');

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  const trustFeatures = [
    {
      icon: <Lock sx={{ fontSize: 40 }} />,
      title: 'Inherently Secure',
      description: 'Built-in protections and verified identity layers ensure every transaction is protected from end to end.',
      borderColor: BRAND_COLORS.primary,
    },
    {
      icon: <Visibility sx={{ fontSize: 40 }} />,
      title: 'Completely Transparent',
      description: 'All participants have a single, truthful view of the data, eliminating disputes and ensuring clarity.',
      borderColor: BRAND_COLORS.accent,
    },
    {
      icon: <VerifiedUser sx={{ fontSize: 40 }} />,
      title: 'Unwavering Trust',
      description: 'Our foundation operates on verified, immutable certainty, removing economic risk for local businesses and consumers.',
      borderColor: BRAND_COLORS.primary,
    },
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: BRAND_COLORS.lightBg,
      color: BRAND_COLORS.darkText,
      width: '100%',
      overflowX: 'hidden',
    }}>
      {/* Hero Section: Focused on Vision & Certainty */}
      <Box 
        ref={heroRef}
        sx={{
          background: `linear-gradient(180deg, ${BRAND_COLORS.lightBg} 0%, ${BRAND_COLORS.white} 100%)`,
          py: { xs: 8, md: 16 },
          mt: -3, // Compensate for Layout padding
          width: '100%',
          opacity: isVisible.hero ? 1 : 0,
          transform: isVisible.hero ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 3, sm: 4, md: 6 } }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h1" 
              component="h1" 
              sx={{ 
                fontWeight: 800,
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
                mb: 2,
                lineHeight: 1.2,
                color: BRAND_COLORS.darkText,
                letterSpacing: '-0.02em',
              }}
            >
              Trust as a Service.{' '}
              <Box component="span" sx={{ color: BRAND_COLORS.primary, display: { xs: 'block', sm: 'inline' } }}>
                Verifiable Certainty.
              </Box>
            </Typography>
            
            {/* Vision as Subtitle */}
            <Typography 
              variant="h5" 
              sx={{ 
                mt: 3,
                mb: 4,
                maxWidth: { xs: '100%', sm: '90%', md: '800px' },
                mx: 'auto',
                fontSize: { xs: '1.1rem', md: '1.5rem' },
                color: '#666666',
                lineHeight: 1.6,
                px: { xs: 2, sm: 0 },
              }}
            >
              To be the undisputed global standard for digital trust, empowering a world where every transaction is inherently secure and transparent.
            </Typography>

            {/* Call to Action */}
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              justifyContent="center"
              sx={{ mt: 4 }}
            >
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/register')}
                sx={{
                  backgroundColor: BRAND_COLORS.primary,
                  color: BRAND_COLORS.white,
                  px: 5,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: '9999px',
                  boxShadow: '0 0 40px -10px rgba(39, 174, 96, 0.5)',
                  '&:hover': {
                    backgroundColor: '#1E7D47',
                    transform: 'scale(1.05)',
                    transition: 'all 0.3s ease',
                  },
                }}
              >
                Get Started Free
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/login')}
                sx={{
                  borderColor: BRAND_COLORS.accent,
                  borderWidth: 2,
                  color: BRAND_COLORS.darkText,
                  px: 5,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: '9999px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  '&:hover': {
                    backgroundColor: `${BRAND_COLORS.accent}33`,
                    borderColor: BRAND_COLORS.accent,
                    borderWidth: 2,
                  },
                }}
              >
                Sign In
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>
      
      {/* Key Selling Points/Mission Section */}
      <Box 
        ref={featuresRef}
        sx={{ 
          backgroundColor: BRAND_COLORS.white, 
          py: { xs: 8, md: 12 }, 
          width: '100%',
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 3, sm: 4, md: 6 } }}>
          <Typography 
            variant="h2" 
            component="h2" 
            align="center" 
            sx={{ 
              mb: 8,
              fontWeight: 800,
              fontSize: { xs: '2rem', md: '2.5rem' },
              color: BRAND_COLORS.darkText,
              opacity: isVisible.features ? 1 : 0,
              transform: isVisible.features ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.8s ease-out 0.2s, transform 0.8s ease-out 0.2s',
            }}
          >
            The Foundational Digital Infrastructure
          </Typography>
          
          <Grid container spacing={4}>
            {trustFeatures.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: 4,
                  backgroundColor: BRAND_COLORS.lightBg,
                  borderRadius: 3,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  borderTop: `4px solid ${feature.borderColor}`,
                  transition: 'transform 0.3s ease, opacity 0.6s ease-out, box-shadow 0.3s ease',
                  opacity: isVisible.features ? 1 : 0,
                  transform: isVisible.features ? 'translateY(0)' : 'translateY(30px)',
                  transitionDelay: `${index * 0.15}s`,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 12px rgba(0,0,0,0.15)',
                  }
                }}>
                  <CardContent>
                    <Box sx={{ 
                      color: feature.borderColor,
                      mb: 3,
                      display: 'flex',
                      justifyContent: 'center',
                    }}>
                      {feature.icon}
                    </Box>
                    <Typography 
                      variant="h5" 
                      component="h3" 
                      sx={{ 
                        mb: 2,
                        fontWeight: 700,
                        color: BRAND_COLORS.darkText,
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: '#666666',
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
      </Box>

      {/* Services Section */}
      <Box 
        ref={servicesRef}
        id="features" 
        sx={{ 
          backgroundColor: BRAND_COLORS.lightBg, 
          py: { xs: 8, md: 12 }, 
          width: '100%',
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 3, sm: 4, md: 6 } }}>
          <Typography 
            variant="h2" 
            component="h2" 
            align="center" 
            sx={{ 
              mb: 8,
              fontWeight: 800,
              fontSize: { xs: '2rem', md: '2.5rem' },
              color: BRAND_COLORS.darkText,
              opacity: isVisible.services ? 1 : 0,
              transform: isVisible.services ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.8s ease-out 0.2s, transform 0.8s ease-out 0.2s',
            }}
          >
            Our Services
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6} lg={4}>
              <Card sx={{
                height: '100%',
                textAlign: 'center',
                p: 4,
                backgroundColor: BRAND_COLORS.white,
                borderRadius: 3,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                borderTop: `4px solid ${BRAND_COLORS.primary}`,
                transition: 'transform 0.3s ease, opacity 0.6s ease-out, box-shadow 0.3s ease',
                cursor: 'pointer',
                opacity: isVisible.services ? 1 : 0,
                transform: isVisible.services ? 'translateY(0)' : 'translateY(30px)',
                transitionDelay: '0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 12px rgba(0,0,0,0.15)',
                }
              }}
              onClick={() => navigate('/services')}
              >
                <CardContent>
                  <Box sx={{ 
                    color: BRAND_COLORS.primary,
                    mb: 3,
                    display: 'flex',
                    justifyContent: 'center',
                  }}>
                    <VerifiedUser sx={{ fontSize: 48 }} />
                  </Box>
                  <Typography 
                    variant="h5" 
                    component="h3" 
                    sx={{ 
                      mb: 2,
                      fontWeight: 700,
                      color: BRAND_COLORS.darkText,
                    }}
                  >
                    TrustTrack
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: '#666666',
                      lineHeight: 1.6
                    }}
                  >
                    The first tangible embodiment of Trust as a Service. Verifiable order tracking with immutable audit trails, verified vendor profiles, and transparent transaction history.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Mission statement as testimonial/proof */}
      <Box 
        ref={missionRef}
        sx={{ 
          py: { xs: 8, md: 12 },
          backgroundColor: BRAND_COLORS.lightBg,
          width: '100%',
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 3, sm: 4, md: 6 } }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                color: BRAND_COLORS.accent,
                mb: 3,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                opacity: isVisible.mission ? 1 : 0,
                transform: isVisible.mission ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.8s ease-out 0.2s, transform 0.8s ease-out 0.2s',
              }}
            >
              Our Commitment
            </Typography>
            <Box sx={{ 
              position: 'relative', 
              px: { xs: 2, sm: 3, md: 4 },
              opacity: isVisible.mission ? 1 : 0,
              transform: isVisible.mission ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.8s ease-out 0.4s, transform 0.8s ease-out 0.4s',
            }}>
              <Typography 
                variant="h4" 
                component="blockquote"
                sx={{ 
                  fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
                  fontWeight: 300,
                  fontStyle: 'italic',
                  color: BRAND_COLORS.darkText,
                  lineHeight: 1.6,
                  position: 'relative',
                }}
              >
                <Box
                  component="span"
                  sx={{
                    fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                    lineHeight: 1,
                    display: 'inline-block',
                    verticalAlign: 'top',
                    color: BRAND_COLORS.accent,
                    fontFamily: 'Georgia, serif',
                    mr: { xs: 0.5, sm: 1 },
                    mt: { xs: '-0.1em', sm: '-0.15em' },
                  }}
                >
                  &ldquo;
                </Box>
                <Box 
                  component="span" 
                  sx={{ 
                    display: 'inline',
                  }}
                >
                  To build and operate the foundational, verified digital infrastructure—"Trust as a Service" (TaaS)—that eliminates economic uncertainty, enabling transparent and trustworthy transactions for local businesses and consumers.
                </Box>
                <Box
                  component="span"
                  sx={{
                    fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                    lineHeight: 1,
                    display: 'inline-block',
                    verticalAlign: 'bottom',
                    color: BRAND_COLORS.accent,
                    fontFamily: 'Georgia, serif',
                    ml: { xs: 0.5, sm: 1 },
                    mb: { xs: '-0.2em', sm: '-0.3em' },
                  }}
                >
                  &rdquo;
                </Box>
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ 
        backgroundColor: BRAND_COLORS.darkText,
        color: BRAND_COLORS.white,
        py: 4,
        textAlign: 'center',
        width: '100%',
      }}>
        <Container maxWidth="xl" sx={{ px: { xs: 3, sm: 4, md: 6 } }}>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            © 2025 Trust as a Service (TaaS). All rights reserved.
          </Typography>
          <Stack 
            direction="row" 
            spacing={2} 
            justifyContent="center" 
            sx={{ mt: 2 }}
          >
            <Button 
              variant="text" 
              sx={{ 
                color: 'rgba(255,255,255,0.7)',
                '&:hover': { color: BRAND_COLORS.primary }
              }}
            >
              Privacy Policy
            </Button>
            <Button 
              variant="text" 
              sx={{ 
                color: 'rgba(255,255,255,0.7)',
                '&:hover': { color: BRAND_COLORS.primary }
              }}
            >
              Terms of Use
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
