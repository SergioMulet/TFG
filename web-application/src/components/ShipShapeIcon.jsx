import React from 'react';
import PropTypes from 'prop-types';
import { renderToString } from 'react-dom/server';
import L from 'leaflet';

export default function ShipShapeIcon({ color }) {
  return (
    <svg width="20" height="14" viewBox="0 0 24 16" style={{ display: 'block' }}>
      <path
        d="M2,2 L16,2 L22,8 L16,14 L2,14 L6,8 Z"
        fill={color}
        stroke="#222"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

ShipShapeIcon.propTypes = {
  color: PropTypes.string,
};

const ShipDivIcon = L.DivIcon.extend({
  createIcon(oldIcon) {
    const el = L.DivIcon.prototype.createIcon.call(this, oldIcon);
    if (this.options.ariaLabel) {
      el.setAttribute('aria-label', this.options.ariaLabel);
    }
    return el;
  },
});

// Leaflet version
export const createLeafletShipIcon = (color = '#0284c7', ariaLabel = '') =>
  new ShipDivIcon({
    html: renderToString(<ShipShapeIcon color={color} />),
    className: 'custom-ship-marker',
    iconSize: [24, 16],
    iconAnchor: [12, 8],
    ariaLabel,
  });
