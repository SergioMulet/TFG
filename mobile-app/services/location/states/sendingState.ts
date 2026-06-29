import { LocationObject } from 'expo-location';
import { TrackerState } from '../trackerState';
import { mqttService } from '@/services/mqttService';
import { sqliteService } from '@/services/sqliteService';
import { toastService } from '@/services/toastService';

export class SendingState implements TrackerState {
  private topic: string = '';
  private telemetryPayload: {
    ship_id: string;
    owner_email: string;
    ship_type: string;
    longitude: number;
    latitude: number;
    timestamp: string;
  } | null = null;

  saveCoordinates(location: LocationObject, shipId: string, userEmail: string, shipType: string): void {
    this.telemetryPayload = {
      ship_id: shipId,
      owner_email: userEmail,
      ship_type: shipType,
      longitude: location.coords.longitude,
      latitude: location.coords.latitude,
      timestamp: new Date(location.timestamp).toISOString(),
    };

    let uniqueShipKey = `${shipId}-${userEmail}`;
    this.topic = `maritime/boats/${uniqueShipKey}/telemetry`;
  }

  async publishCoordinates(context: any): Promise<void> {
    if (this.telemetryPayload) {
      let success = await mqttService.publish(
        this.topic,
        JSON.stringify(this.telemetryPayload),
      );
      if (!success) {
        console.log('MQTT connection lost, switching to local state...');
        context.setTrackerState(context.getSendingLocalState());
        toastService.show('savingLocally');

        await sqliteService.saveCoordinate(
          this.telemetryPayload.ship_id,
          this.telemetryPayload.owner_email,
          this.telemetryPayload.ship_type,
          this.telemetryPayload.longitude,
          this.telemetryPayload.latitude,
          this.telemetryPayload.timestamp,
        );
      }
    }
  }
}
