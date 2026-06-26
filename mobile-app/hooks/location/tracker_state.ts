import * as Location from 'expo-location';

export interface TrackerState {
  saveCoordinates(
    location: Location.LocationObject,
    shipId: string,
    userEmail: string,
    shipType: string,
  ): void;

  publishCoordinates(context: any): Promise<void> | void;
}
