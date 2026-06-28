import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SelectedShipContextType {
  selectedShipId: string | null;
  setSelectedShipId: (shipId: string | null) => void;
}

const SelectedShipContext = createContext<SelectedShipContextType>({
  selectedShipId: null,
  setSelectedShipId: () => {},
});

// global useState
export function SelectedShipProvider({ children }: { children: React.ReactNode }) {
  const [selectedShipId, setSelectedShipIdState] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('@selected_ship_id').then((saved) => {
      if (saved) setSelectedShipIdState(saved);
    });
  }, []);

  const setAndSaveSelectedShipId = async (shipId: string | null) => {
    setSelectedShipIdState(shipId);
    try {
      if (shipId) {
        await AsyncStorage.setItem('@selected_ship_id', shipId);
      } else {
        await AsyncStorage.removeItem('@selected_ship_id');
      }
    } catch (error) {
      console.error('Error saving selected ship to disk:', error);
    }
  };

  return (
    <SelectedShipContext.Provider
      value={{ selectedShipId, setSelectedShipId: setAndSaveSelectedShipId }}
    >
      {children}
    </SelectedShipContext.Provider>
  );
}

const useSelectedShip = () => useContext(SelectedShipContext);

export default useSelectedShip;
