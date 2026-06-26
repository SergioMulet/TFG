import { LocationObject } from 'expo-location';
import { TrackerState } from '../tracker_state';

export class NotSendingState implements TrackerState {
  publishCoordinates(): void {
    // NOTHING TO BE DONE
  }
  saveCoordinates(location: LocationObject, shipId: string, userEmail: string, shipType: string): void {
    // NOTHING TO BE DONE
  }
}
