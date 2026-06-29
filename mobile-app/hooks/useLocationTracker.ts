import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { locationTracker, BACKGROUND_LOCATION_TASK_NAME } from '@/services/location/locationTracker';

export function useLocationTracker() {
  const [gpsActive, setGpsActive] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  // Rechecks the real OS-level tracking status. Needed because tracking can
  // be stopped from a different screen (e.g. switching boats in Settings),
  // which this hook's local `gpsActive` state wouldn't otherwise know about.
  const syncStatus = useCallback(async () => {
    const isActive = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK_NAME,
    );
    setGpsActive(isActive);
  }, []);

  const toggleGPS = useCallback(
    async (isActive: boolean, shipId: string, userEmail: string, shipType: string) => {
      if (isActive) {
        try {
          await locationTracker.startTracking(shipId, userEmail, shipType, (update) => {
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

  return { location, gpsActive, toggleGPS, syncStatus };
}
