import { createTheme } from '@mui/material/styles';

const COLORS = {
  primary: '#0284c7',
  secondary: '#1e293b',
  secondaryDark: '#0f172a',
  accent: '#b8ebff',
  route: '#ef4444',
  divider: '#e0e0e0',
  backgroundDefault: '#f8fafc',
  backgroundPaper: '#ffffff',
  textSecondary: '#334155',
};

const theme = createTheme({
  palette: {
    primary: {
      main: COLORS.primary,
    },
    secondary: {
      main: COLORS.secondary,
      dark: COLORS.secondaryDark,
      contrastText: '#ffffff',
    },
    accent: {
      main: COLORS.accent,
    },
    route: {
      main: COLORS.route,
    },
    divider: COLORS.divider,
    background: {
      default: COLORS.backgroundDefault,
      paper: COLORS.backgroundPaper,
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',

    h1: {
      fontSize: '2.2rem',
      fontWeight: 'bold',
      color: COLORS.accent,
    },

    h2: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: COLORS.textSecondary,
    },

    h3: {
      fontSize: '1.2rem',
      color: COLORS.textSecondary,
    },
  },
});

export default theme;
