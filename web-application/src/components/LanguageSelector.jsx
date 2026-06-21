import React from 'react';
import { Box, IconButton } from '@mui/material';
import useLanguage from '../internationalization/LanguageContext';

export default function LanguageSelector() {
  const { lang, setLang } = useLanguage();

  return (
    <Box sx={{ display: 'flex' }}>
      <IconButton
        onClick={() => setLang('es')}
        disabled={lang === 'es'}
        sx={{ fontSize: 40, opacity: lang === 'es' ? 0.4 : 1 }}
      >
        🇪🇸
      </IconButton>
      <IconButton
        onClick={() => setLang('en')}
        disabled={lang === 'en'}
        sx={{ fontSize: 40, opacity: lang === 'en' ? 0.4 : 1 }}
      >
        🇬🇧
      </IconButton>
    </Box>
  );
}
