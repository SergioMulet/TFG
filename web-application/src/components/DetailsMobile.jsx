import React, { useState, useEffect } from 'react';
import { Typography, Box, IconButton, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RouteIcon from '@mui/icons-material/Route';

import useLanguage from '../internationalization/LanguageContext';
import translations from '../internationalization/i18n';
import { shipLoader } from '../services/shipLoader';

const IMAGE_HEIGHT = 140;

export default function DetailsMobile({ shipId, onBack, onDisplayRoute }) {
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

  const rowSx = { display: 'flex', justifyContent: 'space-between', gap: 1 };

  return (
    <Box sx={{ backgroundColor: 'accent.main', height: '100%', p: 1.5, overflowY: 'auto' }}>
      {/* Back */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <IconButton onClick={onBack} size="small" edge="start" aria-label={strings.back}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography variant="h3">{strings.shipDetails}</Typography>
      </Box>

      {/* Ship photo, fixed size so it never grows the sidebar (Supabase
          Storage doesn't guarantee the object exists, so fall back silently
          on load error). */}
      {shipDetails.image_url && !imageFailed && (
        <Box
          sx={{
            width: '100%',
            height: IMAGE_HEIGHT,
            borderRadius: 2,
            overflow: 'hidden',
            mb: 1.5,
            border: 2,
            borderColor: 'secondary.main',
          }}
        >
          <img
            src={shipDetails.image_url}
            alt={shipDetails.ship_id}
            style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
            onError={() => setImageFailed(true)}
          />
        </Box>
      )}

      {/* Details */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 1.5 }}>
        <Box sx={rowSx}>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            {strings.shipId}
          </Typography>
          <Typography variant="caption">{shipDetails.ship_id}</Typography>
        </Box>
        <Box sx={rowSx}>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            {strings.shipType}
          </Typography>
          <Typography variant="caption">{typeLabel}</Typography>
        </Box>
        <Box sx={rowSx}>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            {strings.latitude}
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
            {shipDetails.lat}
          </Typography>
        </Box>
        <Box sx={rowSx}>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            {strings.longitude}
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
            {shipDetails.lng}
          </Typography>
        </Box>
      </Box>

      <Button
        variant="contained"
        color="secondary"
        size="small"
        fullWidth
        startIcon={<RouteIcon />}
        onClick={handleDisplayRoute}
        sx={{ fontWeight: 'bold', textTransform: 'none', borderRadius: 2 }}
      >
        {strings.displayRoute}
      </Button>
    </Box>
  );
}
