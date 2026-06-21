import * as Location from 'expo-location';
import { mqttService } from '@/services/mqttService';
import { TrackerState } from './tracker_state';
import { NotSendingState } from './states/not_sending_state';
import { SendingLocalState } from './states/sending_local_state';
import { SendingState } from './states/sending_state';

const TRACKING_INTERVAL_MS = 10000;
export const BACKGROUND_LOCATION_TASK_NAME = 'background-location-task';

export interface TrackerUpdate {
  location: Location.LocationObject;
}

export class LocationTracker {
  private trackerState: TrackerState = new NotSendingState();

  private readonly notSendingState = new NotSendingState();
  private readonly sendingState = new SendingState();
  private readonly sendingLocalState = new SendingLocalState();

  private boatName = '';
  private userEmail = '';
  private onUpdate: ((update: TrackerUpdate) => void) | null = null;

  private async connectMqtt(): Promise<boolean> {
    try {
      mqttService.connect();
      await mqttService.waitForConnection();
      return true;
    } catch (error) {
      console.warn("Couldn't connect to MQTT, switching to local DB");
      this.trackerState = this.sendingLocalState;
      return false;
    }
  }

  private async tryReconnectAndSync(): Promise<boolean> {
    let isConnected = await this.connectMqtt();
    if (!isConnected) return false;

    try {
      await this.trackerState.publishCoordinates(this);
    } catch (error) {
      console.error('Sync to main server failed, staying in local mode:', error);
      return false;
    }

    this.trackerState = this.sendingState;
    return true;
  }

  private async handleLocation(location: Location.LocationObject): Promise<void> {
    // If offline, attempt reconnect + sync on every update
    if (this.trackerState instanceof SendingLocalState) {
      await this.tryReconnectAndSync();
    }

    this.trackerState.saveCoordinates(location, this.boatName, this.userEmail);
    await this.trackerState.publishCoordinates(this);

    this.onUpdate?.({ location });
  }

  public async processBackgroundLocations(locations: Location.LocationObject[]): Promise<void> {
    for (const location of locations) {
      await this.handleLocation(location);
    }
  }

  public setTrackerState(state: TrackerState) {
    this.trackerState = state;
  }
  public getSendingLocalState() {
    return this.sendingLocalState;
  }
  public getSendingState() {
    return this.sendingState;
  }

  public async startTracking(
    boatName: string,
    userEmail: string,
    onUpdate: (update: TrackerUpdate) => void,
  ): Promise<void> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.warn(
        'Background location permission not granted, tracking will pause while the app is backgrounded',
      );
    }

    this.boatName = boatName;
    this.userEmail = userEmail;
    this.onUpdate = onUpdate;

    const connected = await this.connectMqtt();
    this.trackerState = connected ? this.sendingState : this.sendingLocalState;

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: TRACKING_INTERVAL_MS,
      distanceInterval: 0,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Seguimiento de ubicación activo',
        notificationBody: 'Enviando la posición del barco al servidor',
      },
    });
  }

  public async stopTracking(): Promise<void> {
    if (await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME)) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME);
    }
    this.trackerState = this.notSendingState;
    mqttService.disconnect();
    this.onUpdate = null;
  }
}

export const locationTracker = new LocationTracker();
