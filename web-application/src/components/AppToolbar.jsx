import React from 'react';
import { AppBar, useTheme, useMediaQuery } from '@mui/material';
import AppToolbarDesktop from './AppToolbarDesktop';
import AppToolbarMobile from './AppToolbarMobile';

export default function AppToolbar({ view, onToggleView, ships, onSelectShip }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <AppBar
      position="fixed"
      sx={{
        position: { xs: 'static', sm: 'fixed' },
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'secondary.main',
      }}
    >
      {isMobile ? (
        <AppToolbarMobile
          view={view}
          onToggleView={onToggleView}
          ships={ships}
          onSelectShip={onSelectShip}
        />
      ) : (
        <AppToolbarDesktop
          view={view}
          onToggleView={onToggleView}
          ships={ships}
          onSelectShip={onSelectShip}
        />
      )}
    </AppBar>
  );
}
