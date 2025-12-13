import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  VerifiedUser,
  Search,
  TrackChanges,
  Business,
  Security,
  Visibility,
  CheckCircle,
} from '@mui/icons-material';

// Trust as a Service brand colors
const BRAND_COLORS = {
  primary: '#27AE60', // Vibrant Green
  accent: '#E3AD4D', // Gold/Yellow-Orange
  lightBg: '#FDF9F3', // Creamy Off-White
  darkText: '#333333', // Dark Gray
  white: '#FFFFFF', // Pure White
};

const Services: React.FC = () => {
  const navigate = useNavigate();
  
  // Refs for scroll animations
  const headerRef = useRef<HTMLDivElement>(null);
  const trustTrackRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);
  const principlesRef = useRef<HTMLDivElement>(null);
  
  // State for animation triggers
  const [isVisible, setIsVisible] = useState({
    header: false,
    trustTrack: false,
    features: false,
    benefits: false,
    principles: false,
  });

  // Animate header section on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible((prev) => ({ ...prev, header: true }));
    }, 100);

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

    createObserver(trustTrackRef, 'trustTrack');
    createObserver(featuresRef, 'features');
    createObserver(benefitsRef, 'benefits');
    createObserver(principlesRef, 'principles');

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  const trustTrackFeatures = [
    {
      icon: <Search sx={{ fontSize: 32, color: BRAND_COLORS.primary }} />,
      title: 'Vendor Discovery',
      description: 'Search and discover verified local vendors with validated identity data. Every vendor profile displays their verification status prominently, eliminating uncertainty over business legitimacy.',
    },
    {
      icon: <TrackChanges sx={{ fontSize: 32, color: BRAND_COLORS.primary }} />,
      title: 'Verifiable Tracking',
      description: 'Real-time order tracking with an immutable audit trail. Access your order status via unique Order UID and view chronological, time-stamped entries from the OrderStatusHistory.',
    },
    {
      icon: <Business sx={{ fontSize: 32, color: BRAND_COLORS.primary }} />,
      title: 'Business Confirmation',
      description: 'Vendor dashboard for secure status updates. Authenticated vendors can trigger status changes (e.g., "Ready for Pickup") which create new time-stamped entries in the verifiable log.',
    },
  ];

  const trustTrackBenefits = [
    'Eliminates informational asymmetry',
    'Provides single source of truth for all transactions',
    'Ensures actions are tied to verified actors',
    'Builds reputation on completed, auditable transactions',
    'Creates verifiable and transparent local commerce',
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: BRAND_COLORS.lightBg,
      color: BRAND_COLORS.darkText,
      pb: 8,
    }}>
      <Container maxWidth="xl" sx={{ px: { xs: 3, sm: 4, md: 6 } }}>
        {/* Header */}
        <Box 
          ref={headerRef}
          sx={{ 
            mb: 8, 
            pt: 4,
            opacity: isVisible.header ? 1 : 0,
            transform: isVisible.header ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
          }}
        >
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '2rem', md: '3rem' },
              color: BRAND_COLORS.darkText,
              mb: 2,
            }}
          >
            Our Services
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#666666',
              maxWidth: '800px',
              lineHeight: 1.6,
            }}
          >
            Trust as a Service (TaaS) solutions designed to create verifiable and transparent digital infrastructure for local commerce.
          </Typography>
        </Box>

        {/* TrustTrack Section */}
        <Box 
          ref={trustTrackRef}
          sx={{ 
            mb: 8,
            opacity: isVisible.trustTrack ? 1 : 0,
            transform: isVisible.trustTrack ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s ease-out 0.2s, transform 0.8s ease-out 0.2s',
          }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.75rem', md: '2.25rem' },
                color: BRAND_COLORS.darkText,
                mb: 1,
              }}
            >
              TrustTrack
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: BRAND_COLORS.accent,
                fontWeight: 600,
                mb: 3,
                fontSize: { xs: '1rem', md: '1.1rem' },
              }}
            >
              The first tangible embodiment of Trust as a Service
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: BRAND_COLORS.darkText,
                lineHeight: 1.8,
                fontSize: '0.84rem',
                mb: 4,
                maxWidth: '900px',
              }}
            >
              TrustTrack is our MVP platform that brings the "Trust as a Service" vision to life. 
              It focuses on creating a verifiable and transparent local commerce platform with 
              immutable audit trails, verified vendor profiles, and real-time order tracking.
            </Typography>
          </Box>
          
          <Card sx={{
            backgroundColor: BRAND_COLORS.white,
            borderRadius: 3,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            borderTop: `4px solid ${BRAND_COLORS.primary}`,
          }}>

            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              {/* Core Features */}
              <Box ref={featuresRef}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: BRAND_COLORS.darkText,
                    mb: 3,
                    mt: 2,
                    opacity: isVisible.features ? 1 : 0,
                    transform: isVisible.features ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'opacity 0.8s ease-out 0.2s, transform 0.8s ease-out 0.2s',
                  }}
                >
                  Core Features
                </Typography>
                <Grid container spacing={4} sx={{ mb: 4 }}>
                  {trustTrackFeatures.map((feature, index) => (
                    <Grid item xs={12} md={4} key={index}>
                      <Box sx={{
                        p: 3,
                        backgroundColor: BRAND_COLORS.lightBg,
                        borderRadius: 2,
                        height: '100%',
                        border: `1px solid ${BRAND_COLORS.primary}20`,
                        opacity: isVisible.features ? 1 : 0,
                        transform: isVisible.features ? 'translateY(0)' : 'translateY(30px)',
                        transition: `opacity 0.6s ease-out ${index * 0.15}s, transform 0.6s ease-out ${index * 0.15}s`,
                      }}>
                      <Box sx={{ mb: 2 }}>
                        {feature.icon}
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: BRAND_COLORS.darkText,
                          mb: 1.5,
                        }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#666666',
                          lineHeight: 1.7,
                        }}
                      >
                        {feature.description}
                      </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Divider sx={{ my: 4 }} />

              {/* Benefits */}
              <Box ref={benefitsRef}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: BRAND_COLORS.darkText,
                    mb: 3,
                    opacity: isVisible.benefits ? 1 : 0,
                    transform: isVisible.benefits ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'opacity 0.8s ease-out 0.2s, transform 0.8s ease-out 0.2s',
                  }}
                >
                  Trust Value Delivered
                </Typography>
                <List>
                  {trustTrackBenefits.map((benefit, index) => (
                    <ListItem 
                      key={index} 
                      sx={{ 
                        px: 0,
                        opacity: isVisible.benefits ? 1 : 0,
                        transform: isVisible.benefits ? 'translateX(0)' : 'translateX(-20px)',
                        transition: `opacity 0.6s ease-out ${index * 0.1}s, transform 0.6s ease-out ${index * 0.1}s`,
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <CheckCircle sx={{ color: BRAND_COLORS.primary }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={benefit}
                        primaryTypographyProps={{
                          sx: {
                            color: BRAND_COLORS.darkText,
                            fontSize: '0.84rem',
                          },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>

              {/* CTA */}
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{
                    backgroundColor: BRAND_COLORS.primary,
                    color: BRAND_COLORS.white,
                    px: 5,
                    py: 1.5,
                    fontSize: '0.88rem',
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
                  Get Started with TrustTrack
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Trust Principles Section */}
        <Box 
          ref={principlesRef}
          sx={{ mt: 8 }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: BRAND_COLORS.darkText,
              mb: 4,
              textAlign: 'center',
              opacity: isVisible.principles ? 1 : 0,
              transform: isVisible.principles ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.8s ease-out 0.2s, transform 0.8s ease-out 0.2s',
            }}
          >
            Built on Trust Principles
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{
                p: 3,
                backgroundColor: BRAND_COLORS.white,
                borderRadius: 2,
                borderTop: `4px solid ${BRAND_COLORS.primary}`,
                height: '100%',
                opacity: isVisible.principles ? 1 : 0,
                transform: isVisible.principles ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 0.6s ease-out 0.3s, transform 0.6s ease-out 0.3s',
              }}>
                <Security sx={{ fontSize: 40, color: BRAND_COLORS.primary, mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Validated Identity
                </Typography>
                <Typography variant="body2" sx={{ color: '#666666' }}>
                  Ensures actions are tied to verified actors, eliminating uncertainty over business legitimacy.
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{
                p: 3,
                backgroundColor: BRAND_COLORS.white,
                borderRadius: 2,
                borderTop: `4px solid ${BRAND_COLORS.accent}`,
                height: '100%',
                opacity: isVisible.principles ? 1 : 0,
                transform: isVisible.principles ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 0.6s ease-out 0.45s, transform 0.6s ease-out 0.45s',
              }}>
                <Visibility sx={{ fontSize: 40, color: BRAND_COLORS.accent, mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Verifiable Certainty
                </Typography>
                <Typography variant="body2" sx={{ color: '#666666' }}>
                  Provides a single, immutable source of truth for all transactions with complete transparency.
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{
                p: 3,
                backgroundColor: BRAND_COLORS.white,
                borderRadius: 2,
                borderTop: `4px solid ${BRAND_COLORS.primary}`,
                height: '100%',
                opacity: isVisible.principles ? 1 : 0,
                transform: isVisible.principles ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 0.6s ease-out 0.6s, transform 0.6s ease-out 0.6s',
              }}>
                <CheckCircle sx={{ fontSize: 40, color: BRAND_COLORS.primary, mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Verifiable Authenticity
                </Typography>
                <Typography variant="body2" sx={{ color: '#666666' }}>
                  Ensures reputation is built on completed, auditable transactions with authentic ratings.
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default Services;

