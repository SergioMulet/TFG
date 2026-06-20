import React from 'react';
import {
  Typography,
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LabelIcon from '@mui/icons-material/Label';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RouteIcon from '@mui/icons-material/Route';

// Importamos tus recursos de internacionalización idénticos al móvil
import useLanguage from '../internationalization/LanguageContext';
import translations from '../internationalization/i18n';

export default function DetailsSidebar({ shipId, onBack }) {
  const { lang } = useLanguage();
  const strings = translations[lang];

  // TTemporally hardcoded
  const shipMockData = {
    name: `Alpha ${shipId}`,
    type: 'cargo',
    lat: 41.3851,
    lng: 2.1734,
  };

  const shipTypeLabel = strings[shipMockData.type] || shipMockData.type;

  const handleDisplayRoute = () => {
    console.log(`Routes request...: ${shipId}`);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minWidth: 240,
        backgroundColor: '#b8ebff',
      }}
    >
      {/* Back */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={onBack} size="small" edge="start">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h2" sx={{ fontWeight: 'bold', noWrap: true }}>
          {strings.shipDetails}
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Details */}
      <List sx={{ p: 0, flexGrow: 1 }}>
        <ListItem disablePadding sx={{ mb: 2 }}>
          <ListItemText
            primary={shipTypeLabel}
            secondary={lang === 'es' ? 'Tipo de embarcación' : 'Vessel type'}
          />
        </ListItem>

        {/* Coordinates */}
        <ListItem disablePadding sx={{ mb: 1, alignItems: 'flex-start' }}>
          <ListItemText
            primary={
              <Box
                component="span"
                sx={{ display: 'block', fontFamily: 'monospace', fontSize: '0.9rem' }}
              >
                Lat: {shipMockData.lat.toFixed(4)}
                <br />
                Lng: {shipMockData.lng.toFixed(4)}
              </Box>
            }
            secondary={strings.last + ' 📍'}
          />
        </ListItem>
      </List>

      {/* Botón de acción en la parte inferior */}
      <Box sx={{ mt: 'auto', pt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          startIcon={<RouteIcon />}
          onClick={handleDisplayRoute}
          sx={{ fontWeight: 'bold', textTransform: 'none', borderRadius: 2 }}
        >
          {lang === 'es' ? 'Mostrar ruta' : 'Display route'}
        </Button>
      </Box>
    </Box>
  );
}
