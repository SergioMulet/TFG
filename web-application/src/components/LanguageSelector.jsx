import React from 'react';
import { Box, IconButton } from '@mui/material';
import useLanguage from '../internationalization/LanguageContext';
import flagEs from '../assets/flag_es.svg';
import flagEn from '../assets/flag_en.svg';

export default function LanguageSelector() {
  const { lang, setLang } = useLanguage();

  return (
    <Box sx={{ display: 'flex' }}>
      <IconButton
        onClick={() => setLang('es')}
        disabled={lang === 'es'}
        sx={{ opacity: lang === 'es' ? 0.4 : 1 }}
      >
        <img src={flagEs} alt="Español" width={40} height={40} />
      </IconButton>
      <IconButton
        onClick={() => setLang('en')}
        disabled={lang === 'en'}
        sx={{ opacity: lang === 'en' ? 0.4 : 1 }}
      >
        <img src={flagEn} alt="English" width={40} height={40} />
      </IconButton>
    </Box>
  );
}
