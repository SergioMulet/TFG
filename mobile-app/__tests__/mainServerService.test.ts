import { mainServerService } from '@/services/mainServerService';

jest.mock('@/services/auth/authContext', () => ({
  authContextManager: { getToken: jest.fn() },
}));
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

import { authContextManager } from '@/services/auth/authContext';
import * as Location from 'expo-location';

const BEARER = 'test-bearer-token';

beforeEach(() => {
  jest.clearAllMocks();
  (authContextManager.getToken as jest.Mock).mockResolvedValue(BEARER);
  (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
    status: 'granted',
  });
  (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
    coords: { latitude: 41.3851, longitude: 2.1734 },
    timestamp: 1_700_000_000_000,
  });
});

// Bearer token

describe('bearer token is included in authenticated requests', () => {
  it('registerShip sends Authorization: Bearer <token>', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    await mainServerService.registerShip('ship1', 'yacht', 'owner@test.com');

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers['Authorization']).toBe(`Bearer ${BEARER}`);
  });

  it('uploadShipImage sends Authorization: Bearer <token>', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    await mainServerService.uploadShipImage('ship1', 'file:///photo.jpg');

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers['Authorization']).toBe(`Bearer ${BEARER}`);
  });
});

// Non-OK responses — no data loss, no uncaught throw

describe('non-OK responses are handled safely', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
  });

  it('getShipsByOwner returns [] and does not throw', async () => {
    const result = await mainServerService.getShipsByOwner('owner@test.com');
    expect(result).toEqual([]);
  });

  it('deleteShip returns false and does not throw', async () => {
    const result = await mainServerService.deleteShip('ship1', 'owner@test.com');
    expect(result).toBe(false);
  });

  it('isShipRegistered returns false and does not throw', async () => {
    const result = await mainServerService.isShipRegistered('ship1', 'owner@test.com');
    expect(result).toBe(false);
  });

  it('registerShip returns { success: false, reason: "error" } and does not throw', async () => {
    const result = await mainServerService.registerShip(
      'ship1',
      'yacht',
      'owner@test.com',
    );
    expect(result).toEqual({ success: false, reason: 'error' });
  });
});
