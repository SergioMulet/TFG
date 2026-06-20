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

export default function Sidebar({ selectedShipId, onBackToFilters }) {
  if (selectedShipId === null) {
    return <FilterSidebar />;
  }

  return <DetailsSidebar shipId={selectedShipId} onBack={onBackToFilters} />;
}
