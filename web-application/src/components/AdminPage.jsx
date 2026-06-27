import React from 'react';
import { Box } from '@mui/material';

const { protocol, hostname } = window.location;
const GRAFANA_URL = `${protocol}//${hostname}:3000/d/fleet-overview/fleet-overview?kiosk`;

export default function AdminPage() {
  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <iframe
        src={GRAFANA_URL}
        title="Grafana"
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </Box>
  );
}
