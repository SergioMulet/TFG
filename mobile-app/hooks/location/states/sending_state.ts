import { LocationObject } from 'expo-location';
import { TrackerState } from '../tracker_state';
import { mqttService } from '@/services/mqttService';
import { sqliteService } from '@/services/sqliteService';

export class SendingState implements TrackerState {
  private topic: string = '';
  private telemetryPayload: {
    boat_name: string;
    owner_email: string;
    longitude: number;
    latitude: number;
    timestamp: string;
  } | null = null;

  saveCoordinates(location: LocationObject, boatName: string, userEmail: string): void {
    this.telemetryPayload = {
      boat_name: boatName,
      owner_email: userEmail,
      longitude: location.coords.longitude,
      latitude: location.coords.latitude,
      timestamp: new Date(location.timestamp).toISOString(),
    };

    let uniqueBoatKey = `${boatName}-${userEmail}`;
    this.topic = `maritime/boats/${uniqueBoatKey}/telemetry`;
  }

  async publishCoordinates(context: any): Promise<void> {
    if (this.telemetryPayload) {
      let success = mqttService.publish(
        this.topic,
        JSON.stringify(this.telemetryPayload),
      );
      if (!success) {
        console.log('MQTT connection lost, switching to local state...');
        context.setTrackerState(context.getSendingLocalState());

        await sqliteService.saveCoordinate(
          this.telemetryPayload.boat_name,
          this.telemetryPayload.owner_email,
          this.telemetryPayload.longitude,
          this.telemetryPayload.latitude,
          this.telemetryPayload.timestamp,
        );
      }
    }
  }
}
