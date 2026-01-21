
import { create } from 'zustand';
import { 
  GameState, INITIAL_STATE, ResourceType, ActiveBuilding, ArmyStack,
  BUILDING_DEFINITIONS, UNIT_DEFINITIONS, ScoutResult, LogEntry,
  TECH_DEFINITIONS, TechEffectType, BuildingPlacement, FactionId, UnitTier,
  Item, TerrainType, UNIT_DEFINITIONS as UDEFS // Alias
} from '../types';
import { getNightMultiplier } from '../lib/resourceUtils';
import { useFactionStore } from './factionStore';
import { useProgressionStore } from './progressionStore';
import { useTerritoryStore } from './territoryStore';
import { generateResearchLore } from '../services/geminiService';

export interface RateDetailItem {
  name: string;
  rate: number;
}

export interface RateDetail {
  net: number;
  production: RateDetailItem[];
  consumption: RateDetailItem[];
}

interface GameStore extends GameState {
  // Actions
  tick: (deltaSeconds: number) => void;
  constructBuilding: (site: ScoutResult) => { success: boolean; message: string };
  constructManualBuilding: (defId: string, lat: number, lng: number, name: string) => { success: boolean; message: string };
  upgradeBuilding: (uid: string) => { success: boolean; message: string };
  togglePauseBuilding: (uid: string) => { success: boolean; message: string };
  destroyBuilding: (uid: string) => { success: boolean; message: string };
  moveBuilding: (uid: string, lat: number, lng: number) => { success: boolean; message: string };
  assignSlaves: (uid: string, count: number) => { success: boolean, message?: string };
  recruitUnit: (defId: string, multiplier?: number) => { success: boolean; message: string };
  cancelRecruitment: (orderId: string) => { success: boolean; message: string };
  upgradeUnitStack: (stackUid: string) => { success: boolean; message: string };
  startResearch: (techId: string) => { success: boolean; message: string };
  setLocation: (lat: number, lng: number) => void;
  loadState: () => void;
  saveState: () => void;
  resetGame: () => void;
  addScoutResults: (results: ScoutResult[]) => void;
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  
  // Hero
  equipItem: (heroUid: string, itemId: string) => { success: boolean; message: string };

  // Auth
  login: (username: string, password?: string) => { success: boolean; message: string };
  register: (username: string, password?: string) => { success: boolean; message: string };

  // Computed
  rates: Record<ResourceType, number>;
  ratesDetails: Record<ResourceType, RateDetail>;
  getHeroCap: () => number;

  playerName?: string;
}

export const getUpgradeCost = (defId: string, currentLevel: number): Partial<Record<ResourceType, number>> => {
  const def = BUILDING_DEFINITIONS[defId];
  const cost: Partial<Record<ResourceType, number>> = {};
  const multiplier = Math.pow(def.costScaling, currentLevel); 

  Object.entries(def.baseCost).forEach(([res, amount]) => {
    cost[res as ResourceType] = Math.floor(amount * multiplier);
  });
  return cost;
};

export const getMaxSlaves = (defId: string, level: number): number => {
  const def = BUILDING_DEFINITIONS[defId];
  return def.maxSlavesBase * level;
};

const SAVE_KEY = 'nocturnal_save_default';
const GLOBAL_ARMY_CAP = 500000;

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL_STATE,
  rates: Object.values(ResourceType).reduce((acc, r) => ({ ...acc, [r]: 0 }), {} as Record<ResourceType, number>),
  ratesDetails: Object.values(ResourceType).reduce((acc, r) => ({ 
      ...acc, 
      [r]: { net: 0, production: [], consumption: [] } 
  }), {} as Record<ResourceType, RateDetail>),
  playerName: undefined,

  getHeroCap: () => {
      const state = get();
      let cap = 0; 
      state.buildings.forEach(b => {
          if (b.defId === 'dark_citadel' && !b.paused) cap += 1;
          if (b.defId === 'hall_of_lords' && !b.paused) cap += 1;
          if (b.defId === 'vampire_manor' && !b.paused) cap += 1;
          if (b.defId === 'throne_of_night' && !b.paused) cap += 2;
      });
      return cap;
  },

  equipItem: (heroUid, itemId) => {
      const state = get();
      const heroIndex = state.army.findIndex(u => u.uid === heroUid);
      if (heroIndex === -1) return { success: false, message: "Hero not found" };
      const hero = state.army[heroIndex];
      const itemIndex = state.inventory.findIndex(i => i.id === itemId);
      if (itemIndex === -1) return { success: false, message: "Item not in inventory" };
      
      // Equip Logic (Simulated by adding to array)
      const newInventory = [...state.inventory];
      newInventory.splice(itemIndex, 1);
      
      const newArmy = [...state.army];
      // Only equip if slot empty? Simplified: Just push ID
      newArmy[heroIndex] = { 
          ...hero, 
          equippedItems: [...hero.equippedItems, state.inventory[itemIndex].defId] // Storing defId for simplicity in save
      };

      set({ inventory: newInventory, army: newArmy });
      return { success: true, message: "Item Equipped!" };
  },

  login: (username: string) => {
    if (username.length < 3) return { success: false, message: "Name too short." };
    set({ playerName: username });
    return { success: true, message: `Welcome, ${username}.` };
  },

  register: (username: string) => {
    if (username.length < 3) return { success: false, message: "Name too short." };
    set({ playerName: username });
    return { success: true, message: `Rise, ${username}.` };
  },

  resetGame: () => {
    localStorage.removeItem(SAVE_KEY);
    useFactionStore.getState().resetFactions();
    useTerritoryStore.getState().resetTerritories();
    useProgressionStore.getState().resetProgression();
    set(INITIAL_STATE);
    window.location.reload();
  },

  addLog: (entry) => {
    set(state => ({
        logs: [{
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            ...entry
        }, ...state.logs].slice(0, 50) 
    }))
  },

  saveState: () => {
      const state = get();
      const factionState = useFactionStore.getState();
      const progState = useProgressionStore.getState();
      const territoryState = useTerritoryStore.getState();
      
      const data = {
          resources: state.resources,
          rates: state.rates, // Saving rates so offline progress works!
          buildings: state.buildings,
          army: state.army,
          recruitmentQueue: state.recruitmentQueue,
          activeResearch: state.activeResearch,
          researchedTechs: state.researchedTechs,
          activeQuests: state.activeQuests,
          lastTick: state.lastTick,
          playerLevel: state.playerLevel,
          location: state.location,
          scoutResults: state.scoutResults,
          inventory: state.inventory,
          factions: factionState.factions,
          progression: progState.saveProgression(),
          territories: territoryState.territories
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  },

  tick: (delta) => {
    set((state) => {
      const { buildings, resources, army, recruitmentQueue, activeResearch } = state;
      const now = Date.now();
      const nightMult = getNightMultiplier();
      
      // FIX: Logarithmic scale to prevent runaway numbers
      const corruptionMult = 1 + Math.log10(1 + (resources[ResourceType.INFLUENCE] || 0) / 500);
      
      const newResources = { ...resources };
      const newBuildings = buildings.map(b => {
          // SANITY CHECK: Clamp slaves to max capacity
          const maxSlaves = getMaxSlaves(b.defId, b.level);
          let safeSlaves = b.slaves;
          if (b.slaves > maxSlaves) {
              const excess = b.slaves - maxSlaves;
              safeSlaves = maxSlaves;
              newResources[ResourceType.SLAVES] = (newResources[ResourceType.SLAVES] || 0) + excess;
          }
          return { ...b, slaves: safeSlaves, unitProgress: { ...(b.unitProgress || {}) } };
      });

      let newArmy = [...army];
      const netRates = Object.values(ResourceType).reduce((acc, r) => ({ ...acc, [r]: 0 }), {} as Record<ResourceType, number>);

      const prodMap: Partial<Record<ResourceType, Map<string, number>>> = {};
      const consMap: Partial<Record<ResourceType, Map<string, number>>> = {};
      const addDetail = (map: typeof prodMap, res: ResourceType, name: string, val: number) => {
          if (!map[res]) map[res] = new Map();
          const current = map[res]!.get(name) || 0;
          map[res]!.set(name, current + val);
      };

      // 0. RESEARCH
      let updatedResearch = activeResearch;
      let updatedResearchedTechs = state.researchedTechs;
      if (activeResearch && now >= activeResearch.endTime) {
         updatedResearchedTechs = [...state.researchedTechs, activeResearch.techId];
         updatedResearch = null;
         const tech = TECH_DEFINITIONS[activeResearch.techId];
         generateResearchLore(tech.name).then(lore => {
            get().addLog({ type: 'Response', action: 'Discovery', data: lore });
         });
         setTimeout(() => get().saveState(), 0);
      }

      // 1. Demand & Availability
      const demands: Partial<Record<ResourceType, number>> = {};
      newBuildings.forEach(b => {
        if (b.paused) return;
        const def = BUILDING_DEFINITIONS[b.defId];
        Object.entries(def.inputs).forEach(([r, baseAmount]) => {
          const res = r as ResourceType;
          const amount = baseAmount * b.level * (1 + b.slaves * 0.1); 
          demands[res] = (demands[res] || 0) + amount;
        });
      });

      const armySize = army.reduce((acc, u) => acc + u.count, 0);
      const armyUpkeep = armySize * 0.001; // REDUCED from 0.05
      demands[ResourceType.BLOOD] = (demands[ResourceType.BLOOD] || 0) + armyUpkeep;

      const availability: Partial<Record<ResourceType, number>> = {};
      Object.keys(demands).forEach(k => {
        const r = k as ResourceType;
        const demand = demands[r] || 0;
        if (demand <= 0) availability[r] = 1;
        else {
          availability[r] = Math.min(1, (state.resources[r] || 0) / (demand * delta)); 
        }
      });

      // 2. Production
      newBuildings.forEach(b => {
        if (b.paused) { b.efficiency = 0; return; }
        const def = BUILDING_DEFINITIONS[b.defId];
        let efficiency = 1;
        Object.keys(def.inputs).forEach(k => {
          const r = k as ResourceType;
          efficiency = Math.min(efficiency, availability[r] || 0);
        });
        b.efficiency = efficiency;
        const slaveBonus = 1 + (b.slaves * 0.10); 
        
        // Base Multiplier
        const totalMult = b.level * def.productionScaling * efficiency * slaveBonus * nightMult * corruptionMult;

        Object.entries(def.inputs).forEach(([r, baseInput]) => {
          const res = r as ResourceType;
          const consumedRate = baseInput * totalMult;
          const actualConsumed = consumedRate * delta;
          newResources[res] = Math.max(0, newResources[res] - actualConsumed);
          netRates[res] -= consumedRate;
          if (consumedRate > 0) addDetail(consMap, res, def.name, consumedRate);
        });

        Object.entries(def.outputs).forEach(([r, baseOutput]) => {
          const res = r as ResourceType;
          let activeMult = totalMult;
          // FIX: Do not apply corruption multiplier to Influence generation to prevent viral loop
          if (res === ResourceType.INFLUENCE) {
              activeMult = activeMult / corruptionMult;
          }

          const producedRate = baseOutput * activeMult;
          const actualProduced = producedRate * delta;
          newResources[res] = (newResources[res] || 0) + actualProduced;
          netRates[res] += producedRate;
          if (producedRate > 0) addDetail(prodMap, res, def.name, producedRate);
        });

        if (def.outputsUnits) {
          Object.entries(def.outputsUnits).forEach(([unitId, rate]) => {
            const effectiveRate = rate * totalMult;
            b.unitProgress![unitId] = (b.unitProgress![unitId] || 0) + (effectiveRate * delta);
            if (b.unitProgress![unitId] >= 1) {
              const count = Math.floor(b.unitProgress![unitId]);
              b.unitProgress![unitId] -= count;
              const uDef = UDEFS[unitId];
              if (!uDef) return; 
              if (uDef.requiredTech && !updatedResearchedTechs.includes(uDef.requiredTech)) {
                  b.unitProgress![unitId] += count;
                  if (b.unitProgress![unitId] > 5) b.unitProgress![unitId] = 5;
                  return; 
              }
              const existingStackIndex = newArmy.findIndex(s => s.defId === unitId && s.count < 999999);
              if (existingStackIndex >= 0) {
                 const stack = newArmy[existingStackIndex];
                 stack.count += count;
                 stack.totalHp += (uDef.baseStats.hp * count);
                 newArmy[existingStackIndex] = { ...stack };
              } else if (newArmy.length < 10) {
                 newArmy.push({ uid: Math.random().toString(36).substr(2, 9), defId: unitId, count: count, totalHp: uDef.baseStats.hp * count, upgrades: [], equippedItems: [] });
              }
            }
          });
        }
      });

      // 3. Upkeep
      const bloodEff = availability[ResourceType.BLOOD] || 0;
      const upkeepRate = armyUpkeep * bloodEff;
      const upkeepConsumed = upkeepRate * delta;
      newResources[ResourceType.BLOOD] = Math.max(0, newResources[ResourceType.BLOOD] - upkeepConsumed);
      netRates[ResourceType.BLOOD] -= upkeepRate;
      if (upkeepRate > 0) addDetail(consMap, ResourceType.BLOOD, "Army Upkeep", upkeepRate);

      // 4. Recruitment
      const finishedOrders: typeof recruitmentQueue = [];
      const activeQueue: typeof recruitmentQueue = [];
      recruitmentQueue.forEach(order => {
          if (now >= order.finishTime) finishedOrders.push(order);
          else activeQueue.push(order);
      });

      if (finishedOrders.length > 0) {
          finishedOrders.forEach(order => {
              const uDef = UDEFS[order.defId];
              if (!uDef) return;
              const existingStackIndex = newArmy.findIndex(s => s.defId === order.defId && s.count < 999999);
              if (existingStackIndex >= 0) {
                  const stack = newArmy[existingStackIndex];
                  stack.count += order.count;
                  stack.totalHp += (uDef.baseStats.hp * order.count);
                  newArmy[existingStackIndex] = { ...stack };
              } else if (newArmy.length < 10) {
                  newArmy.push({ uid: Math.random().toString(36).substr(2, 9), defId: order.defId, count: order.count, totalHp: uDef.baseStats.hp * order.count, upgrades: [], equippedItems: [] });
              } else {
                  newArmy.push({ uid: Math.random().toString(36).substr(2, 9), defId: order.defId, count: order.count, totalHp: uDef.baseStats.hp * order.count, upgrades: [], equippedItems: [] });
              }
          });
          setTimeout(() => get().saveState(), 0);
      }

      // 5. TERRITORY INCOME (TERRAIN BASED)
      const territories = useTerritoryStore.getState().territories;
      let territoryInfGain = 0;
      let territoryGoldGain = 0;
      let territoryBloodGain = 0; // From Wilderness/Rural

      territories.forEach(t => {
          if (t.defendingFaction === FactionId.PLAYER) {
              const tier = t.controlTier;
              let infMult = 0.5;
              let goldMult = 0.2;
              let bloodMult = 0;

              // Terrain Modifiers
              if (t.terrain === TerrainType.URBAN) {
                  goldMult = 0.5; // High Gold
                  infMult = 0.4;
              } else if (t.terrain === TerrainType.RURAL) {
                  bloodMult = 0.3; // Population -> Blood
                  goldMult = 0.1;
              } else if (t.terrain === TerrainType.WILDERNESS) {
                  bloodMult = 0.5; // Hunting
                  goldMult = 0;
              } else if (t.terrain === TerrainType.COASTAL) {
                  goldMult = 0.3;
                  infMult = 0.6;
              }

              territoryInfGain += (tier * infMult);
              territoryGoldGain += (tier * goldMult);
              territoryBloodGain += (tier * bloodMult);
          }
      });

      const activeInfGain = territoryInfGain * delta;
      newResources[ResourceType.INFLUENCE] = (newResources[ResourceType.INFLUENCE] || 0) + activeInfGain;
      netRates[ResourceType.INFLUENCE] += territoryInfGain;
      if (territoryInfGain > 0) addDetail(prodMap, ResourceType.INFLUENCE, "Dominion (Terrain)", territoryInfGain);

      const activeGoldGain = territoryGoldGain * delta;
      newResources[ResourceType.GOLD] = (newResources[ResourceType.GOLD] || 0) + activeGoldGain;
      netRates[ResourceType.GOLD] += territoryGoldGain;
      if (territoryGoldGain > 0) addDetail(prodMap, ResourceType.GOLD, "Taxes (Urban/Trade)", territoryGoldGain);

      const activeBloodGain = territoryBloodGain * delta;
      newResources[ResourceType.BLOOD] = (newResources[ResourceType.BLOOD] || 0) + activeBloodGain;
      netRates[ResourceType.BLOOD] += territoryBloodGain;
      if (territoryBloodGain > 0) addDetail(prodMap, ResourceType.BLOOD, "Hunting (Wilds)", territoryBloodGain);

      const newRatesDetails: Record<ResourceType, RateDetail> = {} as any;
      Object.values(ResourceType).forEach(r => {
          const pList = prodMap[r] ? Array.from(prodMap[r]!.entries()).map(([name, rate]) => ({ name, rate })) : [];
          const cList = consMap[r] ? Array.from(consMap[r]!.entries()).map(([name, rate]) => ({ name, rate })) : [];
          newRatesDetails[r] = {
              net: netRates[r],
              production: pList.sort((a,b) => b.rate - a.rate),
              consumption: cList.sort((a,b) => b.rate - a.rate)
          };
      });
      
      return {
        resources: newResources,
        buildings: newBuildings,
        army: newArmy,
        recruitmentQueue: activeQueue,
        rates: netRates,
        ratesDetails: newRatesDetails,
        lastTick: now,
        activeResearch: updatedResearch,
        researchedTechs: updatedResearchedTechs
      };
    });
  },

  constructManualBuilding: (defId, lat, lng, name) => {
    const state = get();
    const def = BUILDING_DEFINITIONS[defId];
    const isFirst = state.buildings.length === 0;
    const cost = def.baseCost;
    
    // Only check cost if NOT the first building (Free Start logic)
    if (!isFirst) {
        for (const [res, amount] of Object.entries(cost)) {
          if ((state.resources[res as ResourceType] || 0) < amount) return { success: false, message: `Need ${amount} ${res}` };
        }
    }
    
    if (def.requiredTech && !state.researchedTechs.includes(def.requiredTech)) return { success: false, message: `Requires Tech` };
    if (def.requires) {
      for (const reqId of def.requires) {
        if (!state.buildings.some(b => b.defId === reqId)) return { success: false, message: `Requires ${BUILDING_DEFINITIONS[reqId].name}` };
      }
    }

    set(prev => {
      const newRes = { ...prev.resources };
      if (!isFirst) {
          for (const [res, amount] of Object.entries(cost)) {
            newRes[res as ResourceType] -= amount;
          }
      }
      return {
        resources: newRes,
        buildings: [...prev.buildings, {
          uid: Math.random().toString(36).substr(2, 9),
          defId: defId,
          customName: name,
          lat: lat,
          lng: lng,
          level: 1,
          slaves: 0,
          efficiency: 1,
          unitProgress: {},
          paused: false
        }]
      };
    });
    get().saveState();
    return { success: true, message: `Erected ${name}!` };
  },

  // ... (Other functions unchanged, keeping existing implementations)
  startResearch: (techId) => {
    const state = get();
    if (state.activeResearch) return { success: false, message: "Research already in progress" };
    if (state.researchedTechs.includes(techId)) return { success: false, message: "Already researched" };
    const tech = TECH_DEFINITIONS[techId];
    if (!tech) return { success: false, message: "Unknown tech" };
    const missingReq = tech.requires.find(req => !state.researchedTechs.includes(req));
    if (missingReq) return { success: false, message: `Requires ${TECH_DEFINITIONS[missingReq].name}` };
    for (const [res, amt] of Object.entries(tech.cost)) {
       if ((state.resources[res as ResourceType] || 0) < amt) return { success: false, message: `Need ${amt} ${res}` };
    }
    set(prev => {
        const newRes = { ...prev.resources };
        for (const [res, amt] of Object.entries(tech.cost)) {
            newRes[res as ResourceType] -= amt;
        }
        return {
            resources: newRes,
            activeResearch: {
                techId: techId,
                startTime: Date.now(),
                endTime: Date.now() + (tech.researchTime * 1000)
            }
        };
    });
    get().saveState();
    return { success: true, message: "Research started." };
  },
  constructBuilding: (site) => {
    const state = get();
    const def = BUILDING_DEFINITIONS[site.suggestedBuildingId];
    if (def.placement === BuildingPlacement.ENEMY && site.controllingFactionId === FactionId.PLAYER) return { success: false, message: "Must be built on Enemy territory." };
    const cost = def.baseCost;
    for (const [res, amount] of Object.entries(cost)) {
      if ((state.resources[res as ResourceType] || 0) < amount) return { success: false, message: `Need ${amount} ${res}` };
    }
    if (def.requiredTech && !state.researchedTechs.includes(def.requiredTech)) return { success: false, message: `Requires Tech` };
    set(prev => {
      const newRes = { ...prev.resources };
      for (const [res, amount] of Object.entries(cost)) {
        newRes[res as ResourceType] -= amount;
      }
      return {
        resources: newRes,
        scoutResults: prev.scoutResults.filter(s => s.id !== site.id),
        buildings: [...prev.buildings, {
          uid: Math.random().toString(36).substr(2, 9),
          defId: site.suggestedBuildingId,
          customName: site.name,
          lat: site.lat,
          lng: site.lng,
          level: 1,
          slaves: 0,
          efficiency: 1,
          unitProgress: {},
          paused: false
        }]
      };
    });
    get().saveState();
    return { success: true, message: `Corrupted ${site.name}!` };
  },
  togglePauseBuilding: (uid) => {
      set(prev => {
          const newBuildings = prev.buildings.map(b => 
              b.uid === uid ? { ...b, paused: !b.paused } : b
          );
          return { buildings: newBuildings };
      });
      return { success: true, message: "Production toggled." };
  },
  destroyBuilding: (uid) => {
      const state = get();
      const bIndex = state.buildings.findIndex(b => b.uid === uid);
      if (bIndex === -1) return { success: false, message: "Lair not found." };
      const b = state.buildings[bIndex];
      const cost = getUpgradeCost(b.defId, b.level);
      const refund: Partial<Record<ResourceType, number>> = {};
      Object.entries(cost).forEach(([res, amt]) => {
          refund[res as ResourceType] = Math.floor(amt * 0.4);
      });
      set(prev => {
          const newRes = { ...prev.resources };
          Object.entries(refund).forEach(([res, amt]) => {
              newRes[res as ResourceType] = (newRes[res as ResourceType] || 0) + amt;
          });
          const newBuildings = [...prev.buildings];
          newBuildings.splice(bIndex, 1);
          if (b.slaves > 0) newRes[ResourceType.SLAVES] = (newRes[ResourceType.SLAVES] || 0) + b.slaves;
          return { resources: newRes, buildings: newBuildings };
      });
      get().saveState();
      return { success: true, message: `Lair Destroyed. Recovered resources.` };
  },
  moveBuilding: (uid, lat, lng) => {
      const state = get();
      const bIndex = state.buildings.findIndex(b => b.uid === uid);
      if (bIndex === -1) return { success: false, message: "Lair not found." };
      const cost = 100;
      if ((state.resources[ResourceType.BLOOD] || 0) < cost) return { success: false, message: "Need 100 Blood to relocate." };
      set(prev => {
          const newBuildings = [...prev.buildings];
          newBuildings[bIndex] = { ...newBuildings[bIndex], lat, lng };
          const newRes = { ...prev.resources };
          newRes[ResourceType.BLOOD] -= cost;
          return { buildings: newBuildings, resources: newRes };
      });
      get().saveState();
      return { success: true, message: "Lair relocated via shadow magic." };
  },
  upgradeBuilding: (uid) => {
    const state = get();
    const buildingIndex = state.buildings.findIndex(b => b.uid === uid);
    if (buildingIndex === -1) return { success: false, message: "Lair not found" };
    const building = state.buildings[buildingIndex];
    const cost = getUpgradeCost(building.defId, building.level);
    for (const [res, amount] of Object.entries(cost)) {
      if ((state.resources[res as ResourceType] || 0) < amount) return { success: false, message: `Need ${amount} ${res}` };
    }
    
    const newLevel = building.level + 1;

    set(prev => {
      const newRes = { ...prev.resources };
      for (const [res, amount] of Object.entries(cost)) {
        newRes[res as ResourceType] -= amount;
      }
      const newBuildings = [...prev.buildings];
      newBuildings[buildingIndex] = { ...newBuildings[buildingIndex], level: newLevel };
      return { resources: newRes, buildings: newBuildings };
    });

    // Check if it was Dark Citadel and update map radius
    if (building.defId === 'dark_citadel') {
        useTerritoryStore.getState().updateHomeBaseRadius(newLevel);
    }

    get().saveState();
    return { success: true, message: `Lair upgraded to Lv.${newLevel}. Influence expanded.` };
  },
  assignSlaves: (uid, count) => {
    const state = get();
    const idx = state.buildings.findIndex(b => b.uid === uid);
    if (idx === -1) return { success: false };
    const b = state.buildings[idx];
    if (b.paused) return { success: false, message: "Cannot assign to paused lair." };
    const max = getMaxSlaves(b.defId, b.level);
    const safeCount = Math.max(0, count);
    const diff = safeCount - b.slaves;
    if (diff > 0) {
      if ((state.resources[ResourceType.SLAVES] || 0) < diff) return { success: false, message: "Not enough idle Slaves" };
      if (safeCount > max) return { success: false, message: "Lair full" };
    }
    set(prev => {
      const newRes = { ...prev.resources };
      newRes[ResourceType.SLAVES] -= diff; 
      const newBuildings = [...prev.buildings];
      newBuildings[idx] = { ...b, slaves: safeCount };
      return { buildings: newBuildings, resources: newRes };
    });
    return { success: true };
  },
  recruitUnit: (defId, multiplier = 1) => {
    const state = get();
    const def = UDEFS[defId];

    // --- CAP CHECK ---
    const batchSize = def.summonBatchSize || 1;
    const totalNewUnits = batchSize * multiplier;
    
    const currentArmySize = state.army.reduce((acc, u) => acc + u.count, 0);
    const queuedArmySize = state.recruitmentQueue.reduce((acc, q) => acc + q.count, 0);
    
    if (currentArmySize + queuedArmySize + totalNewUnits > GLOBAL_ARMY_CAP) {
        return { success: false, message: `Army cap reached (${GLOBAL_ARMY_CAP}). Expand influence to potentially command more.` };
    }
    // ----------------

    if (def.requiredTech && !state.researchedTechs.includes(def.requiredTech)) return { success: false, message: `Requires Tech` };
    if (def.tier === UnitTier.HERO) {
        const currentHeroes = state.army.filter(u => UDEFS[u.defId].tier === UnitTier.HERO).length;
        const queuedHeroes = state.recruitmentQueue.filter(q => UDEFS[q.defId].tier === UnitTier.HERO).reduce((acc, q) => acc + q.count, 0);
        const heroCap = get().getHeroCap();
        if (currentHeroes + queuedHeroes + multiplier > heroCap) return { success: false, message: `Hero Limit Reached (${heroCap}). Build more Manors.` };
    }
    if (def.requiredBuilding) {
        const hasBuilding = state.buildings.some(b => b.defId === def.requiredBuilding && !b.paused);
        if (!hasBuilding) return { success: false, message: `Requires active ${BUILDING_DEFINITIONS[def.requiredBuilding].name}` };
    }
    
    for (const [res, amount] of Object.entries(def.cost)) {
      if ((state.resources[res as ResourceType] || 0) < (amount * totalNewUnits)) return { success: false, message: `Insufficient ${res}` };
    }
    const timeNeededSeconds = (def.recruitTime || 5) * multiplier;
    set(prev => {
      const newRes = { ...prev.resources };
      for (const [res, amount] of Object.entries(def.cost)) {
        newRes[res as ResourceType] -= (amount * totalNewUnits);
      }
      const newOrder = {
          id: Math.random().toString(36).substr(2, 9),
          defId: defId,
          count: totalNewUnits,
          startTime: Date.now(),
          finishTime: Date.now() + (timeNeededSeconds * 1000)
      };
      return { resources: newRes, recruitmentQueue: [...prev.recruitmentQueue, newOrder] };
    });
    get().saveState();
    return { success: true, message: `Ritual started: ${totalNewUnits} ${def.name}` };
  },
  cancelRecruitment: (orderId: string) => {
      const state = get();
      const orderIndex = state.recruitmentQueue.findIndex(o => o.id === orderId);
      if (orderIndex === -1) return { success: false, message: "Order not found." };
      const order = state.recruitmentQueue[orderIndex];
      const def = UDEFS[order.defId];
      set(prev => {
          const newRes = { ...prev.resources };
          for (const [res, amount] of Object.entries(def.cost)) {
              newRes[res as ResourceType] = (newRes[res as ResourceType] || 0) + (amount * order.count);
          }
          const newQueue = [...prev.recruitmentQueue];
          newQueue.splice(orderIndex, 1);
          return { resources: newRes, recruitmentQueue: newQueue };
      });
      get().saveState();
      return { success: true, message: "Ritual aborted. Resources recovered." };
  },
  upgradeUnitStack: (stackUid) => {
    const state = get();
    const stackIdx = state.army.findIndex(s => s.uid === stackUid);
    if (stackIdx === -1) return { success: false, message: "Unit stack not found" };
    const stack = state.army[stackIdx];
    const upgradeDef = Object.values(UDEFS).find(u => u.upgradedFrom === stack.defId);
    if (!upgradeDef) return { success: false, message: "No evolution available" };
    if (upgradeDef.requiredTech && !state.researchedTechs.includes(upgradeDef.requiredTech)) return { success: false, message: `Requires Tech` };
    const unitCost = upgradeDef.upgradeCost || {};
    const totalCost: Partial<Record<ResourceType, number>> = {};
    for (const [res, amt] of Object.entries(unitCost)) {
        totalCost[res as ResourceType] = amt * stack.count;
        if ((state.resources[res as ResourceType] || 0) < totalCost[res as ResourceType]) return { success: false, message: `Need ${totalCost[res as ResourceType]} ${res}` };
    }
    set(prev => {
        const newRes = { ...prev.resources };
        for (const [res, amt] of Object.entries(totalCost)) {
            newRes[res as ResourceType] -= amt!;
        }
        const newArmy = [...prev.army];
        newArmy[stackIdx] = { ...stack, defId: upgradeDef.id, totalHp: upgradeDef.baseStats.hp * stack.count };
        return { resources: newRes, army: newArmy };
    });
    get().saveState();
    return { success: true, message: "Army Evolved!" };
  },
  setLocation: (lat, lng) => {
      set({ location: { lat, lng } });
      get().saveState();
  },
  addScoutResults: (newResults) => {
    set(prev => {
      const existingKeys = new Set(prev.scoutResults.map(s => `${s.name}|${s.lat.toFixed(4)}|${s.lng.toFixed(4)}`));
      const filtered = newResults.filter(r => {
        const key = `${r.name}|${r.lat.toFixed(4)}|${r.lng.toFixed(4)}`;
        return !existingKeys.has(key);
      });
      const combined = [...prev.scoutResults, ...filtered].slice(-60);
      return { scoutResults: combined };
    });
  },
  loadState: () => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return;
    const parsed = JSON.parse(saved);
    // Migration logic
    let loadedArmy = parsed.army || [];
    loadedArmy = loadedArmy.map((u: any) => {
        if (!('totalHp' in u)) {
             u.uid = Math.random().toString(36).substr(2, 9);
             u.totalHp = (UDEFS[u.defId]?.baseStats.hp || 1) * u.count;
             u.upgrades = [];
             u.equippedItems = [];
        }
        return u;
    }).filter((u: any) => UDEFS[u.defId]); 

    const loadedBuildings = (parsed.buildings || []).map((b: any) => ({
        ...b,
        paused: b.paused || false,
        slaves: b.slaves !== undefined ? b.slaves : (b.thralls || 0)
    }));

    const loadedResources = { ...INITIAL_STATE.resources, ...parsed.resources };
    if ((loadedResources as any)['THRALLS'] !== undefined) {
         loadedResources[ResourceType.SLAVES] = (loadedResources as any)['THRALLS'];
         delete (loadedResources as any)['THRALLS'];
    }

    // Load rates if present, otherwise default to 0
    const loadedRates = parsed.rates || Object.values(ResourceType).reduce((acc, r) => ({ ...acc, [r]: 0 }), {} as Record<ResourceType, number>);

    set({
      ...INITIAL_STATE,
      ...parsed,
      resources: loadedResources,
      rates: loadedRates, // Restore last calculated rates
      buildings: loadedBuildings,
      army: loadedArmy,
      inventory: parsed.inventory || [],
      recruitmentQueue: parsed.recruitmentQueue || [],
      ratesDetails: Object.values(ResourceType).reduce((acc, r) => ({ 
          ...acc, 
          [r]: { net: 0, production: [], consumption: [] } 
      }), {} as Record<ResourceType, RateDetail>),
      researchedTechs: parsed.researchedTechs || ['dark_covenant'],
      activeResearch: parsed.activeResearch || null,
      logs: [],
      playerName: parsed.playerName
    });
    useFactionStore.getState().loadFactions(parsed.factions);
    useProgressionStore.getState().loadProgression(parsed.progression);
  }
}));
