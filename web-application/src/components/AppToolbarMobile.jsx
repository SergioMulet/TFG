import React from 'react';
import { Toolbar, Typography, Box, IconButton, Tooltip } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LanguageSelector from './LanguageSelector';
import SearchBar from './SearchBar';
import TotalShips from './TotalShips';

export default function AppToolbarMobile({ view, onToggleView, ships, onSelectShip }) {
  return (
    <>
      {/* Row 1: title + nav */}
      <Toolbar variant="dense">
        <Typography variant="h1" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          Ships tracker
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title={view === 'map' ? 'Admin view' : 'Back to map'}>
          <IconButton
            onClick={onToggleView}
            sx={{ color: 'accent.main' }}
            aria-label={view === 'map' ? 'Admin view' : 'Back to map'}
          >
            {view === 'map' ? <AdminPanelSettingsIcon /> : <ArrowBackIcon />}
          </IconButton>
        </Tooltip>
        <LanguageSelector />
      </Toolbar>

      {/* Row 2: ship search tools */}
      <Toolbar variant="dense" sx={{ gap: 1 }}>
        {view === 'map' && <TotalShips ships={ships} />}
        <Box sx={{ flexGrow: 1 }} />
        {view === 'map' && <SearchBar ships={ships} onSelectShip={onSelectShip} />}
      </Toolbar>
    </>
  );
}
