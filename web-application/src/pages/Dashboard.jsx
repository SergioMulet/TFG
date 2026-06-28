import React, { useState, useEffect } from 'react';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import AppToolbar from '../components/AppToolbar';
import Sidebar from '../components/Sidebar';
import Map from '../components/Map';
import AdminPage from '../components/AdminPage';
import { shipLoader } from '../services/shipLoader';
import { SHIP_TYPE_KEYS } from '../shipTypes';

export default function Dashboard() {
  const [selectedShipId, setSelectedShipId] = useState(null);
  const [ships, setShips] = useState([]);
  const [displayedRoute, setDisplayedRoute] = useState(null);
  const [view, setView] = useState('map');
  const [selectedTypes, setSelectedTypes] = useState(
    SHIP_TYPE_KEYS.reduce((acc, key) => ({ ...acc, [key]: true }), {}),
  );
  const handleBackToFilters = () => {
    setSelectedShipId(null);
  };

  useEffect(() => {
    return shipLoader.subscribeToShips(setShips);
  }, []);

  useEffect(() => {
    setDisplayedRoute(null);
  }, [selectedShipId]);

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, height: '100vh' }}>
      <CssBaseline />

      {/* Nav */}
      <AppToolbar
        view={view}
        onToggleView={() => setView(view === 'map' ? 'admin' : 'map')}
        ships={ships}
        onSelectShip={setSelectedShipId}
      />

      {view === 'map' ? (
        <>
          {/* Sidebar */}
          <Box
            sx={{
              width: { xs: '100%', sm: 'auto' },
              height: { xs: '40vh', sm: '100vh' },
              flexShrink: 0,
              overflowY: 'auto',
              pt: { xs: 0, sm: 8 },
              borderRight: { xs: 0, sm: 1 },
              borderBottom: { xs: 1, sm: 0 },
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
            sx={{ flexGrow: 1, height: { xs: 'auto', sm: '100vh' }, position: 'relative' }}
          >
            <Toolbar sx={{ display: { xs: 'none', sm: 'block' } }} />
            {/* Map container */}
            <Box sx={{ width: '100%', height: { xs: '100%', sm: 'calc(100vh - 64px)' } }}>
              <Map
                selectedShipId={selectedShipId}
                onSelectShip={setSelectedShipId}
                ships={ships}
                route={displayedRoute}
                selectedTypes={selectedTypes}
              />
            </Box>
          </Box>
        </>
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
