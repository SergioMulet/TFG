import React from 'react';
import PropTypes from 'prop-types';

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
