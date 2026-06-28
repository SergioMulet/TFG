import React from 'react';
import { Typography } from '@mui/material';
import useLanguage from '../internationalization/LanguageContext';
import translations from '../internationalization/i18n';

export default function TotalShips({ ships }) {
  const { lang } = useLanguage();
  const strings = translations[lang];

  return (
    <Typography variant="body1" noWrap sx={{ color: 'accent.main' }}>
      {strings.totalShips}: {ships.length}
    </Typography>
  );
}
