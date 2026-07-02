import React from 'react';
import { Box, IconButton } from '@mui/material';
import useLanguage from '../internationalization/LanguageContext';
import flagEs from '../assets/flag_es.svg';
import flagEn from '../assets/flag_en.svg';

export default function LanguageSelector({ size = 40 }) {
  const { lang, setLang } = useLanguage();

  return (
    <Box sx={{ display: 'flex' }}>
      <IconButton
        onClick={() => setLang('es')}
        disabled={lang === 'es'}
        sx={{ opacity: lang === 'es' ? 0.4 : 1 }}
      >
        <img src={flagEs} alt="Español" width={size} height={size} />
      </IconButton>
      <IconButton
        onClick={() => setLang('en')}
        disabled={lang === 'en'}
        sx={{ opacity: lang === 'en' ? 0.4 : 1 }}
      >
        <img src={flagEn} alt="English" width={size} height={size} />
      </IconButton>
    </Box>
  );
}
