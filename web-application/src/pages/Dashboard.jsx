import React, { useState, useEffect } from 'react';
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  Divider,
} from '@mui/material';
import Sidebar from '../components/Sidebar';
import Map from '../components/Map';
import LanguageSelector from '../components/LanguageSelector';
import { shipLoader } from '../services/shipLoader';

export default function Dashboard() {
  const [selectedShipId, setSelectedShipId] = useState(null);
  const [ships, setShips] = useState([]);
  const [displayedRoute, setDisplayedRoute] = useState(null);
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
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#1e293b' }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h1" noWrap component="div" sx={{ fontWeight: 'bold' }}>
            ⚓ Ships tracker
          </Typography>
          <LanguageSelector />
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        sx={{
          height: '100vh',
          pt: 8,
          borderRight: '1px solid #e0e0e0',
          bgcolor: 'background.paper',
        }}
      >
        <Sidebar
          selectedShipId={selectedShipId}
          onBackToFilters={handleBackToFilters}
          ships={ships}
          onDisplayRoute={setDisplayedRoute}
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
          />
        </Box>
      </Box>
    </Box>
  );
}
