import { LocationObject } from 'expo-location';
import { TrackerState } from '../tracker_state';

export class NotSendingState implements TrackerState {
  publishCoordinates(): void {
    // NOTHING TO BE DONE
  }
  saveCoordinates(location: LocationObject, boatName: string, userEmail: string): void {
    // NOTHING TO BE DONE
  }
}
