import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Box, useTheme } from '@mui/material';
import L from 'leaflet';
import 'leaflet-polylinedecorator';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import { createLeafletShipIcon } from './ShipShapeIcon';
import { SHIP_CONFIG } from '../shipTypes';
import { filterService } from '../services/filterService';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const routePointIcon = L.divIcon({
  html: '<div style="font-size: 18px; line-height: 1;">🚢</div>',
  className: 'route-point-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function RouteDirectionArrows({ positions, color }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length < 2) return;

    const decorator = L.polylineDecorator(positions, {
      patterns: [
        {
          offset: 25,
          repeat: 80,
          symbol: L.Symbol.arrowHead({
            pixelSize: 10,
            polygon: false,
            pathOptions: { color, weight: 2 },
          }),
        },
      ],
    }).addTo(map);

    return () => decorator.remove();
  }, [map, positions, color]);

  return null;
}

export default function Map({ selectedShipId, onSelectShip, ships, route, selectedTypes }) {
  const theme = useTheme();
  const defaultPosition = [40.59, -3.91];

  const realShips = ships || [];

  // An explicitly selected ship (via search or a marker click) always
  // shows, regardless of the type filter, since hiding it would be
  // confusing. The type filter only applies while browsing all ships.
  const visibleShips = selectedShipId
    ? filterService.filterById(realShips, selectedShipId)
    : filterService.filterByType(realShips, selectedTypes);

  const routePoints = (route || []).map((coord) => [coord.lat, coord.lng]);
  const isShowingRoute = routePoints.length > 0;

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={defaultPosition}
        zoom={4}
        minZoom={2}
        maxZoom={19}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Route */}
        {routePoints.length > 1 && (
          <>
            <Polyline
              positions={routePoints}
              pathOptions={{
                color: theme.palette.route.main,
                weight: 2,
                dashArray: '6, 8',
              }}
            />
            <RouteDirectionArrows
              positions={routePoints}
              color={theme.palette.route.main}
            />
          </>
        )}

        {routePoints.map((position, index) => (
          <Marker
            key={`route-point-${index}`}
            position={position}
            icon={routePointIcon}
          />
        ))}

        {/* Markers */}
        {!isShowingRoute &&
          visibleShips.map((ship) => (
            <Marker
              key={ship.id}
              position={[ship.lat, ship.lng]}
              icon={createLeafletShipIcon(
                SHIP_CONFIG[ship.type]?.color || theme.palette.primary.main,
              )}
              eventHandlers={{
                click: () => {
                  onSelectShip(ship.id);
                },
              }}
            >
              <Popup>
                <strong>{ship.id}</strong>
                <br />
                Lat: {ship.lat.toFixed(4)}
                <br />
                Lng: {ship.lng.toFixed(4)}
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </Box>
  );
}
