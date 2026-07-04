import * as SQLite from 'expo-sqlite';
import { sqliteService } from '@/services/sqliteService';

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

// Shared stub DB — method implementations are set per-test.
const mockDb = {
  execAsync: jest.fn().mockResolvedValue(undefined),
  runAsync: jest.fn().mockResolvedValue(undefined),
  getAllAsync: jest.fn().mockResolvedValue([]),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockDb.execAsync.mockResolvedValue(undefined);
  mockDb.runAsync.mockResolvedValue(undefined);
  mockDb.getAllAsync.mockResolvedValue([]);
  // Reset the singleton's cached db so each test triggers a fresh initDB().
  (sqliteService as any).db = null;
  (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
});

describe('sqliteService', () => {
  it('a saved coordinate is retrievable', async () => {
    const store: any[] = [];
    mockDb.runAsync.mockImplementation(async (_sql: string, params: any[]) => {
      store.push({
        id: store.length + 1,
        ship_id: params[0],
        owner_email: params[1],
        ship_type: params[2],
        longitude: params[3],
        latitude: params[4],
        timestamp: params[5],
      });
    });
    mockDb.getAllAsync.mockImplementation(async () => [...store]);

    await sqliteService.saveCoordinate(
      'TestShip',
      'owner@test.com',
      'yacht',
      2.1734,
      41.3851,
      '2025-01-01T00:00:00.000Z',
    );
    const rows = await sqliteService.getAllCoordinates();

    expect(rows).toHaveLength(1);
    expect(rows![0]).toMatchObject({
      ship_id: 'TestShip',
      owner_email: 'owner@test.com',
      ship_type: 'yacht',
      longitude: 2.1734,
      latitude: 41.3851,
      timestamp: '2025-01-01T00:00:00.000Z',
    });
  });

  it('records are returned in insertion order', async () => {
    const store: any[] = [];
    mockDb.runAsync.mockImplementation(async (_sql: string, params: any[]) => {
      store.push({ id: store.length + 1, ship_id: params[0] });
    });
    mockDb.getAllAsync.mockImplementation(async () => [...store]);

    await sqliteService.saveCoordinate(
      'Alpha',
      'u@u.com',
      'cargo',
      1,
      1,
      '2025-01-01T00:00:00.000Z',
    );
    await sqliteService.saveCoordinate(
      'Beta',
      'u@u.com',
      'cargo',
      2,
      2,
      '2025-01-01T00:01:00.000Z',
    );
    await sqliteService.saveCoordinate(
      'Gamma',
      'u@u.com',
      'cargo',
      3,
      3,
      '2025-01-01T00:02:00.000Z',
    );
    const rows = await sqliteService.getAllCoordinates();

    expect(rows!.map((r: any) => r.ship_id)).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  it('clearing empties the buffer', async () => {
    const store: any[] = [];
    mockDb.runAsync.mockImplementation(async (sql: string, params: any[]) => {
      if (sql.trim().toUpperCase().startsWith('INSERT')) {
        store.push({ id: store.length + 1, ship_id: params[0] });
      } else if (sql.trim().toUpperCase().startsWith('DELETE')) {
        store.length = 0;
      }
    });
    mockDb.getAllAsync.mockImplementation(async () => [...store]);

    await sqliteService.saveCoordinate(
      'Ship1',
      'u@u.com',
      'cargo',
      1,
      1,
      '2025-01-01T00:00:00.000Z',
    );
    await sqliteService.clearDatabase();
    const rows = await sqliteService.getAllCoordinates();

    expect(rows).toHaveLength(0);
  });
});
