//As long as main-server stays reachable on the same host as the web app, just on
// its own port.
const { protocol, hostname } = window.location;
const API_URL = `${protocol}//${hostname}:8080/api`;
const WS_URL = `${protocol === 'https:' ? 'wss' : 'ws'}://${hostname}:8080/ws/ships`;
const RECONNECT_DELAY_MS = 3000;

export const shipService = {
  connectShips(onShips) {
    let socket;
    let closedByClient = false;

    const connect = () => {
      socket = new WebSocket(WS_URL);

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

      socket.onclose = () => {
        if (closedByClient) return;
        console.warn(
          `Ships WebSocket closed, reconnecting in ${RECONNECT_DELAY_MS}ms...`,
        );
        setTimeout(connect, RECONNECT_DELAY_MS);
      };
    };

    connect();

    return {
      close() {
        closedByClient = true;
        socket.close();
      },
    };
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
