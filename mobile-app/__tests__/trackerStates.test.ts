import type { LocationObject } from 'expo-location';

import { NotSendingState } from '@/services/location/states/notSendingState';
import { SendingState } from '@/services/location/states/sendingState';
import { SendingLocalState } from '@/services/location/states/sendingLocalState';

// ── mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/services/mqttService', () => ({
  mqttService: {
    publish: jest.fn(),
    connect: jest.fn(),
    waitForConnection: jest.fn(),
    disconnect: jest.fn(),
  },
}));
jest.mock('@/services/sqliteService', () => ({
  sqliteService: {
    saveCoordinate: jest.fn(),
    getAllCoordinates: jest.fn(),
    clearDatabase: jest.fn(),
  },
}));
jest.mock('@/services/toastService', () => ({
  toastService: { show: jest.fn() },
}));
jest.mock('@/services/auth/authContext', () => ({
  authContextManager: { getToken: jest.fn() },
}));
jest.mock('expo-location', () => ({}));

import { mqttService } from '@/services/mqttService';
import { sqliteService } from '@/services/sqliteService';
import { authContextManager } from '@/services/auth/authContext';

// ── shared fixture ────────────────────────────────────────────────────────────

const GPS_TIMESTAMP_MS = 1_700_000_000_000;
const GPS_ISO = new Date(GPS_TIMESTAMP_MS).toISOString();

const fakeLocation: LocationObject = {
  coords: {
    latitude: 41.3851,
    longitude: 2.1734,
    altitude: null,
    accuracy: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  timestamp: GPS_TIMESTAMP_MS,
  mocked: false,
};

beforeEach(() => jest.clearAllMocks());

// ── NotSendingState ───────────────────────────────────────────────────────────

describe('NotSendingState', () => {
  const state = new NotSendingState();

  it('publishCoordinates is a no-op — MQTT is never called', async () => {
    state.publishCoordinates({} as any);
    expect(mqttService.publish).not.toHaveBeenCalled();
  });

  it('saveCoordinates is a no-op — SQLite is never called', () => {
    state.saveCoordinates(fakeLocation, 'ship1', 'owner@test.com', 'yacht');
    expect(sqliteService.saveCoordinate).not.toHaveBeenCalled();
  });
});

// ── SendingState ──────────────────────────────────────────────────────────────

describe('SendingState', () => {
  let state: SendingState;
  let ctx: { setTrackerState: jest.Mock; getSendingLocalState: jest.Mock };

  beforeEach(() => {
    state = new SendingState();
    ctx = {
      setTrackerState: jest.fn(),
      getSendingLocalState: jest.fn().mockReturnValue('LOCAL_STATE'),
    };
  });

  it('on failed publish — persists fix to SQLite and switches to local state', async () => {
    (mqttService.publish as jest.Mock).mockResolvedValue(false);
    state.saveCoordinates(fakeLocation, 'ship1', 'owner@test.com', 'yacht');
    await state.publishCoordinates(ctx);

    expect(sqliteService.saveCoordinate).toHaveBeenCalledTimes(1);
    expect(ctx.setTrackerState).toHaveBeenCalledWith('LOCAL_STATE');
  });

  it('on successful publish — does not persist to SQLite and stays in current state', async () => {
    (mqttService.publish as jest.Mock).mockResolvedValue(true);
    state.saveCoordinates(fakeLocation, 'ship1', 'owner@test.com', 'yacht');
    await state.publishCoordinates(ctx);

    expect(sqliteService.saveCoordinate).not.toHaveBeenCalled();
    expect(ctx.setTrackerState).not.toHaveBeenCalled();
  });

  it('builds the topic as maritime/boats/{shipId}-{email}/telemetry', async () => {
    (mqttService.publish as jest.Mock).mockResolvedValue(true);
    state.saveCoordinates(fakeLocation, 'Abarth', 'owner@test.com', 'other');
    await state.publishCoordinates(ctx);

    const [calledTopic] = (mqttService.publish as jest.Mock).mock.calls[0];
    expect(calledTopic).toBe('maritime/boats/Abarth-owner@test.com/telemetry');
  });

  it('uses the GPS-fix timestamp (not wall-clock time) in the telemetry payload', async () => {
    (mqttService.publish as jest.Mock).mockResolvedValue(true);
    state.saveCoordinates(fakeLocation, 'ship1', 'owner@test.com', 'yacht');
    await state.publishCoordinates(ctx);

    const payload = JSON.parse((mqttService.publish as jest.Mock).mock.calls[0][1]);
    expect(payload.timestamp).toBe(GPS_ISO);
  });
});

// ── SendingLocalState ─────────────────────────────────────────────────────────

describe('SendingLocalState', () => {
  let state: SendingLocalState;

  beforeEach(() => {
    state = new SendingLocalState();
    (authContextManager.getToken as jest.Mock).mockResolvedValue('valid-token');
  });

  it('empties the buffer on a successful sync', async () => {
    (sqliteService.getAllCoordinates as jest.Mock).mockResolvedValue([
      {
        ship_id: 'ship1',
        latitude: 41,
        longitude: 2,
        owner_email: 'o@o.com',
        ship_type: 'yacht',
        timestamp: GPS_ISO,
      },
    ]);
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    await state.publishCoordinates();

    expect(sqliteService.clearDatabase).toHaveBeenCalledTimes(1);
  });

  it('does not clear the buffer when the sync fails', async () => {
    (sqliteService.getAllCoordinates as jest.Mock).mockResolvedValue([
      {
        ship_id: 'ship1',
        latitude: 41,
        longitude: 2,
        owner_email: 'o@o.com',
        ship_type: 'yacht',
        timestamp: GPS_ISO,
      },
    ]);
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: jest.fn().mockResolvedValue('Service Unavailable'),
    });

    await state.publishCoordinates();

    expect(sqliteService.clearDatabase).not.toHaveBeenCalled();
  });

  it('saves the GPS-fix timestamp (not wall-clock time) to SQLite', () => {
    state.saveCoordinates(fakeLocation, 'ship1', 'owner@test.com', 'yacht');

    expect(sqliteService.saveCoordinate).toHaveBeenCalledWith(
      'ship1',
      'owner@test.com',
      'yacht',
      fakeLocation.coords.longitude,
      fakeLocation.coords.latitude,
      GPS_ISO,
    );
  });
});

// ── LocationTracker state transition ──────────────────────────────────────────
// The "return to SendingState" after a successful sync is orchestrated by
// LocationTracker.tryReconnectAndSync(), which calls sendingLocalState
// .publishCoordinates() and then sets the active state back to sendingState.

describe('LocationTracker — transitions from SendingLocalState back to SendingState', () => {
  it('switches to SendingState after a successful buffer sync', async () => {
    const { LocationTracker } = require('@/services/location/locationTracker');
    const tracker = new LocationTracker();

    (tracker as any).setState((tracker as any).sendingLocalState);

    (mqttService.connect as jest.Mock).mockImplementation(() => {});
    (mqttService.waitForConnection as jest.Mock).mockResolvedValue(undefined);
    jest
      .spyOn((tracker as any).sendingLocalState, 'publishCoordinates')
      .mockResolvedValue(undefined);

    await (tracker as any).tryReconnectAndSync();

    expect((tracker as any).trackerState).toBe((tracker as any).sendingState);
  });
});
