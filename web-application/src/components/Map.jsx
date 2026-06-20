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

export default function Map({ selectedShipId, onSelectShip }) {
  const defaultPosition = [41.3851, 2.1734];

  const mockShips = [
    {
      id: '001',
      name: 'Boat Alpha',
      type: 'cargo',
      pos: [41.3851, 2.1734],
      speed: '12.4 knots',
    },
    {
      id: '002',
      name: 'Boat Beta',
      type: 'sailing',
      pos: [41.365, 2.195],
      speed: '0.0 knots (Offline)',
    },
  ];

  const visibleShips = selectedShipId
    ? mockShips.filter((ship) => ship.id === selectedShipId)
    : mockShips;

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={defaultPosition}
        zoom={12}
        minZoom={2}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Markers */}
        {visibleShips.map((ship) => (
          <Marker
            key={ship.id}
            position={ship.pos}
            eventHandlers={{
              click: () => {
                onSelectShip(ship.id);
              },
            }}
          >
            <Popup>
              <strong>{ship.name}</strong>
              <br />
              Speed: {ship.speed}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
}
