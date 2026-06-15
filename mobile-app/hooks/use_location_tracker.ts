import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { mqttService } from '@/services/mqttService';
import { sqliteService } from '@/services/sqliteService';
import { authContextManager } from '@/services/auth/auth.context';

export function useLocationTracker() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const [coordinatesType, setCoordinatesType] = useState<'current' | 'last' | null>(null);
  const [loadingGps, setLoadingGps] = useState<boolean>(false);

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const connectMqtt = async (supabaseToken: string): Promise<boolean> => {
    mqttService.connect();
    try {
      await mqttService.waitForConnection();
      console.log('--- [MQTT] Ready, starting GPS ---');
      syncOfflineData(supabaseToken);
      return true;
    } catch (e) {
      console.error("Couldn't connect MQTT:", e);
      setGpsActive(false);
      setLoadingGps(false);
      return false;
    }
  };

  const syncOfflineData = async (supabaseToken?: string) => {
    try {
      const offlineTelemetry = await sqliteService.getAllCoordinates();

      if (!offlineTelemetry || offlineTelemetry.length === 0) {
        console.warn('There is no data to synchronize');
        return;
      }

      // HTTP request to mian server
      const response = await fetch('192.168.1.135:8080/api/telemetry/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(supabaseToken && { Authorization: `Bearer ${supabaseToken}` }),
        },
        body: JSON.stringify({ telemetry: offlineTelemetry }),
      });

      if (response.ok) {
        console.log('The synchronization succeed. Clearing DB');
        await sqliteService.clearDatabase();
      } else {
        console.error('Error in main server response: ', response.statusText);
      }
    } catch (error) {
      console.error('Error while synchronizing with mian server: ', error);
    }
  };

  const toggleGPS = async (
    isActive: boolean,
    currentBoatName: string,
    userEmail: string,
  ) => {
    let token = await authContextManager.getToken();
    if (!token || typeof token !== 'string') {
      throw new Error('[Auth] No se pudo obtener un token de autenticación válido.');
    }
    if (isActive) {
      setLoadingGps(true);
      try {
        let currentPermission = await Location.getForegroundPermissionsAsync();
        let status = currentPermission.status;

        if (status !== 'granted') {
          const answer = await Location.requestForegroundPermissionsAsync();
          status = answer.status;
        }

        if (status === 'granted') {
          if (!(await connectMqtt(token))) return;

          let currentPosition = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setLocation(currentPosition);
          setGpsActive(true);
          setCoordinatesType('current');

          if (subscriptionRef.current) {
            subscriptionRef.current.remove();
          }

          subscriptionRef.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 2000,
              distanceInterval: 0,
            },
            (newLocation) => {
              setLocation(newLocation);
              let timestampISO = new Date().toISOString();

              let telemetryPayload = {
                boat_name: currentBoatName,
                owner_email: userEmail,
                longitude: newLocation.coords.longitude,
                latitude: newLocation.coords.latitude,
                timestamp: timestampISO,
              };

              if (mqttService.getClient() && mqttService.getClient()?.connected) {
                let uniqueBoatKey = `${currentBoatName}-${userEmail}`.replace(
                  /\s+/g,
                  '_',
                );
                const topic = `maritime/boats/${uniqueBoatKey}/telemetry`;
                mqttService.publish(topic, JSON.stringify(telemetryPayload));
              } else {
                sqliteService.saveCoordinate(
                  currentBoatName,
                  userEmail,
                  newLocation.coords.longitude,
                  newLocation.coords.latitude,
                  timestampISO,
                );
              }
            },
          );
        } else {
          setGpsActive(false);
          setCoordinatesType('last');
        }
      } catch (error) {
        console.error('Error al obtener la localización:', error);
        setGpsActive(false);
        setCoordinatesType('last');
      } finally {
        setLoadingGps(false);
      }
    } else {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      mqttService.disconnect();
      setGpsActive(false);
      setCoordinatesType('last');
    }
  };

  useEffect(() => {
    return () => {
      if (subscriptionRef.current) subscriptionRef.current.remove();
    };
  }, []);

  return {
    location,
    gpsActive,
    coordinatesType,
    loadingGps,
    toggleGPS,
  };
}
