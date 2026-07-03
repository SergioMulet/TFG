import React from 'react';
import { Toolbar, Typography, Box, IconButton, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LanguageSelector from './LanguageSelector';
import MobileSearchBar from './MobileSearchBar';

export default function AppToolbarMobile({
  view,
  onToggleView,
  onGoToDashboard,
  ships,
  onSelectShip,
  sidebarOpen,
  onToggleSidebar,
}) {
  return (
    <Toolbar variant="dense" sx={{ position: 'relative', gap: 1 }}>
      {/* Left: sidebar toggle + admin/Grafana toggle */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {view === 'map' && (
          <Tooltip title={sidebarOpen ? 'Show map' : 'Show ships'}>
            <IconButton
              onClick={onToggleSidebar}
              sx={{ color: 'accent.main' }}
              aria-label={sidebarOpen ? 'Show map' : 'Show ships'}
            >
              {sidebarOpen ? <MenuOpenIcon /> : <MenuIcon />}
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title={view === 'map' ? 'Admin view' : 'Back to map'}>
          <IconButton
            onClick={onToggleView}
            sx={{ color: 'accent.main' }}
            aria-label={view === 'map' ? 'Admin view' : 'Back to map'}
          >
            {view === 'map' ? <AdminPanelSettingsIcon /> : <ArrowBackIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Center: title, independent of the left/right group widths */}
      <Typography
        variant="h1"
        noWrap
        component="div"
        onClick={onGoToDashboard}
        sx={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '1.0rem',
          fontWeight: 'bold',
          maxWidth: '35%',
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
      >
        Ships tracker
      </Typography>

      <Box sx={{ flexGrow: 1 }} />

      {/* Right: search + language flags */}
      {view === 'map' && <MobileSearchBar ships={ships} onSelectShip={onSelectShip} />}
      {view === 'map' && <LanguageSelector size={24} />}
    </Toolbar>
  );
}
