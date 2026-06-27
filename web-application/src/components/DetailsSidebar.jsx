import React, { useState, useEffect } from 'react';
import { Typography, Box, Divider, IconButton, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RouteIcon from '@mui/icons-material/Route';

// Importamos tus recursos de internacionalización idénticos al móvil
import useLanguage from '../internationalization/LanguageContext';
import translations from '../internationalization/i18n';
import { shipLoader } from '../services/shipLoader';

const cardSx = {
  backgroundColor: 'secondary.main',
  color: 'secondary.contrastText',
  borderRadius: '16px',
  textAlign: 'center',
  py: 2,
  px: 2,
  mb: 3,
};

export default function DetailsSidebar({ shipId, onBack, onDisplayRoute }) {
  const { lang } = useLanguage();
  const strings = translations[lang];

  const [shipDetails, setShipDetails] = useState([]);

  useEffect(() => {
    shipLoader.loadDetails(shipId, setShipDetails);
  }, [shipId]);

  const handleDisplayRoute = () => {
    onDisplayRoute(shipDetails.route24 || []);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minWidth: 300,
        backgroundColor: 'accent.main',
        border: 3,
        borderColor: 'secondary.main',
        p: 2,
      }}
    >
      {/* Back */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={onBack} size="small" edge="start">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h2">{strings.shipDetails}</Typography>
      </Box>

      <Divider sx={{ mb: 3, borderColor: 'secondary.main' }} />

      {/* Ship type */}
      <Box sx={cardSx}>
        <Typography variant="h3" sx={{ color: 'secondary.contrastText', fontWeight: 'bold' }}>
          {strings.shipType}
        </Typography>
        <Typography variant="body1" sx={{ color: 'secondary.contrastText' }}>
          {shipDetails.type}
        </Typography>
      </Box>

      {/* Coordinates */}
      <Box sx={cardSx}>
        <Typography variant="h3" sx={{ color: 'secondary.contrastText', fontWeight: 'bold', mb: 2 }}>
          {strings.last}:
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: 'secondary.contrastText', fontFamily: 'monospace', mb: 1.5 }}
        >
          {strings.latitude}: {shipDetails.lat}
        </Typography>
        <Typography variant="body2" sx={{ color: 'secondary.contrastText', fontFamily: 'monospace' }}>
          {strings.longitude}: {shipDetails.lng}
        </Typography>
      </Box>

      {/* Action button */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<RouteIcon />}
          onClick={handleDisplayRoute}
          sx={{
            fontWeight: 'bold',
            textTransform: 'none',
            borderRadius: '16px',
            width: '70%',
            py: 1,
          }}
        >
          {strings.displayRoute}
        </Button>
      </Box>
    </Box>
  );
}
