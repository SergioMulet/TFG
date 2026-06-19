import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Box } from '@mui/material';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function Map() {
  // test coordinates, Barcelona
  const position = [41.3851, 2.1734];

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer center={position} zoom={12} style={{ width: '100%', height: '100%' }}>
        {/* OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Static marker */}
        <Marker position={position}>
          <Popup>
            <strong>Vessel: Test Boat 01</strong>
            <br />
            Status: Streaming Live <br />
            Speed: 12.4 knots
          </Popup>
        </Marker>
      </MapContainer>
    </Box>
  );
}
