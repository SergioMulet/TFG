import React, { useState } from 'react';
import {
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Divider,
  Checkbox,
  Tooltip,
  Link,
} from '@mui/material';

import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ShipShapeIcon from './ShipShapeIcon';
import useLanguage from '../internationalization/LanguageContext';
import translations from '../internationalization/i18n';

export default function FilterSidebar() {
  const [expanded, setExpanded] = useState(true);
  const { lang, setLang } = useLanguage();
  const strings = translations[lang];

  const SHIP_CONFIG = {
    cargo: { color: '#ffde59' },
    tanker: { color: '#ff914d' },
    cruise: { color: '#00bf63' },
    fishing: { color: '#38b6ff' },
    yacht: { color: '#cb6ce6' },
    military: { color: '#ff3131' },
    tug: { color: '#3a6f55' },
    boat: { color: '#263f60' },
    other: { color: '#a6a6a6' },
  };

  const SHIP_KEYS = Object.keys(SHIP_CONFIG);

  const SHIP_TYPES = SHIP_KEYS.map((key) => ({
    label: strings[key],
    value: key,
    color: SHIP_CONFIG[key].color,
  }));

  const [selectedTypes, setSelectedTypes] = useState(
    SHIP_KEYS.reduce((acc, key) => ({ ...acc, [key]: true }), {}),
  );

  const handleToggle = (key) => {
    setSelectedTypes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isAllSelected = SHIP_KEYS.every((key) => selectedTypes[key]);
  const handleToggleAll = () => {
    const targetState = !isAllSelected;
    setSelectedTypes(
      SHIP_KEYS.reduce((acc, key) => ({ ...acc, [key]: targetState }), {}),
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minWidth: expanded ? 240 : 50,
        backgroundColor: '#b8ebff',
      }}
    >
      {/* Filter */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: expanded ? 'space-between' : 'center',
          mb: 2,
        }}
      >
        {expanded && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterAltIcon color="action" />
            <Typography variant="h2" sx={{ fontWeight: 'medium' }}>
              {strings.filters}
            </Typography>
          </Box>
        )}
        <IconButton onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </Box>

      <List sx={{ p: 0 }}>
        {/* All */}
        <Tooltip
          title={!expanded ? (lang === 'es' ? 'Todos' : 'All') : ''}
          placement="right"
        >
          <ListItem disablePadding>
            <ListItemButton onClick={handleToggleAll} sx={{ px: 1, minHeight: 40 }}>
              <ListItemIcon sx={{ minWidth: 0, mr: expanded ? 2 : 'auto' }}>
                <Checkbox
                  edge="start"
                  checked={isAllSelected}
                  indeterminate={
                    SHIP_KEYS.some((k) => selectedTypes[k]) && !isAllSelected
                  }
                  disableRipple
                  size="small"
                />
              </ListItemIcon>
              <ListItemText primary={strings.allShips} />
            </ListItemButton>
          </ListItem>
        </Tooltip>

        <Divider sx={{ my: 1 }} />

        {/* Ship types */}
        {SHIP_TYPES.map((type) => (
          <Tooltip title={!expanded ? type.label : ''} placement="right" key={type.value}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => handleToggle(type.value)}
                sx={{ px: 1, minHeight: 40 }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: expanded ? 2 : 'auto' }}>
                  <Checkbox
                    edge="start"
                    checked={selectedTypes[type.value]}
                    disableRipple
                    size="small"
                  />
                  {/* Icon */}
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', mr: !expanded ? 1 : 0 }}
                  >
                    <ShipShapeIcon color={type.color} />
                  </Box>
                </ListItemIcon>
                {expanded && <ListItemText primary={type.label} variant="h3" />}
              </ListItemButton>
            </ListItem>
          </Tooltip>
        ))}
      </List>
    </Box>
  );
}
