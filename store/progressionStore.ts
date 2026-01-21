


import { create } from 'zustand';
import { useGameStore } from './gameStore';
import { useFactionStore } from './factionStore';
import { useTerritoryStore } from './territoryStore';
import { ProgressionMilestone, ResourceType, FactionId, Faction } from '../types';
import { calculateOfflineProduction } from '../lib/resourceUtils';

interface ProgressionStore {
  totalPlayTime: number; // seconds
  milestones: ProgressionMilestone[];
  
  // Actions
  initGame: () => { offlineReport: string | null };
  checkMilestones: () => void;
  saveProgression: () => any;
  loadProgression: (data: any) => void;
  resetProgression: () => void;
}

const INITIAL_MILESTONES: ProgressionMilestone[] = [
  { id: 'm1', requiredInfluence: 200, title: 'Local Menace', description: 'Unlock better scouting.', unlocked: false },
  { id: 'm2', requiredInfluence: 1000, title: 'Count of Shadows', description: 'Unlock Advanced Magic.', unlocked: false },
  { id: 'm3', requiredInfluence: 5000, title: 'Prince of the City', description: 'Unlock Vampire House Diplomacy.', unlocked: false }
];

export const useProgressionStore = create<ProgressionStore>((set, get) => ({
  totalPlayTime: 0,
  milestones: INITIAL_MILESTONES,

  saveProgression: () => {
    return {
       totalPlayTime: get().totalPlayTime,
       milestones: get().milestones
    };
  },

  loadProgression: (data) => {
    if (data) {
       set({
          totalPlayTime: data.totalPlayTime || 0,
          milestones: data.milestones || INITIAL_MILESTONES
       });
    }
  },

  resetProgression: () => set({ totalPlayTime: 0, milestones: INITIAL_MILESTONES }),

  checkMilestones: () => {
     const game = useGameStore.getState();
     const inf = game.resources[ResourceType.INFLUENCE] || 0;
     
     set(state => {
        let changed = false;
        const newMilestones = state.milestones.map(m => {
           if (!m.unlocked && inf >= m.requiredInfluence) {
               changed = true;
               // Trigger unlock effect (e.g., notify)
               game.addLog({ type: 'Response', action: 'Milestone', data: `Unlocked: ${m.title}` });
               return { ...m, unlocked: true };
           }
           return m;
        });
        return changed ? { milestones: newMilestones } : state;
     });
  },

  initGame: () => {
    const game = useGameStore.getState();
    const factionStore = useFactionStore.getState();
    const territoryStore = useTerritoryStore.getState();
    
    // 1. Calculate Offline Time
    const now = Date.now();
    const lastTick = game.lastTick;
    if (!lastTick) return { offlineReport: null };

    const secondsOffline = (now - lastTick) / 1000;
    
    // Only report if significantly offline (> 60 seconds)
    if (secondsOffline < 60) return { offlineReport: null };

    // 2. Resource Gains
    const gains = calculateOfflineProduction(secondsOffline, game.rates);
    
    // Apply gains
    Object.entries(gains).forEach(([k, v]) => {
        const r = k as ResourceType;
        const current = game.resources[r] || 0;
        // Clamp so we don't go below 0
        game.resources[r] = Math.max(0, current + v);
    });

    // 3. Faction Decay
    const decayAmount = 0.0005 * secondsOffline;
    if (Math.abs(decayAmount) > 1) {
       Object.values(factionStore.factions).forEach((f: Faction) => {
           let target = 0;
           if (f.id === FactionId.CHURCH_INQUISITION) target = -50;
           if (f.id === FactionId.VAMPIRE_HUNTERS) target = -100;

           const diff = target - f.relation;
           const move = diff > 0 ? Math.min(diff, decayAmount) : Math.max(diff, -decayAmount);
           factionStore.modifyRelation(f.id, move * 0.5); 
       });
    }

    // 4. Territory Spread
    const territoryReport = territoryStore.processOfflineInfluence(secondsOffline);

    // 5. Generate Report
    const gainStrings = Object.entries(gains)
       .filter(([_, v]) => v > 1)
       .map(([k, v]) => `+${Math.floor(v)} ${k}`);
    
    let report = gainStrings.length > 0 
       ? `While you slumbered in the coffin for ${(secondsOffline/3600).toFixed(1)} hours:\n\n${gainStrings.join('\n')}`
       : `The night was quiet. No resources gathered.`;

    if (territoryReport) {
        report += `\n\nInfluence Update:\n${territoryReport}`;
    }

    // Sync timestamp
    useGameStore.setState({ lastTick: now });

    return { offlineReport: report };
  }
}));
