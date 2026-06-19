import React from 'react';
import { Typography, List, ListItem, ListItemText } from '@mui/material';

export default function ShipSidebar() {
  return (
    <div>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Ships List
      </Typography>
      <List>
        <ListItem>
          <ListItemText primary="Test boat 1 (Active)" secondary="ID: 001" />
        </ListItem>
        <ListItem>
          <ListItemText primary="Test boat 2 (Offline)" secondary="ID: 002" />
        </ListItem>
      </List>
    </div>
  );
}
