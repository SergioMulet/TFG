import * as Location from 'expo-location';

export interface TrackerState {
  saveCoordinates(
    location: Location.LocationObject,
    boatName: string,
    userEmail: string,
  ): void;

  publishCoordinates(): Promise<void> | void;
}
