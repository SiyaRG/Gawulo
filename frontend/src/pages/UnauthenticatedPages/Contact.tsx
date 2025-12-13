import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Email,
  Send,
} from '@mui/icons-material';
import AlertMessage from '../../components/AlertMessage';

// Trust as a Service brand colors
const BRAND_COLORS = {
  primary: '#27AE60', // Vibrant Green
  accent: '#E3AD4D', // Gold/Yellow-Orange
  lightBg: '#FDF9F3', // Creamy Off-White
  darkText: '#333333', // Dark Gray
  white: '#FFFFFF', // Pure White
};

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission (no actual implementation)
    setTimeout(() => {
      setIsSubmitting(false);
      setAlertMessage('Thank you for your message! We will get back to you soon.');
      setAlertSeverity('success');
      setAlertOpen(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    }, 1000);
  };

  const handleAlertClose = () => {
    setAlertOpen(false);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: BRAND_COLORS.lightBg,
      color: BRAND_COLORS.darkText,
      pb: 8,
    }}>
      <Container maxWidth="md" sx={{ px: { xs: 3, sm: 4, md: 6 } }}>
        {/* Header */}
        <Box sx={{ mb: 6, pt: 4, textAlign: 'center' }}>
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
            Contact Us
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#666666',
              maxWidth: '600px',
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            Have a question or want to learn more about Trust as a Service? We'd love to hear from you.
          </Typography>
        </Box>

        {/* Contact Form */}
        <Card sx={{
          backgroundColor: BRAND_COLORS.white,
          borderRadius: 3,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          borderTop: `4px solid ${BRAND_COLORS.primary}`,
        }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box sx={{
                backgroundColor: BRAND_COLORS.primary,
                borderRadius: 2,
                p: 1.5,
                mr: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Email sx={{ fontSize: 32, color: BRAND_COLORS.white }} />
              </Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: BRAND_COLORS.darkText,
                }}
              >
                Send us a Message
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Your Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    variant="outlined"
                    disabled={isSubmitting}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: BRAND_COLORS.primary,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: BRAND_COLORS.primary,
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="email"
                    label="Your Email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    variant="outlined"
                    disabled={isSubmitting}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: BRAND_COLORS.primary,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: BRAND_COLORS.primary,
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    variant="outlined"
                    disabled={isSubmitting}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: BRAND_COLORS.primary,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: BRAND_COLORS.primary,
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    multiline
                    rows={6}
                    label="Your Message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    variant="outlined"
                    disabled={isSubmitting}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: BRAND_COLORS.primary,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: BRAND_COLORS.primary,
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
                >
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isSubmitting}
                    startIcon={<Send />}
                    sx={{
                      backgroundColor: BRAND_COLORS.primary,
                      color: BRAND_COLORS.white,
                      marginLeft: 'auto',
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
                      '&:disabled': {
                        backgroundColor: BRAND_COLORS.primary,
                        opacity: 0.7,
                      },
                    }}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>

        {/* Additional Contact Information */}
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography
            variant="body1"
            sx={{
              color: '#666666',
              mb: 2,
            }}
          >
            For urgent inquiries, please reach out directly through our platform.
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: BRAND_COLORS.accent,
              fontWeight: 600,
            }}
          >
            Trust as a Service. Verifiable Certainty.
          </Typography>
        </Box>
      </Container>

      {/* Alert Message */}
      <AlertMessage
        open={alertOpen}
        message={alertMessage}
        severity={alertSeverity}
        onClose={handleAlertClose}
        duration={5000}
      />
    </Box>
  );
};

export default Contact;

