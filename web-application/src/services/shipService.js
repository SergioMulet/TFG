const API_URL = 'http://localhost:8080/api';
const WS_URL = 'ws://localhost:8080/ws/ships';

export const shipService = {
  connectShips(onShips) {
    const socket = new WebSocket(WS_URL);

    socket.onmessage = (event) => {
      try {
        onShips(JSON.parse(event.data));
      } catch (error) {
        console.error('Error parsing ships payload:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('Ships WebSocket error:', error);
    };

    return socket;
  },

  async getShipDetails(shipId) {
    try {
      const response = await fetch(`${API_URL}/ships/${shipId}`);
      if (!response.ok) throw new Error('Network repsonse was not ok');
      return await response.json();
    } catch (error) {
      console.error('Error fetching ship details:', error);
      return [];
    }
  },
};
