import { shipService } from '../services/shipService';

export const shipLoader = {
  subscribeToShips: (setShipState) => {
    console.log('[ShipLoader] subscribing to ship updates');
    const socket = shipService.connectShips(setShipState);
    return () => socket.close();
  },

  loadDetails: async (shipId, setRouteState) => {
    console.log(`[ShipLoader] Searching routes for: ${shipId}`);
    const coordinates = await shipService.getShipDetails(shipId);
    setRouteState(coordinates);
  },
};
