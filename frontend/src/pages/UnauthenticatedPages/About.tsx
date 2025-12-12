import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider,
} from '@mui/material';

// Trust as a Service brand colors
const BRAND_COLORS = {
  primary: '#27AE60', // Vibrant Green
  accent: '#E3AD4D', // Gold/Yellow-Orange
  lightBg: '#FDF9F3', // Creamy Off-White
  darkText: '#333333', // Dark Gray
  white: '#FFFFFF', // Pure White
};

const About: React.FC = () => {
  // Refs for scroll animations
  const headerRef = useRef<HTMLDivElement>(null);
  const visionRef = useRef<HTMLDivElement>(null);
  const missionRef = useRef<HTMLDivElement>(null);
  const approachRef = useRef<HTMLDivElement>(null);
  const foundersRef = useRef<HTMLDivElement>(null);
  
  // State for animation triggers
  const [isVisible, setIsVisible] = useState({
    header: false,
    vision: false,
    mission: false,
    approach: false,
    founders: false,
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

    createObserver(visionRef, 'vision');
    createObserver(missionRef, 'mission');
    createObserver(approachRef, 'approach');
    createObserver(foundersRef, 'founders');

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  const founders = [
    {
      name: 'Mr Lerato Letsheleha',
      role: 'CPO',
      placeholder: 'LL',
      quote: 'Every transaction should be a building block of trust. We are creating the infrastructure that makes this possible for local businesses and communities.',
    },
    {
      name: 'Mr Siyabonga Soko',
      role: 'CTO / Chairman',
      placeholder: 'SS',
      quote: 'Trust is not given, it is built through verifiable actions and transparent processes. Our mission is to make trust the default, not the exception.',
    },
    {
      name: 'Clarks Mahalangu',
      role: 'Co-Founder',
      placeholder: 'CM',
      quote: 'Digital trust is the foundation of modern commerce. We are building the tools that eliminate uncertainty and empower transparent transactions.',
    },
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
            About Us
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#666666',
              maxWidth: '800px',
              lineHeight: 1.6,
              mb: 3,
            }}
          >
            Building the foundational digital infrastructure for trust and transparency in local commerce.
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: BRAND_COLORS.darkText,
              maxWidth: '900px',
              lineHeight: 1.8,
              fontSize: '1.05rem',
            }}
          >
            ReachHub was founded on the principle that trust should be inherent in every digital transaction. 
            We recognized that local businesses and consumers face significant challenges when it comes to verifying 
            identities, tracking transactions, and building authentic relationships in the digital marketplace. 
            Our platform, TrustTrack, represents the first tangible embodiment of our "Trust as a Service" vision—a 
            comprehensive solution that eliminates economic uncertainty through verifiable, transparent, and immutable 
            digital infrastructure.
          </Typography>
        </Box>

        {/* Vision Section */}
        <Box 
          ref={visionRef}
          sx={{ 
            mb: 8,
            opacity: isVisible.vision ? 1 : 0,
            transform: isVisible.vision ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s ease-out 0.2s, transform 0.8s ease-out 0.2s',
          }}
        >
          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              color: BRAND_COLORS.darkText,
              mb: 3,
            }}
          >
            Vision
          </Typography>
          <Card sx={{
            backgroundColor: BRAND_COLORS.white,
            borderRadius: 3,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            borderTop: `4px solid ${BRAND_COLORS.primary}`,
            p: { xs: 3, md: 4 },
          }}>
            <Typography
              variant="body1"
              sx={{
                color: BRAND_COLORS.darkText,
                lineHeight: 1.8,
                fontSize: { xs: '1rem', md: '1.1rem' },
                mb: 3,
              }}
            >
              To be the undisputed global standard for digital trust, empowering a world where every transaction is inherently secure, transparent, and built on verifiable certainty.
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#666666',
                lineHeight: 1.7,
                fontStyle: 'italic',
              }}
            >
              We envision a future where businesses and consumers can engage in commerce with complete confidence, 
              knowing that every interaction is verified, every transaction is transparent, and every relationship 
              is built on an immutable foundation of trust. Our platform serves as the digital infrastructure that 
              makes this vision a reality, starting with local commerce and expanding to become the global standard 
              for trusted digital transactions.
            </Typography>
          </Card>
        </Box>

        {/* Mission Section */}
        <Box 
          ref={missionRef}
          sx={{ 
            mb: 8,
            opacity: isVisible.mission ? 1 : 0,
            transform: isVisible.mission ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s ease-out 0.2s, transform 0.8s ease-out 0.2s',
          }}
        >
          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              color: BRAND_COLORS.darkText,
              mb: 3,
            }}
          >
            Mission
          </Typography>
          <Card sx={{
            backgroundColor: BRAND_COLORS.white,
            borderRadius: 3,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            borderTop: `4px solid ${BRAND_COLORS.accent}`,
            p: { xs: 3, md: 4 },
          }}>
            <Typography
              variant="body1"
              sx={{
                color: BRAND_COLORS.darkText,
                lineHeight: 1.8,
                fontSize: { xs: '1rem', md: '1.1rem' },
                mb: 3,
              }}
            >
              To build and operate the foundational, verified digital infrastructure—"Trust as a Service" (TaaS)—that eliminates economic uncertainty, enabling transparent and trustworthy transactions for local businesses and consumers.
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#666666',
                lineHeight: 1.7,
              }}
            >
              Our mission is realized through TrustTrack, our MVP platform that provides verifiable order tracking, 
              validated vendor profiles, and immutable transaction histories. We are committed to creating technology 
              that serves as a public good—infrastructure that anyone can trust, verify, and rely upon. By eliminating 
              informational asymmetry and providing a single source of truth for all transactions, we empower local 
              businesses to build authentic reputations and enable consumers to make informed decisions with complete confidence.
            </Typography>
          </Card>
        </Box>

        {/* Our Approach Section */}
        <Box 
          ref={approachRef}
          sx={{ 
            mb: 8,
          }}
        >
          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              color: BRAND_COLORS.darkText,
              mb: 3,
              opacity: isVisible.approach ? 1 : 0,
              transform: isVisible.approach ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.8s ease-out 0.2s, transform 0.8s ease-out 0.2s',
            }}
          >
            Our Approach
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{
                backgroundColor: BRAND_COLORS.white,
                borderRadius: 3,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                borderTop: `4px solid ${BRAND_COLORS.primary}`,
                p: 3,
                height: '100%',
                opacity: isVisible.approach ? 1 : 0,
                transform: isVisible.approach ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 0.6s ease-out 0.3s, transform 0.6s ease-out 0.3s',
              }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: BRAND_COLORS.darkText,
                    mb: 2,
                  }}
                >
                  Verifiable Certainty
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#666666',
                    lineHeight: 1.7,
                  }}
                >
                  Every transaction is recorded in an immutable audit trail, ensuring a single source of truth that cannot be altered or disputed.
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{
                backgroundColor: BRAND_COLORS.white,
                borderRadius: 3,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                borderTop: `4px solid ${BRAND_COLORS.accent}`,
                p: 3,
                height: '100%',
                opacity: isVisible.approach ? 1 : 0,
                transform: isVisible.approach ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 0.6s ease-out 0.45s, transform 0.6s ease-out 0.45s',
              }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: BRAND_COLORS.darkText,
                    mb: 2,
                  }}
                >
                  Complete Transparency
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#666666',
                    lineHeight: 1.7,
                  }}
                >
                  All participants have access to the same verified information, eliminating informational asymmetry and building mutual trust.
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{
                backgroundColor: BRAND_COLORS.white,
                borderRadius: 3,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                borderTop: `4px solid ${BRAND_COLORS.primary}`,
                p: 3,
                height: '100%',
                opacity: isVisible.approach ? 1 : 0,
                transform: isVisible.approach ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 0.6s ease-out 0.6s, transform 0.6s ease-out 0.6s',
              }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: BRAND_COLORS.darkText,
                    mb: 2,
                  }}
                >
                  Validated Identity
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#666666',
                    lineHeight: 1.7,
                  }}
                >
                  Every action is tied to a verified actor, ensuring that businesses and consumers can trust the authenticity of every interaction.
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 6 }} />

        {/* Founders Section */}
        <Box 
          ref={foundersRef}
        >
          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              color: BRAND_COLORS.darkText,
              mb: 4,
              textAlign: 'center',
              opacity: isVisible.founders ? 1 : 0,
              transform: isVisible.founders ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.8s ease-out 0.2s, transform 0.8s ease-out 0.2s',
            }}
          >
            Our Founders
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            {founders.map((founder, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{
                  backgroundColor: BRAND_COLORS.white,
                  borderRadius: 3,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  textAlign: 'center',
                  p: 4,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.3s ease, opacity 0.6s ease-out, box-shadow 0.3s ease',
                  opacity: isVisible.founders ? 1 : 0,
                  transform: isVisible.founders ? 'translateY(0)' : 'translateY(30px)',
                  transitionDelay: `${index * 0.15}s`,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 12px rgba(0,0,0,0.15)',
                  }
                }}>
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Avatar
                      sx={{
                        width: { xs: 120, md: 150 },
                        height: { xs: 120, md: 150 },
                        mx: 'auto',
                        mb: 3,
                        backgroundColor: BRAND_COLORS.primary,
                        fontSize: { xs: '3rem', md: '4rem' },
                        fontWeight: 700,
                      }}
                    >
                      {founder.placeholder}
                    </Avatar>
                    <Typography
                      variant="h5"
                      component="h3"
                      sx={{
                        fontWeight: 700,
                        color: BRAND_COLORS.darkText,
                        mb: 1,
                      }}
                    >
                      {founder.name}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        color: BRAND_COLORS.accent,
                        fontWeight: 600,
                        fontSize: '1rem',
                        mb: 3,
                      }}
                    >
                      {founder.role}
                    </Typography>
                    <Box sx={{
                      mt: 'auto',
                      pt: 3,
                      borderTop: `1px solid ${BRAND_COLORS.primary}20`,
                      position: 'relative',
                      px: { xs: 2, sm: 3, md: 4 },
                    }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: BRAND_COLORS.darkText,
                          lineHeight: 1.7,
                          fontStyle: 'italic',
                          fontSize: '0.95rem',
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            fontSize: { xs: '2rem', sm: '2.5rem' },
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
                        <Box component="span" sx={{ display: 'inline' }}>
                          {founder.quote}
                        </Box>
                        <Box
                          component="span"
                          sx={{
                            fontSize: { xs: '2rem', sm: '2.5rem' },
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
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default About;

