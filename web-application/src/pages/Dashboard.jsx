import React, { useState, useEffect } from 'react';
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Sidebar from '../components/Sidebar';
import Map from '../components/Map';
import LanguageSelector from '../components/LanguageSelector';
import SearchBar from '../components/SearchBar';
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
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />

      {/* Nav */}
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: 'secondary.main' }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h1" noWrap component="div" sx={{ fontWeight: 'bold' }}>
            ⚓ Ships tracker
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          {view === 'map' && <SearchBar ships={ships} onSelectShip={setSelectedShipId} />}
          <Tooltip title={view === 'map' ? 'Admin view' : 'Back to map'}>
            <IconButton
              onClick={() => setView(view === 'map' ? 'admin' : 'map')}
              sx={{ color: 'white' }}
            >
              {view === 'map' ? <AdminPanelSettingsIcon /> : <ArrowBackIcon />}
            </IconButton>
          </Tooltip>
          {view === 'map' && <LanguageSelector />}
        </Toolbar>
      </AppBar>

      {view === 'map' ? (
        <>
          {/* Sidebar */}
          <Box
            sx={{
              height: '100vh',
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
          <Box component="main" sx={{ flexGrow: 1, height: '100vh', position: 'relative' }}>
            <Toolbar />
            {/* Map container */}
            <Box sx={{ width: '100%', height: 'calc(100vh - 64px)' }}>
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
        <Box component="main" sx={{ flexGrow: 1, height: '100vh' }}>
          <Toolbar />
          <Box sx={{ width: '100%', height: 'calc(100vh - 64px)' }}>
            <AdminPage />
          </Box>
        </Box>
      )}
    </Box>
  );
}
