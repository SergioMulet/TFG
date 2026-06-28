import React from 'react';
import { Toolbar, Typography, Box, IconButton, Tooltip } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LanguageSelector from './LanguageSelector';
import SearchBar from './SearchBar';
import TotalShips from './TotalShips';

export default function AppToolbarDesktop({ view, onToggleView, ships, onSelectShip }) {
  return (
    <Toolbar sx={{ gap: 2 }}>
      <Typography variant="h1" noWrap component="div" sx={{ fontWeight: 'bold' }}>
        Ships tracker
      </Typography>
      <Box sx={{ flexGrow: 1 }} />
      {view === 'map' && <TotalShips ships={ships} />}
      {view === 'map' && <SearchBar ships={ships} onSelectShip={onSelectShip} />}
      <Tooltip title={view === 'map' ? 'Admin view' : 'Back to map'}>
        <IconButton onClick={onToggleView} sx={{ color: 'accent.main' }}>
          {view === 'map' ? <AdminPanelSettingsIcon /> : <ArrowBackIcon />}
        </IconButton>
      </Tooltip>
      {view === 'map' && <LanguageSelector />}
    </Toolbar>
  );
}
