import React, { useMemo, useState } from 'react';
import {
  Box,
  TextField,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import useLanguage from '../internationalization/LanguageContext';
import translations from '../internationalization/i18n';
import { filterService } from '../services/filterService';

export default function SearchBar({ ships, onSelectShip }) {
  const { lang } = useLanguage();
  const strings = translations[lang];

  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const suggestions = useMemo(
    () => filterService.findShips(ships, query),
    [ships, query],
  );

  const handleSelect = (shipId) => {
    onSelectShip(shipId);
    setQuery('');
    setIsFocused(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && suggestions.length > 0) {
      handleSelect(suggestions[0].id);
    }
  };

  const showDropdown = isFocused && query.trim().length > 0;

  return (
    <Box sx={{ position: 'relative', width: { xs: 170, sm: 280 } }}>
      <TextField
        size="small"
        fullWidth
        placeholder={strings.searchShipPlaceholder}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        sx={{
          borderRadius: 1,
          backgroundColor: 'accent.main',
          '& .MuiInputBase-input': { color: 'secondary.main' },
          '& .MuiInputBase-input::placeholder': { color: 'secondary.main', opacity: 0.6 },
        }}
      />

      {showDropdown && (
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 0.5,
            zIndex: 1300,
            maxHeight: 240,
            overflowY: 'auto',
            backgroundColor: 'accent.main',
          }}
        >
          <List dense>
            {suggestions.length > 0 ? (
              suggestions.map((ship) => (
                <ListItemButton
                  key={ship.id}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(ship.id)}
                  sx={{ color: 'secondary.main' }}
                >
                  <ListItemText primary={ship.id} />
                </ListItemButton>
              ))
            ) : (
              <ListItemButton disabled sx={{ color: 'secondary.main' }}>
                <ListItemText primary={strings.noShipsFound} />
              </ListItemButton>
            )}
          </List>
        </Paper>
      )}
    </Box>
  );
}
