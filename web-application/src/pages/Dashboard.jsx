import React, { useState, useEffect } from 'react';
import {
  Box,
  CssBaseline,
  Toolbar,
  useTheme,
  useMediaQuery,
  Drawer,
} from '@mui/material';
import AppToolbar from '../components/AppToolbar';
import Sidebar from '../components/Sidebar';
import Map from '../components/Map';
import AdminPage from '../components/AdminPage';
import { shipLoader } from '../services/shipLoader';
import { SHIP_TYPE_KEYS } from '../shipTypes';

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [selectedShipId, setSelectedShipId] = useState(import.meta.env.DEV ? 'Test1234' : null);
  const [ships, setShips] = useState([]);
  const [displayedRoute, setDisplayedRoute] = useState(null);
  const [view, setView] = useState('map');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState(
    SHIP_TYPE_KEYS.reduce((acc, key) => ({ ...acc, [key]: true }), {}),
  );
  const handleBackToFilters = () => {
    setSelectedShipId(null);
  };

  // Selecting a ship is only useful once its details are visible, so on
  // mobile (where the sidebar and the map are never shown at once) it also
  // expands the sidebar.
  const handleSelectShip = (shipId) => {
    setSelectedShipId(shipId);
    if (isMobile) setMobileSidebarOpen(true);
  };

  useEffect(() => {
    return shipLoader.subscribeToShips(setShips);
  }, []);

  useEffect(() => {
    setDisplayedRoute(null);
  }, [selectedShipId]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        height: '100vh',
      }}
    >
      <CssBaseline />

      {/* Nav */}
      <AppToolbar
        view={view}
        onToggleView={() => setView(view === 'map' ? 'admin' : 'map')}
        onGoToDashboard={() => setView('map')}
        ships={ships}
        onSelectShip={handleSelectShip}
        mobileSidebarOpen={mobileSidebarOpen}
        onToggleMobileSidebar={() => setMobileSidebarOpen((open) => !open)}
      />

      {view === 'map' ? (
        isMobile ? (
          <Box
            component="main"
            sx={{ flexGrow: 1, minHeight: 0, position: 'relative', height: '100vh' }}
          >
            {/* Always full screen */}
            <Map
              selectedShipId={selectedShipId}
              onSelectShip={handleSelectShip}
              ships={ships}
              route={displayedRoute}
              selectedTypes={selectedTypes}
            />

            {/* Slide-out Sidebar for mobile */}
            <Drawer
              anchor="left"
              open={mobileSidebarOpen}
              onClose={() => setMobileSidebarOpen(false)}
              PaperProps={{
                sx: { width: '80%', maxWidth: '360px' },
              }}
            >
              <Toolbar
                sx={{
                  background: 'linear-gradient(to bottom, #1e293b 0%, #b8ebff 100%)',
                }}
              />{' '}
              {/* Spacer to push content below the AppToolbar if needed */}
              <Sidebar
                selectedShipId={selectedShipId}
                onBackToFilters={handleBackToFilters}
                onClose={() => setMobileSidebarOpen(false)}
                ships={ships}
                onDisplayRoute={setDisplayedRoute}
                selectedTypes={selectedTypes}
                setSelectedTypes={setSelectedTypes}
              />
            </Drawer>
          </Box>
        ) : (
          <>
            {/* Sidebar */}
            <Box
              sx={{
                width: 'auto',
                height: '100vh',
                flexShrink: 0,
                overflowY: 'auto',
                pt: 8,
                borderRight: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Sidebar
                selectedShipId={selectedShipId}
                onBackToFilters={handleBackToFilters}
                ships={ships}
                onDisplayRoute={setDisplayedRoute}
                selectedTypes={selectedTypes}
                setSelectedTypes={setSelectedTypes}
              />
            </Box>

            {/* Main component*/}
            <Box
              component="main"
              sx={{ flexGrow: 1, height: '100vh', position: 'relative' }}
            >
              <Toolbar />
              {/* Map container */}
              <Box sx={{ width: '100%', height: 'calc(100vh - 64px)' }}>
                <Map
                  selectedShipId={selectedShipId}
                  onSelectShip={handleSelectShip}
                  ships={ships}
                  route={displayedRoute}
                  selectedTypes={selectedTypes}
                />
              </Box>
            </Box>
          </>
        )
      ) : (
        <Box component="main" sx={{ flexGrow: 1, height: { xs: 'auto', sm: '100vh' } }}>
          <Toolbar sx={{ display: { xs: 'none', sm: 'block' } }} />
          <Box sx={{ width: '100%', height: { xs: '100%', sm: 'calc(100vh - 64px)' } }}>
            <AdminPage />
          </Box>
        </Box>
      )}
    </Box>
  );
}
