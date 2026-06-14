import { useState } from "react";
import * as Location from "expo-location";

export function useLocationTracker() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const [coordinatesType, setCoordinatesType] = useState<'current' | 'last' | null>(null);
  const [loadingGps, setLoadingGps] = useState<boolean>(false);

  const toggleGPS = async (isActive: boolean) => {
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
          let currentPosition = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          setLocation(currentPosition);
          setGpsActive(true);
          setCoordinatesType("current");
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
      setGpsActive(false);
      setCoordinatesType('last');
    }
  };

  return {
    location,
    gpsActive,
    coordinatesType,
    loadingGps,
    toggleGPS
  };
}