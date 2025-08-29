import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Grid,
} from '@mui/material';
import { useLogin } from '../hooks/useApi';

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const login = useLogin();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(formData, {
      onSuccess: (data) => {
        // Redirect based on user type
        const username = data.user.username;
        if (username === 'admin') {
          navigate('/home'); // Admin dashboard
        } else if (username === 'street_food_vendor') {
          navigate('/vendor'); // Vendor dashboard
        } else {
          navigate('/customer'); // Customer dashboard
        }
        onSuccess?.();
      },
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      minHeight="100vh"
      sx={{ 
        px: { xs: 2, sm: 0 }, // Add horizontal padding on mobile
        py: { xs: 2, sm: 0 }  // Add vertical padding on mobile
      }}
    >
      <Card sx={{ 
        maxWidth: 400, 
        width: '100%',
        mx: { xs: 1, sm: 0 } // Add horizontal margin on mobile
      }}>
        <CardContent sx={{ 
          p: { xs: 3, sm: 4 } // Reduce padding on mobile
        }}>
          <Typography variant="h4" align="center" gutterBottom>
            Login to Gawulo
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Access your vendor or customer dashboard
          </Typography>

          {login.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {login.error.message}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              margin="normal"
              required
              disabled={login.isLoading}
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              disabled={login.isLoading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={login.isLoading}
              sx={{ mt: 3, mb: 2 }}
            >
              {login.isLoading ? (
                <CircularProgress size={24} />
              ) : (
                'Login'
              )}
            </Button>
          </form>

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Sample Credentials
            </Typography>
          </Divider>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Admin User:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Username: admin<br />
                Password: admin123
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Customer:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Username: customer1<br />
                Password: password123
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Vendor:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Username: street_food_vendor<br />
                Password: vendor123
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginForm;
