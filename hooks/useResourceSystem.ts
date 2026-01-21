import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

export const useResourceSystem = () => {
  const store = useGameStore();
  const [offlineGains, setOfflineGains] = useState(null);

  // Init
  useEffect(() => {
    const result = store.loadState();
    // In a real impl, result.offlineGains would be set here
  }, []);

  // Save Loop
  useEffect(() => {
    const saveInterval = setInterval(() => {
      const { resources, buildings, army, activeQuests, lastTick, playerLevel, location } = useGameStore.getState();
      const stateToSave = { resources, buildings, army, activeQuests, lastTick, playerLevel, location };
      localStorage.setItem('nocturnal_dominion_v1', JSON.stringify(stateToSave));
    }, 5000);
    return () => clearInterval(saveInterval);
  }, []);

  // Game Loop
  useEffect(() => {
    const interval = setInterval(() => {
      // 1 second ticks
      store.tick(1.0);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    gameState: store, // The store itself acts as the state object for the UI
    metrics: { 
      rates: store.rates,
      modifiers: { night: 1, global: 1, corruption: 1 } // Simplified for now
    },
    actions: {
      addBuilding: store.constructBuilding,
      recruitUnit: store.recruitUnit,
      setLocation: store.setLocation,
      loadState: store.loadState
    },
    offlineGains,
    clearOfflineGains: () => setOfflineGains(null)
  };
};