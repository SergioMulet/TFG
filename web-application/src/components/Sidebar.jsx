import React, { useState } from 'react';
import {
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Divider,
  Checkbox,
  Tooltip,
  Link,
} from '@mui/material';

import FilterSidebar from './FilterSidebar';
import DetailsSidebar from './DetailsSidebar';

export default function Sidebar({
  selectedShipId,
  onBackToFilters,
  onDisplayRoute,
  selectedTypes,
  setSelectedTypes,
}) {
  if (selectedShipId === null) {
    return <FilterSidebar selectedTypes={selectedTypes} setSelectedTypes={setSelectedTypes} />;
  }

  return (
    <DetailsSidebar
      shipId={selectedShipId}
      onBack={onBackToFilters}
      onDisplayRoute={onDisplayRoute}
    />
  );
}
