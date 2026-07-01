import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Box, useTheme } from '@mui/material';
import L from 'leaflet';

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

const ROUTE_MIN_OPACITY = 0.2;

// Splits a route into per-segment polylines whose opacity fades from faint
// (oldest) to solid (most recent), so the trail itself conveys direction and
// recency without needing separate arrow decorations or a marker per point.
function buildRouteSegments(positions) {
  const lastIndex = positions.length - 2;
  if (lastIndex < 0) return [];

  return positions.slice(0, -1).map((position, index) => {
    const progress = lastIndex === 0 ? 1 : index / lastIndex;
    return {
      key: `route-segment-${index}`,
      positions: [position, positions[index + 1]],
      opacity: ROUTE_MIN_OPACITY + (1 - ROUTE_MIN_OPACITY) * progress,
    };
  });
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
  const routeSegments = buildRouteSegments(routePoints);

  const selectedShip = selectedShipId
    ? realShips.find((ship) => ship.id === selectedShipId)
    : null;
  const routeColor = SHIP_CONFIG[selectedShip?.type]?.color || theme.palette.primary.main;

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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* Route */}
        {routeSegments.map((segment) => (
          <Polyline
            key={segment.key}
            positions={segment.positions}
            pathOptions={{
              color: routeColor,
              weight: 4,
              opacity: segment.opacity,
            }}
          />
        ))}

        {isShowingRoute && (
          <Marker
            position={routePoints[routePoints.length - 1]}
            icon={createLeafletShipIcon(routeColor, selectedShipId || 'Ship')}
          />
        )}

        {/* Markers */}
        {!isShowingRoute &&
          visibleShips.map((ship) => (
            <Marker
              key={ship.id}
              position={[ship.lat, ship.lng]}
              icon={createLeafletShipIcon(
                SHIP_CONFIG[ship.type]?.color || theme.palette.primary.main,
                ship.id,
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
