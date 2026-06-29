import * as Location from 'expo-location';
import { AppState, AppStateStatus } from 'react-native';
import { mqttService } from '@/services/mqttService';
import { toastService } from '@/services/toastService';
import { TrackerState } from './trackerState';
import { NotSendingState } from './states/notSendingState';
import { SendingLocalState } from './states/sendingLocalState';
import { SendingState } from './states/sendingState';

const TRACKING_INTERVAL_MS = 30000;
const TRACKING_DISTANCE_INTERVAL_M = 50;
export const BACKGROUND_LOCATION_TASK_NAME = 'background-location-task';

export interface TrackerUpdate {
  location: Location.LocationObject;
}

export class LocationTracker {
  private trackerState: TrackerState = new NotSendingState();

  private readonly notSendingState = new NotSendingState();
  private readonly sendingState = new SendingState();
  private readonly sendingLocalState = new SendingLocalState();

  private shipId = '';
  private userEmail = '';
  private shipType = '';
  private onUpdate: ((update: TrackerUpdate) => void) | null = null;

  constructor() {
    // Resync as soon as the app comes back to the foreground, instead of
    // waiting for the next periodic location update to notice we're offline.
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  private handleAppStateChange = (nextState: AppStateStatus) => {
    if (nextState === 'active' && this.trackerState instanceof SendingLocalState) {
      this.tryReconnectAndSync();
    }
  };

  private async connectMqtt(): Promise<boolean> {
    try {
      mqttService.connect();
      await mqttService.waitForConnection();
      return true;
    } catch (error) {
      console.warn("Couldn't connect to MQTT, switching to local DB");
      this.trackerState = this.sendingLocalState;
      toastService.show('savingLocally');
      return false;
    }
  }

  private async tryReconnectAndSync(): Promise<boolean> {
    let isConnected = await this.connectMqtt();
    if (!isConnected) return false;

    toastService.show('syncingData');

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

    this.trackerState.saveCoordinates(
      location,
      this.shipId,
      this.userEmail,
      this.shipType,
    );
    await this.trackerState.publishCoordinates(this);

    this.onUpdate?.({ location });
  }

  public async processBackgroundLocations(
    locations: Location.LocationObject[],
  ): Promise<void> {
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
    shipId: string,
    userEmail: string,
    shipType: string,
    onUpdate: (update: TrackerUpdate) => void,
  ): Promise<void> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }

    const { status: backgroundStatus } =
      await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.warn(
        'Background location permission not granted, tracking will pause while the app is backgrounded',
      );
    }

    this.shipId = shipId;
    this.userEmail = userEmail;
    this.shipType = shipType;
    this.onUpdate = onUpdate;

    const connected = await this.connectMqtt();
    this.trackerState = connected ? this.sendingState : this.sendingLocalState;

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: TRACKING_INTERVAL_MS,
      distanceInterval: TRACKING_DISTANCE_INTERVAL_M,
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
