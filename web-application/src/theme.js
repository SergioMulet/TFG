import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0284c7',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',

    h1: {
      fontSize: '2.2rem',
      fontWeight: 'bold',
      color: '#b8ebff',
    },

    h2: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#334155',
    },

    h3: {
      fontSize: '1.2rem',
      color: '#334155',
    },
  },
});

export default theme;
