import * as Location from 'expo-location';
import { mqttService } from '@/services/mqttService';
import { TrackerState } from './tracker_state';
import { NotSendingState } from './states/not_sending_state';
import { SendingLocalState } from './states/sending_local_state';
import { SendingState } from './states/sending_state';

const TRACKING_INTERVAL_MS = 10000;

export interface TrackerUpdate {
  location: Location.LocationObject;
}

export class LocationTracker {
  private trackerState: TrackerState = new NotSendingState();

  private readonly notSendingState = new NotSendingState();
  private readonly sendingState = new SendingState();
  private readonly sendingLocalState = new SendingLocalState();

  private intervalId: ReturnType<typeof setInterval> | null = null;
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

  private async track(boatName: string, userEmail: string): Promise<void> {
    // If offline, attempt reconnect + sync on every track
    if (this.trackerState instanceof SendingLocalState) {
      await this.tryReconnectAndSync();
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    this.trackerState.saveCoordinates(location, boatName, userEmail);
    await this.trackerState.publishCoordinates(this);

    this.onUpdate?.({ location });
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
    this.onUpdate = onUpdate;

    const connected = await this.connectMqtt();
    this.trackerState = connected ? this.sendingState : this.sendingLocalState;

    // First track immediately, then every 10s
    await this.track(boatName, userEmail);
    this.intervalId = setInterval(
      () => this.track(boatName, userEmail),
      TRACKING_INTERVAL_MS,
    );
  }

  public stopTracking(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.trackerState = this.notSendingState;
    mqttService.disconnect();
    this.onUpdate = null;
  }
}

export const locationTracker = new LocationTracker();
