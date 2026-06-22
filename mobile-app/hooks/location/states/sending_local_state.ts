import { LocationObject } from 'expo-location';

import { TrackerState } from '../tracker_state';
import { sqliteService } from '@/services/sqliteService';
import { authContextManager } from '@/services/auth/auth.context';

export class SendingLocalState implements TrackerState {
  saveCoordinates(location: LocationObject, boatName: string, userEmail: string): void {
    sqliteService.saveCoordinate(
      boatName,
      userEmail,
      location.coords.longitude,
      location.coords.latitude,
      new Date(location.timestamp).toISOString(),
    );
  }

  async publishCoordinates(): Promise<void> {
    let token = await authContextManager.getToken();
    if (!token || typeof token !== 'string') {
      throw new Error('[Auth] No se pudo obtener un token de autenticación válido.');
    }

    let offlineTelemetry = await sqliteService.getAllCoordinates();
    try {
      if (!offlineTelemetry || offlineTelemetry.length === 0) {
        console.warn('There is no data to synchronize');
        return;
      }

      // HTTP request to mian server
      const response = await fetch('http://192.168.1.132:8080/api/telemetry/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(offlineTelemetry),
      });

      if (response.ok) {
        console.log('The synchronization succeed. Clearing DB');
        await sqliteService.clearDatabase();
      } else {
        const body = await response.text();
        console.error(`Sync failed [${response.status}]:`, body);
        throw new Error(`Sync failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Error while synchronizing with mian server: ', error);
    }
  }
}
