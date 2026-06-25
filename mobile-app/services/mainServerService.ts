const API_URL = 'http://192.168.1.132:8080/api';

class MainServerService {
  async getShipName(userEmail: string | null): Promise<string | null> {
    if (!userEmail) return null;

    try {
      const response = await fetch(`${API_URL}/ships/${encodeURIComponent(userEmail)}`);
      if (!response.ok) return null;

      const data = await response.json();
      return data.boat_name || null;
    } catch (error) {
      console.error('Error fetching boat name: ', error);
      return null;
    }
  }
}

export const mainServerService = new MainServerService();
