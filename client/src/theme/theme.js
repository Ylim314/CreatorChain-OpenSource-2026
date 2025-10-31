import { createTheme } from '@mui/material/styles';

const commonTypography = {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
};

const commonShape = {
    borderRadius: 8,
};

const commonComponents = {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          },
        },
      },
    },
};

const getAppTheme = (mode = 'light') => createTheme({
  palette: {
    mode,
    primary: { main: '#3b82f6' },
    secondary: { main: '#8b5cf6' },
    ...(mode === 'light'
      ? { background: { default: '#F8FAFC', paper: '#FFFFFF' }, text: { primary: '#111827', secondary: '#4B5563' } }
      : { background: { default: '#0B1220', paper: '#0F172A' }, text: { primary: '#F3F4F6', secondary: 'rgba(255,255,255,0.7)' } })
  },
  typography: commonTypography,
  shape: commonShape,
  components: commonComponents,
});

export default getAppTheme;
