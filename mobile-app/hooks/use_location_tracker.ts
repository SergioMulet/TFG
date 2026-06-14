import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import { mqttService } from "@/services/mqttService";

export function useLocationTracker() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const [coordinatesType, setCoordinatesType] = useState<
    "current" | "last" | null
  >(null);
  const [loadingGps, setLoadingGps] = useState<boolean>(false);

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const connectMqtt = async (): Promise<boolean> => {
    mqttService.connect();
    try {
      await mqttService.waitForConnection(); 
      console.log("--- [MQTT] Ready, starting GPS ---");
      return true; 
    } catch (e) {
      console.error("Couldn't connect MQTT:", e);
      setGpsActive(false);
      setLoadingGps(false);
      return false; 
    }
  };

  const toggleGPS = async (
    isActive: boolean,
    currentBoatName: string,
    userEmail: string,
  ) => {
    if (isActive) {
      setLoadingGps(true);
      try {
        let currentPermission = await Location.getForegroundPermissionsAsync();
        let status = currentPermission.status;

        if (status !== "granted") {
          const answer = await Location.requestForegroundPermissionsAsync();
          status = answer.status;
        }

        if (status === "granted") {
          if(!(await connectMqtt())) return;

          let currentPosition = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setLocation(currentPosition);
          setGpsActive(true);
          setCoordinatesType("current");

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

              let telemetryPayload = {
                boat_name: currentBoatName,
                owner_email: userEmail,
                longitude: newLocation.coords.longitude,
                latitude: newLocation.coords.latitude,
                timestamp: new Date().toISOString(),
              };

              let uniqueBoatKey = `${currentBoatName}-${userEmail}`.replace(
                /\s+/g,
                "_",
              );
              const topic = `maritime/boats/${uniqueBoatKey}/telemetry`;
              mqttService.publish(topic, JSON.stringify(telemetryPayload));
            },
          );
        } else {
          setGpsActive(false);
          setCoordinatesType("last");
        }
      } catch (error) {
        console.error("Error al obtener la localización:", error);
        setGpsActive(false);
        setCoordinatesType("last");
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
      setCoordinatesType("last");
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
