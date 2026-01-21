
import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useFactionStore } from '../store/factionStore';
import { useTerritoryStore } from '../store/territoryStore';
import { useProgressionStore } from '../store/progressionStore';

export const GameInitializer = ({ onReport }: { onReport: (r: string) => void }) => {
    const { tick, saveState, loadState } = useGameStore();
    const factionTick = useFactionStore(s => s.tick);
    const territoryTick = useTerritoryStore(s => s.tick);
    const { initGame, checkMilestones } = useProgressionStore();
    
    // Ticker
    useEffect(() => {
        const interval = setInterval(() => {
           tick(1.0);
           factionTick(1.0);
           territoryTick(1.0);
           checkMilestones();
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Init Logic (Once)
    useEffect(() => {
       loadState(); 
       
       const saved = localStorage.getItem('nocturnal_save_default');
       if (saved) {
           const parsed = JSON.parse(saved);
           if (parsed.territories) useTerritoryStore.getState().loadTerritories(parsed.territories);
       }

       // Force init world check
       const state = useGameStore.getState();
       const firstBuilding = state.buildings[0];
       
       if (firstBuilding) {
           useTerritoryStore.getState().initializeWorld(firstBuilding.lat, firstBuilding.lng);
           
           // SYNC CITADEL RADIUS
           const citadel = state.buildings.find(b => b.defId === 'dark_citadel');
           if (citadel) {
               useTerritoryStore.getState().updateHomeBaseRadius(citadel.level);
           }
       } 
       
       const { offlineReport } = initGame();
       if (offlineReport) onReport(offlineReport);
    }, []);

    // Auto-Save
    useEffect(() => {
        const saver = setInterval(() => {
            saveState();
        }, 5000);
        return () => clearInterval(saver);
    }, []);

    return null;
}
