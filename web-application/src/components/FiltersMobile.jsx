import React from 'react';
import { Box, Typography, Checkbox } from '@mui/material';

import ShipShapeIcon from './ShipShapeIcon';
import useLanguage from '../internationalization/LanguageContext';
import translations from '../internationalization/i18n';
import { SHIP_CONFIG, SHIP_TYPE_KEYS } from '../shipTypes';

export default function FiltersMobile({ selectedTypes, setSelectedTypes }) {
  const { lang } = useLanguage();
  const strings = translations[lang];

  const SHIP_TYPES = SHIP_TYPE_KEYS.map((key) => ({
    label: strings[key],
    value: key,
    color: SHIP_CONFIG[key].color,
  }));

  const handleToggle = (key) => {
    setSelectedTypes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isAllSelected = SHIP_TYPE_KEYS.every((key) => selectedTypes[key]);
  const handleToggleAll = () => {
    const targetState = !isAllSelected;
    setSelectedTypes(
      SHIP_TYPE_KEYS.reduce((acc, key) => ({ ...acc, [key]: targetState }), {}),
    );
  };

  return (
    <Box sx={{ backgroundColor: 'accent.main', height: '100%', p: 1.5 }}>
      {/* All checkbox + title */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Checkbox
          edge="start"
          checked={isAllSelected}
          indeterminate={SHIP_TYPE_KEYS.some((k) => selectedTypes[k]) && !isAllSelected}
          onChange={handleToggleAll}
          size="small"
          slotProps={{ input: { 'aria-label': strings.allShips } }}
        />
        <Typography variant="h2">{strings.filters}</Typography>
      </Box>

      {/* Ship type filters, 3 per row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
        {SHIP_TYPES.map((type) => (
          <Box
            key={type.value}
            component="label"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <Checkbox
              checked={selectedTypes[type.value]}
              onChange={() => handleToggle(type.value)}
              size="small"
              sx={{ p: 0.5 }}
            />
            <ShipShapeIcon color={type.color} />
            <Typography
              variant="caption"
              sx={{ fontSize: '0.75rem', lineHeight: 1.2, mt: 0.5 }}
            >
              {type.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
