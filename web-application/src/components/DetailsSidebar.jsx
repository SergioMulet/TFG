import React, { useState, useEffect } from 'react';
import { Typography, Box, Divider, IconButton, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RouteIcon from '@mui/icons-material/Route';

// Importamos tus recursos de internacionalización idénticos al móvil
import useLanguage from '../internationalization/LanguageContext';
import translations from '../internationalization/i18n';
import { shipLoader } from '../services/shipLoader';

const IMAGE_HEIGHT = 200;

export default function DetailsSidebar({ shipId, onBack, onDisplayRoute }) {
  const { lang } = useLanguage();
  const strings = translations[lang];

  const [shipDetails, setShipDetails] = useState({});
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
    shipLoader.loadDetails(shipId, setShipDetails);
  }, [shipId]);

  const handleDisplayRoute = () => {
    onDisplayRoute(shipDetails.route || []);
  };

  // Ship type comes from the backend as a raw key (e.g. "yacht"), so it
  // needs to go through the translation table just like everywhere else.
  const typeLabel = strings[shipDetails.type] || shipDetails.type;

  const cardSx = {
    backgroundColor: 'secondary.main',
    color: 'secondary.contrastText',
    borderRadius: '16px',
    textAlign: 'center',
    py: { xs: 1, sm: 2 },
    px: { xs: 1.5, sm: 2 },
    mb: { xs: 1, sm: 3 },
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minWidth: { xs: 'auto', sm: 300 },
        backgroundColor: 'accent.main',
        border: 3,
        borderColor: 'secondary.main',
        p: { xs: 1, sm: 2 },
      }}
    >
      {/* Back */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 0.5, sm: 2 } }}>
        <IconButton onClick={onBack} edge="start" aria-label={strings.back}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h2" sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>
          {strings.shipDetails}
        </Typography>
      </Box>

      <Divider sx={{ mb: { xs: 1, sm: 3 }, borderColor: 'secondary.main' }} />

      {/* Ship photo, fixed size so it never grows the sidebar (Supabase
          Storage doesn't guarantee the object exists, so fall back silently
          on load error). */}
      {shipDetails.image_url && !imageFailed && (
        <Box sx={{ ...cardSx, p: 0, height: IMAGE_HEIGHT, overflow: 'hidden' }}>
          <img
            src={shipDetails.image_url}
            alt={shipDetails.ship_id}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              objectFit: 'cover',
            }}
            onError={() => setImageFailed(true)}
          />
        </Box>
      )}

      {/* Ship ID */}
      <Box sx={cardSx}>
        <Typography
          variant="h3"
          sx={{
            color: 'secondary.contrastText',
            fontWeight: 'bold',
            fontSize: { xs: '0.85rem', sm: '1.2rem' },
          }}
        >
          {strings.shipId}
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: 'secondary.contrastText', fontSize: { xs: '0.8rem', sm: '1rem' } }}
        >
          {shipDetails.ship_id}
        </Typography>
      </Box>

      {/* Ship type */}
      <Box sx={cardSx}>
        <Typography
          variant="h3"
          sx={{
            color: 'secondary.contrastText',
            fontWeight: 'bold',
            fontSize: { xs: '0.85rem', sm: '1.2rem' },
          }}
        >
          {strings.shipType}
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: 'secondary.contrastText', fontSize: { xs: '0.8rem', sm: '1rem' } }}
        >
          {typeLabel}
        </Typography>
      </Box>

      {/* Coordinates */}
      <Box sx={cardSx}>
        <Typography
          variant="h3"
          sx={{
            color: 'secondary.contrastText',
            fontWeight: 'bold',
            mb: { xs: 0.5, sm: 2 },
            fontSize: { xs: '0.85rem', sm: '1.2rem' },
          }}
        >
          {strings.last}:
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'secondary.contrastText',
            fontFamily: 'monospace',
            mb: { xs: 0.5, sm: 1.5 },
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
          }}
        >
          {strings.latitude}: {shipDetails.lat}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'secondary.contrastText',
            fontFamily: 'monospace',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
          }}
        >
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
            width: { xs: '90%', sm: '70%' },
            py: { xs: 0.5, sm: 1 },
          }}
        >
          {strings.displayRoute}
        </Button>
      </Box>
    </Box>
  );
}
