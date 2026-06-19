import React, { useState } from 'react';
import {
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  Divider,
} from '@mui/material';
import ShipSidebar from '../components/ShipSidebar';
import Map from '../components/Map';

const drawerWidth = 340; // boats corntol panel width

export default function Dashboard() {
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />

      {/* Nav */}
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#1e293b' }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
            ⚓ Maritime Telemetry Dashboard
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Left panel*/}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', p: 2 }}>
          <ShipSidebar />
        </Box>
      </Drawer>

      {/* Main component*/}
      <Box component="main" sx={{ flexGrow: 1, height: '100vh', position: 'relative' }}>
        <Toolbar />
        {/* Map container */}
        <Box sx={{ width: '100%', height: 'calc(100vh - 64px)' }}>
          <Map />
        </Box>
      </Box>
    </Box>
  );
}
