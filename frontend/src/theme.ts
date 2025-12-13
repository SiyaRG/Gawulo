import { createTheme } from '@mui/material/styles';

// Trust as a Service (TaaS) brand color palette
const colors = {
  primary: '#27AE60', // Vibrant Green
  accent: '#E3AD4D', // Gold/Yellow-Orange
  lightBg: '#FDF9F3', // Creamy Off-White
  darkText: '#333333', // Dark Gray
  white: '#FFFFFF', // Pure White
};

export const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary, // Brand Primary Green #27AE60
      light: '#4EC97A',
      dark: '#1E7D47',
      contrastText: colors.white,
    },
    secondary: {
      main: colors.accent, // Brand Accent Gold #E3AD4D
      light: '#F0C97A',
      dark: '#C8952D',
      contrastText: colors.darkText,
    },
    error: {
      main: '#D32F2F',
    },
    warning: {
      main: colors.accent,
    },
    info: {
      main: colors.primary,
    },
    success: {
      main: colors.primary,
    },
    background: {
      default: colors.lightBg,
      paper: colors.white,
    },
    text: {
      primary: colors.darkText,
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '1.6rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.4rem',
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.2rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '0.9rem',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '0.8rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.7rem',
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 6.4,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6.4,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          padding: '4px 12.8px',
          fontSize: '0.8rem',
          '&:hover': {
            boxShadow: '0 3.2px 6.4px rgba(0,0,0,0.1)',
          },
        },
        sizeSmall: {
          padding: '3.2px 9.6px',
          fontSize: '0.7rem',
        },
        sizeLarge: {
          padding: '6.4px 16px',
          fontSize: '0.9rem',
        },
        contained: {
          '&:hover': {
            boxShadow: '0 3.2px 6.4px rgba(0,0,0,0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 9.6,
          boxShadow: '0 1.6px 6.4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '12.8px',
          '&:last-child': {
            paddingBottom: '12.8px',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12.8,
          fontWeight: 500,
          height: '24px',
          fontSize: '0.7rem',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6.4,
            fontSize: '0.8rem',
          },
        },
      },
    },
  },
});

export default theme;
