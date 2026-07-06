import { shipService } from '../services/shipService';

export const shipLoader = {
  subscribeToShips: (setShipState) => {
    console.log('[ShipLoader] subscribing to ship updates');
    const socket = shipService.connectShips(setShipState);
    return () => socket.close();
  },

  loadDetails: async (shipId, setShipDetails) => {
    const details = await shipService.getShipDetails(shipId);
    setShipDetails(details);
  },

  loadRoute: async (shipId) => {
    return await shipService.getShipRoute(shipId);
  },
};
