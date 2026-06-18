import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { locationTracker } from './location_tracker';

export function useLocationTracker() {
  const [gpsActive, setGpsActive] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  const toggleGPS = useCallback(
    async (isActive: boolean, boatName: string, userEmail: string) => {
      if (isActive) {
        setGpsActive(true);
        await locationTracker.startTracking(boatName, userEmail, (update) => {
          setLocation(update.location);
        });
      } else {
        locationTracker.stopTracking();
        setGpsActive(false);
      }
    },
    [],
  );

  return { location, gpsActive, toggleGPS };
}
