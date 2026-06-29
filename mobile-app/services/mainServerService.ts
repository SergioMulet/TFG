import * as Location from 'expo-location';
import { authContextManager } from '@/services/auth/authContext';

export const API_URL = process.env.EXPO_PUBLIC_SERVER_URL;

export type RegisterShipResult =
  | { success: true }
  | { success: false; reason: 'location_permission' | 'error' };

export interface ShipSummary {
  id: string;
  lat: number;
  lng: number;
  type: string;
}

class MainServerService {
  // Used to detect a new boat - owner combination
  async isShipRegistered(shipId: string, userEmail: string): Promise<boolean> {
    try {
      const params = new URLSearchParams({ ship_id: shipId, owner_email: userEmail });
      const response = await fetch(`${API_URL}/ships/registered?${params.toString()}`);
      if (!response.ok) return false;

      const data = await response.json();
      return Boolean(data.registered);
    } catch (error) {
      console.error('Error checking ship registration: ', error);
      return false;
    }
  }

  // Lists every ship ever registered by this owner, for the Settings picker.
  async getShipsByOwner(userEmail: string | null): Promise<ShipSummary[]> {
    if (!userEmail) return [];

    try {
      const response = await fetch(
        `${API_URL}/ships/owner/${encodeURIComponent(userEmail)}/list`,
      );
      if (!response.ok) return [];

      const data = await response.json();
      return data ?? [];
    } catch (error) {
      console.error('Error fetching ships list: ', error);
      return [];
    }
  }

  // Permanently erases a ship's tracking history.
  async deleteShip(shipId: string, ownerEmail: string): Promise<boolean> {
    try {
      const params = new URLSearchParams({ owner_email: ownerEmail });
      const response = await fetch(
        `${API_URL}/ships/${encodeURIComponent(shipId)}?${params.toString()}`,
        { method: 'DELETE' },
      );
      return response.ok;
    } catch (error) {
      console.error('Error deleting ship: ', error);
      return false;
    }
  }

  // Requests the device's current location and sends it as the new ship's
  // first telemetry point, which is what makes the backend consider it
  // registered for this owner from then on.
  async registerShip(
    shipId: string,
    shipType: string,
    ownerEmail: string,
  ): Promise<RegisterShipResult> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return { success: false, reason: 'location_permission' };
      }
      const position = await Location.getCurrentPositionAsync({});

      const token = await authContextManager.getToken();
      const response = await fetch(`${API_URL}/telemetry/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify([
          {
            ship_id: shipId,
            owner_email: ownerEmail,
            ship_type: shipType,
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
            timestamp: new Date(position.timestamp).toISOString(),
          },
        ]),
      });

      if (!response.ok) throw new Error(`Registration failed: ${response.status}`);
      return { success: true };
    } catch (error) {
      console.error('Error registering ship: ', error);
      return { success: false, reason: 'error' };
    }
  }
}

export const mainServerService = new MainServerService();
