const API_URL = 'http://192.168.1.132:8080/api';

class MainServerService {
  async getShipName(userEmail: string | null): Promise<string | null> {
    if (!userEmail) return null;

    try {
      const response = await fetch(
        `${API_URL}/ships/owner/${encodeURIComponent(userEmail)}`,
      );
      if (!response.ok) return null;

      const data = await response.json();
      return data.ship_id || null;
    } catch (error) {
      console.error('Error fetching boat name: ', error);
      return null;
    }
  }

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
}

export const mainServerService = new MainServerService();
