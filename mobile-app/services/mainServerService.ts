export const API_URL = process.env.EXPO_PUBLIC_SERVER_URL;

class MainServerService {
  async getShipDetails(userEmail: string | null) {
    if (!userEmail) return null;

    try {
      const response = await fetch(
        `${API_URL}/ships/owner/${encodeURIComponent(userEmail)}`,
      );
      if (!response.ok || response.status === 204) return null;

      const data = await response.json();
      return data;
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
