
import { create } from 'zustand';
import { Faction, FactionId, FactionType, IntrigueType, ResourceType, FactionStatus, TerritoryTier } from '../types';
import { useGameStore } from './gameStore';
import { useTerritoryStore } from './territoryStore';
import { UNIT_DEFINITIONS } from '../types';

interface FactionStore {
  factions: Record<FactionId, Faction>;
  
  // Actions
  tick: (deltaSeconds: number) => void;
  modifyRelation: (factionId: FactionId, amount: number) => void;
  setStatus: (factionId: FactionId, status: FactionStatus) => void;
  performIntrigue: (factionId: FactionId, type: IntrigueType) => { success: boolean, message: string, loot?: string };
  loadFactions: (savedFactions?: Record<FactionId, Faction>) => void;
  resetFactions: () => void;
}

const INITIAL_FACTIONS: Record<FactionId, Faction> = {
  [FactionId.PLAYER]: {
    id: FactionId.PLAYER,
    name: 'The Dark Lord',
    type: FactionType.VAMPIRE_HOUSE,
    description: 'Your own dominion of shadows.',
    relation: 100,
    status: FactionStatus.NEUTRAL,
    traits: ['Sovereign'],
    avatarIcon: 'GiBatWing'
  },
  [FactionId.HOUSE_DRACUL]: {
    id: FactionId.HOUSE_DRACUL,
    name: 'House Dracul',
    type: FactionType.VAMPIRE_HOUSE,
    description: 'Ancient warmongers who value strength above all. They despise weakness.',
    relation: 10,
    status: FactionStatus.NEUTRAL,
    traits: ['Aggressive', 'Martial'],
    avatarIcon: 'GiSwordsEmblem'
  },
  [FactionId.HOUSE_LILITU]: {
    id: FactionId.HOUSE_LILITU,
    name: 'House Lilitu',
    type: FactionType.VAMPIRE_HOUSE,
    description: 'Masters of seduction and intrigue. They prefer puppets to corpses.',
    relation: 0,
    status: FactionStatus.NEUTRAL,
    traits: ['Deceptive', 'Hedonistic'],
    avatarIcon: 'GiLips'
  },
  [FactionId.HOUSE_NECROS]: {
    id: FactionId.HOUSE_NECROS,
    name: 'House Necros',
    type: FactionType.VAMPIRE_HOUSE,
    description: 'Scholars of the Void. They trade in souls and forbidden crystals.',
    relation: -10,
    status: FactionStatus.NEUTRAL,
    traits: ['Mystic', 'Cold'],
    avatarIcon: 'GiSkullStaff'
  },
  [FactionId.PEASANT_VILLAGES]: {
    id: FactionId.PEASANT_VILLAGES,
    name: 'Local Villages',
    type: FactionType.HUMAN_ORG,
    description: 'The cattle. Easy to frighten, easy to bleed.',
    relation: 0,
    status: FactionStatus.NEUTRAL,
    traits: ['Fearful', 'Numerous'],
    avatarIcon: 'GiPitchfork'
  },
  [FactionId.CHURCH_INQUISITION]: {
    id: FactionId.CHURCH_INQUISITION,
    name: 'The Inquisition',
    type: FactionType.HUMAN_ORG,
    description: 'Fanatics wielding fire and faith. They will hunt you if provoked.',
    relation: -50,
    status: FactionStatus.WAR,
    traits: ['Fanatic', 'Dangerous'],
    avatarIcon: 'GiCrossShield'
  },
  [FactionId.MERCHANT_GUILD]: {
    id: FactionId.MERCHANT_GUILD,
    name: 'Merchant Guild',
    type: FactionType.HUMAN_ORG,
    description: 'They will trade with devils if the coin is good.',
    relation: 20,
    status: FactionStatus.NEUTRAL,
    traits: ['Greedy', 'Resourceful'],
    avatarIcon: 'GiCoins'
  },
  [FactionId.VAMPIRE_HUNTERS]: {
    id: FactionId.VAMPIRE_HUNTERS,
    name: 'Van Helsing Order',
    type: FactionType.HUMAN_ORG,
    description: 'Professional slayers. They scale with your corruption.',
    relation: -100,
    status: FactionStatus.WAR,
    traits: ['Deadly', 'Relentless'],
    avatarIcon: 'GiCrossbow'
  }
};

export const useFactionStore = create<FactionStore>((set, get) => ({
  factions: INITIAL_FACTIONS,

  loadFactions: (savedFactions) => {
    if (savedFactions) {
      set({ factions: { ...INITIAL_FACTIONS, ...savedFactions } });
    }
  },

  resetFactions: () => set({ factions: INITIAL_FACTIONS }),

  setStatus: (factionId, status) => {
     set(prev => ({
         factions: {
             ...prev.factions,
             [factionId]: { ...prev.factions[factionId], status }
         }
     }));
  },

  tick: (delta) => {
    set(state => {
      const newFactions = { ...state.factions };
      let changed = false;

      // Relations decay towards 0 (or -50 for enemies) slowly
      Object.values(newFactions).forEach((f: Faction) => {
        // ALLY and VASSAL statuses prevent decay towards 0
        if (f.status === FactionStatus.ALLY || f.status === FactionStatus.VASSAL) {
             // Allies drift towards 100
             if (f.relation < 100) {
                 const drift = 0.5 * delta;
                 const updatedFaction = { ...f, relation: Math.min(100, f.relation + drift) };
                 newFactions[f.id] = updatedFaction;
                 changed = true;
             }
             return; 
        }

        let target = 0;
        if (f.id === FactionId.CHURCH_INQUISITION) target = -50;
        if (f.id === FactionId.VAMPIRE_HUNTERS) target = -100;
        
        if (f.relation !== target) {
          const drift = (target - f.relation) * 0.0005 * delta; // Very slow drift
          if (Math.abs(drift) > 0.001) {
             const updatedFaction = { ...f, relation: f.relation + drift };
             newFactions[f.id] = updatedFaction;
             changed = true;
          }
        }
      });

      return changed ? { factions: newFactions } : state;
    });
  },

  modifyRelation: (factionId, amount) => {
    set(state => {
      const f = state.factions[factionId];
      if (!f) return state;
      const newRelation = Math.max(-100, Math.min(100, f.relation + amount));
      return {
        factions: {
          ...state.factions,
          [factionId]: { ...f, relation: newRelation }
        }
      };
    });
  },

  performIntrigue: (factionId, type) => {
    const gameStore = useGameStore.getState();
    const f = get().factions[factionId];
    if (!f) return { success: false, message: "Unknown Faction" };

    // --- GENERIC CHECKS ---
    if (type === IntrigueType.BRIBE && !gameStore.researchedTechs.includes('coin_of_judas')) {
        return { success: false, message: "Requires Research: Coin of Judas" };
    }
    if (type === IntrigueType.SEDUCE && !gameStore.researchedTechs.includes('pheromone_alchemy')) {
        return { success: false, message: "Requires Research: Pheromone Alchemy" };
    }
    if (type === IntrigueType.DEMAND && !gameStore.researchedTechs.includes('imperial_mandate')) {
        return { success: false, message: "Requires Research: Imperial Mandate" };
    }

    // --- VAMPIRE SPECIFIC CHECKS ---
    const isVampireHouse = f.type === FactionType.VAMPIRE_HOUSE;
    
    if (type === IntrigueType.SELL_SLAVES || type === IntrigueType.GIFT_SLAVES) {
        if (!isVampireHouse && factionId !== FactionId.MERCHANT_GUILD) return { success: false, message: "They do not trade in slaves." };
        if (!gameStore.researchedTechs.includes('thrall_trade')) return { success: false, message: "Requires Research: Slave Trading" };
    }
    if (type === IntrigueType.ALLIANCE) {
        if (!isVampireHouse) return { success: false, message: "Only Houses can form Blood Pacts." };
        if (!gameStore.researchedTechs.includes('blood_pact')) return { success: false, message: "Requires Research: Blood Pacts" };
    }
    if (type === IntrigueType.MARRIAGE) {
        if (!isVampireHouse) return { success: false, message: "Only Houses offer Brides." };
        if (!gameStore.researchedTechs.includes('dynastic_marriage')) return { success: false, message: "Requires Research: Dynastic Marriage" };
    }
    if (type === IntrigueType.CONFEDERATE) {
        if (!isVampireHouse) return { success: false, message: "Only Houses can Confederate." };
        if (!gameStore.researchedTechs.includes('dark_confederation')) return { success: false, message: "Requires Research: Dark Confederation" };
    }

    let costType: ResourceType = ResourceType.INFLUENCE;
    let costAmount = 0;
    
    // --- 1. BRIBE ---
    if (type === IntrigueType.BRIBE) {
       // Human Factions take GOLD. Vampires take BLOOD.
       if (f.type === FactionType.HUMAN_ORG) {
           costType = ResourceType.GOLD;
           costAmount = 100 + (gameStore.playerLevel * 20);
       } else {
           costType = ResourceType.BLOOD;
           costAmount = 200 + (gameStore.playerLevel * 50);
       }
       
       if ((gameStore.resources[costType] || 0) < costAmount) {
         return { success: false, message: `Not enough ${costType} (${costAmount}) to bribe.` };
       }

       gameStore.resources[costType] -= costAmount;
       get().modifyRelation(factionId, 15);
       return { success: true, message: `Bribe accepted by ${f.name}. Relations improved.` };
    }

    // --- 2. SEDUCE ---
    if (type === IntrigueType.SEDUCE) {
        costType = ResourceType.INFLUENCE;
        costAmount = 100;

        if ((gameStore.resources[costType] || 0) < costAmount) {
            return { success: false, message: `Need more Influence (${costAmount}).` };
        }

        const successChance = 0.6 + (f.relation / 200); 
        gameStore.resources[costType] -= costAmount;

        if (Math.random() < successChance) {
            const soulsGained = 15;
            gameStore.resources[ResourceType.SOULS] += soulsGained;
            get().modifyRelation(factionId, 15);
            return { success: true, message: `Seduction successful. (+${soulsGained} Souls)` };
        } else {
            get().modifyRelation(factionId, -5);
            return { success: false, message: `Seduction failed. They were repulsed.` };
        }
    }

    // --- 3. DEMAND TRIBUTE ---
    if (type === IntrigueType.DEMAND) {
        if (f.relation < 50) return { success: false, message: `Respect too low (<50).` };

        costAmount = 100; 
        if ((gameStore.resources[ResourceType.INFLUENCE] || 0) < costAmount) return { success: false, message: "Need 100 Influence."};
        gameStore.resources[ResourceType.INFLUENCE] -= costAmount;

        const reward = 300 * gameStore.playerLevel;
        gameStore.resources[ResourceType.BLOOD] += reward;
        get().modifyRelation(factionId, -20);

        return { success: true, message: `They yielded to your power. (+${reward} Blood)` };
    }

    // --- 4. WAR / RAID ---
    if (type === IntrigueType.WAR) {
        if (gameStore.army.length === 0) return { success: false, message: "You have no army to send." };

        const winChance = Math.min(0.9, gameStore.army.length * 0.15);

        if (Math.random() < winChance) {
            const loot = 400 * gameStore.playerLevel;
            gameStore.resources[ResourceType.BONE] += loot;
            get().modifyRelation(factionId, -50);
            get().setStatus(factionId, FactionStatus.WAR);
            return { success: true, message: `Total War declared. ${f.name} ravaged! (+${loot} Bone)` };
        } else {
            if (gameStore.army.length > 0) {
                gameStore.army[0].count = Math.floor(gameStore.army[0].count * 0.6);
                if (gameStore.army[0].count <= 0) gameStore.army.shift();
            }
            get().modifyRelation(factionId, -20);
            get().setStatus(factionId, FactionStatus.WAR);
            return { success: false, message: `War campaign failed. Your forces suffered heavy casualties.` };
        }
    }

    // --- VAMPIRE POLITICS ---

    // 5. GIFT SLAVES
    if (type === IntrigueType.GIFT_SLAVES) {
        const cost = 50;
        if ((gameStore.resources[ResourceType.SLAVES] || 0) < cost) return { success: false, message: `Need ${cost} Slaves.` };
        
        gameStore.resources[ResourceType.SLAVES] -= cost;
        get().modifyRelation(factionId, 15);
        return { success: true, message: `They accepted your living gift. Relations improved.` };
    }

    // 6. SELL SLAVES
    if (type === IntrigueType.SELL_SLAVES) {
        const cost = 50;
        if ((gameStore.resources[ResourceType.SLAVES] || 0) < cost) return { success: false, message: `Need ${cost} Slaves.` };
        
        gameStore.resources[ResourceType.SLAVES] -= cost;
        
        // Dynamic payout based on faction
        let payout = "";
        if (factionId === FactionId.HOUSE_DRACUL) {
             gameStore.resources[ResourceType.BLOOD] += 500;
             payout = "500 Blood";
        } else if (factionId === FactionId.HOUSE_NECROS) {
             gameStore.resources[ResourceType.OBSIDIAN] += 200;
             payout = "200 Obsidian";
        } else if (factionId === FactionId.MERCHANT_GUILD) {
             // Merchants pay in GOLD
             gameStore.resources[ResourceType.GOLD] += 300;
             payout = "300 Gold";
        } else {
             gameStore.resources[ResourceType.SOULS] += 20;
             payout = "20 Souls";
        }

        get().modifyRelation(factionId, 2);
        return { success: true, message: `Trade complete. Gained ${payout}.` };
    }

    // 7. ALLIANCE
    if (type === IntrigueType.ALLIANCE) {
        if (f.relation < 50) return { success: false, message: "Relations too low (<50)." };
        if (f.status === FactionStatus.ALLY) return { success: false, message: "Already Allied." };
        
        const cost = 1000;
        if ((gameStore.resources[ResourceType.INFLUENCE] || 0) < cost) return { success: false, message: `Need ${cost} Influence.` };
        gameStore.resources[ResourceType.INFLUENCE] -= cost;

        get().setStatus(factionId, FactionStatus.ALLY);
        get().modifyRelation(factionId, 20); // Boost to cement it
        
        return { success: true, message: "Blood Pact sealed! Decay halted." };
    }

    // 8. MARRIAGE
    if (type === IntrigueType.MARRIAGE) {
        if (f.relation < 80) return { success: false, message: "Relations too low (<80)." };
        
        const infCost = 5000;
        const essCost = 500;
        if ((gameStore.resources[ResourceType.INFLUENCE] || 0) < infCost) return { success: false, message: `Need ${infCost} Influence.` };
        if ((gameStore.resources[ResourceType.ESSENCE] || 0) < essCost) return { success: false, message: `Need ${essCost} Essence.` };

        gameStore.resources[ResourceType.INFLUENCE] -= infCost;
        gameStore.resources[ResourceType.ESSENCE] -= essCost;

        // Spawn Hero Unit (Vampire Bride/Groom)
        // Manually push to army to bypass recruitment time/cost
        const uDef = UNIT_DEFINITIONS['vampire_lord_hero'];
        gameStore.army.push({
             uid: Math.random().toString(36).substr(2, 9),
             defId: 'vampire_lord_hero',
             count: 1,
             totalHp: uDef.baseStats.hp,
             upgrades: ['Dynastic Blood'],
             equippedItems: []
        });

        get().modifyRelation(factionId, 50); // Massive boost (likely caps at 100)
        return { success: true, message: "Dynastic Marriage celebrated! A Vampire Lord has joined your court." };
    }

    // 9. CONFEDERATE
    if (type === IntrigueType.CONFEDERATE) {
        if (f.relation < 95) return { success: false, message: "Relations must be perfect (Wait for 100)." };
        if (f.status !== FactionStatus.ALLY) return { success: false, message: "Must be Allied first." };
        
        const infCost = 20000;
        const voidCost = 100;
        if ((gameStore.resources[ResourceType.INFLUENCE] || 0) < infCost) return { success: false, message: `Need ${infCost} Influence.` };
        if ((gameStore.resources[ResourceType.VOID_CRYSTALS] || 0) < voidCost) return { success: false, message: `Need ${voidCost} Void Crystals.` };

        gameStore.resources[ResourceType.INFLUENCE] -= infCost;
        gameStore.resources[ResourceType.VOID_CRYSTALS] -= voidCost;

        // Effect: Flip all their territories
        const tStore = useTerritoryStore.getState();
        const theirLands = tStore.territories.filter(t => t.defendingFaction === factionId);
        
        if (theirLands.length === 0) return { success: false, message: "They have no lands to claim." };

        const updatedTerritories = tStore.territories.map(t => {
            if (t.defendingFaction === factionId) {
                return {
                    ...t,
                    defendingFaction: FactionId.PLAYER,
                    controlTier: Math.max(t.controlTier, TerritoryTier.ESTABLISHED),
                    corruptionProgress: 100
                };
            }
            return t;
        });

        useTerritoryStore.setState({ territories: updatedTerritories });
        get().setStatus(factionId, FactionStatus.VASSAL);
        
        return { success: true, message: `Confederation achieved! ${f.name} has surrendered their domains to you.` };
    }

    return { success: false, message: "Unknown action" };
  }
}));
