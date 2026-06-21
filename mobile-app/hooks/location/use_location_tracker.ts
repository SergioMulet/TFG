import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { locationTracker } from './location_tracker';

export function useLocationTracker() {
  const [gpsActive, setGpsActive] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  const toggleGPS = useCallback(
    async (isActive: boolean, boatName: string, userEmail: string) => {
      if (isActive) {
        try {
          await locationTracker.startTracking(boatName, userEmail, (update) => {
            setLocation(update.location);
          });
          setGpsActive(true);
        } catch (error) {
          console.error('Could not start location tracking:', error);
          setGpsActive(false);
        }
      } else {
        await locationTracker.stopTracking();
        setGpsActive(false);
      }
    },
    [],
  );

  return { location, gpsActive, toggleGPS };
}
