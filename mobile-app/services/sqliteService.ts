import * as SQLite from 'expo-sqlite';

class SqliteService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initDB() {
    if (this.db) return;

    try {
      this.db = await SQLite.openDatabaseAsync('maritime_offline.db');

      await this.db.execAsync(`
            CREATE TABLE IF NOT EXISTS offline_telemetry (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          boat_name TEXT,
          owner_email TEXT,
          ship_type TEXT,
          longitude REAL,
          latitude REAL,
          timestamp TEXT
        );
            `);
    } catch (error) {
      console.error('Error while initializing SQLiteDB, trying again...');
      await this.initDB();
    }
  }

  async saveCoordinate(
    boatName: string,
    email: string,
    shipType: string,
    lon: number,
    lat: number,
    timestamp: string,
  ) {
    if (!this.db) await this.initDB();
    try {
      await this.db?.runAsync(
        `INSERT INTO offline_telemetry (boat_name, owner_email, ship_type, longitude, latitude, timestamp) VALUES (?, ?, ?, ?, ?, ?);`,
        [boatName, email, shipType, lon, lat, timestamp],
      );
      console.log('Coordenada guardada en local');
    } catch (error) {
      console.error('An error occured while saving coordinates in local: ', error);
    }
  }

  async getAllCoordinates() {
    if (!this.db) await this.initDB();
    try {
      let allRows = await this.db?.getAllAsync<{
        id: number;
        boat_name: string;
        owner_email: string;
        ship_type: string;
        longitude: number;
        latitude: number;
        timestamp: string;
      }>('SELECT * FROM offline_telemetry ORDER BY id ASC;');
      return allRows;
    } catch (error) {
      console.error('Error while getting all coordinates: ', error);
    }
  }

  async clearDatabase() {
    if (!this.db) return;
    try {
      await this.db.runAsync('DELETE FROM offline_telemetry');
      console.log('DB has been cleared');
    } catch (error) {
      console.error('Error while clearing DB');
    }
  }
}

export const sqliteService = new SqliteService();
