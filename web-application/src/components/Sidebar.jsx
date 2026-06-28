import React from 'react';
import { useTheme, useMediaQuery } from '@mui/material';

import FilterSidebar from './FilterSidebar';
import FiltersMobile from './FiltersMobile';
import DetailsSidebar from './DetailsSidebar';

export default function Sidebar({
  selectedShipId,
  onBackToFilters,
  onDisplayRoute,
  selectedTypes,
  setSelectedTypes,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (selectedShipId === null) {
    return isMobile ? (
      <FiltersMobile selectedTypes={selectedTypes} setSelectedTypes={setSelectedTypes} />
    ) : (
      <FilterSidebar selectedTypes={selectedTypes} setSelectedTypes={setSelectedTypes} />
    );
  }

  return (
    <DetailsSidebar
      shipId={selectedShipId}
      onBack={onBackToFilters}
      onDisplayRoute={onDisplayRoute}
    />
  );
}
