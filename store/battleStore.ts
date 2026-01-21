
import { create } from 'zustand';
import { ArmyStack, UNIT_DEFINITIONS, UnitSpecial, FactionId, TerritoryTier, TerritoryAction, ITEM_DEFINITIONS } from '../types';
import { calculateStackStats } from '../lib/armyUtils';
import { useGameStore } from './gameStore';
import { useTerritoryStore } from './territoryStore';
import { useFactionStore } from './factionStore';

export interface CombatLogEntry {
    round: number;
    message: string;
    type: 'damage' | 'death' | 'heal' | 'info';
}

interface BattleState {
    isActive: boolean;
    territoryId: string | null;
    battleType: 'RAID' | 'CONQUER';
    battlePhase: 'DEPLOYMENT' | 'COMBAT' | 'RESULTS';
    
    playerArmy: ArmyStack[];
    enemyArmy: ArmyStack[];
    initialPlayerArmy: ArmyStack[];
    initialEnemyArmy: ArmyStack[];
    
    // Normalized coordinates (0-1) for deployment
    deploymentPositions: Record<string, {x: number, y: number}>;

    battleOutcome: 'NONE' | 'VICTORY' | 'DEFEAT' | 'RETREAT';
    loot: string[] | null;
    
    logs: CombatLogEntry[];
    isFighting: boolean;

    // Actions
    initBattle: (territoryId: string, type: 'RAID' | 'CONQUER') => void;
    updateDeploymentPosition: (uid: string, x: number, y: number) => void;
    startBattle: () => void;
    retreat: () => void;
    closeBattle: () => void;
}

// Rebalanced Scaling Logic: 100 min -> 300k max
export const generateEnemyGarrison = (faction: FactionId, tier: TerritoryTier): ArmyStack[] => {
    const stacks: ArmyStack[] = [];
    
    // Tier Scaling Map (approximate total units)
    // UNCLAIMED/OUTPOST (1): ~100 - 500 units
    // ESTABLISHED (2): ~5,000 - 15,000 units
    // STRONGHOLD (3): ~50,000 - 100,000 units
    // DOMINION (4): ~150,000 - 300,000 units
    
    let baseMultiplier = 1;
    
    switch (tier) {
        case TerritoryTier.UNCLAIMED:
        case TerritoryTier.OUTPOST:
            baseMultiplier = 2; // Results in ~100-200 units for basic mobs
            break;
        case TerritoryTier.ESTABLISHED:
            baseMultiplier = 50; // Results in ~5k-10k
            break;
        case TerritoryTier.STRONGHOLD:
            baseMultiplier = 500; // Results in ~50k-80k
            break;
        case TerritoryTier.DOMINION:
            baseMultiplier = 2000; // Results in ~200k-300k
            break;
        default:
            baseMultiplier = 2;
    }

    // Random variation +/- 20%
    const scale = baseMultiplier * (0.8 + Math.random() * 0.4);

    const addStack = (defId: string, baseRatio: number) => {
        const count = Math.floor(baseRatio * scale);
        const def = UNIT_DEFINITIONS[defId];
        if (count > 0 && def) {
            stacks.push({
                uid: Math.random().toString(36).substr(2, 9),
                defId,
                count,
                totalHp: count * def.baseStats.hp,
                upgrades: [],
                equippedItems: []
            });
        }
    };

    if (faction === FactionId.PEASANT_VILLAGES) {
        // High numbers, weak units
        addStack('peasant_militia', 100); 
        if (tier >= 2) addStack('town_guard', 40);
        if (tier >= 3) addStack('battle_priest', 10);
    } else if (faction === FactionId.CHURCH_INQUISITION) {
        addStack('crusader', 25);
        addStack('battle_priest', 15);
        addStack('crossbowman', 50);
        if (tier >= 3) addStack('inquisitor', 10);
        if (tier >= 3) addStack('witch_hunter', 5); 
        if (tier >= 4) { addStack('witch_hunter', 15); addStack('seraphim', 0.1); } // Rare seraphim
    } else if (faction === FactionId.MERCHANT_GUILD) {
        addStack('town_guard', 80);
        addStack('crossbowman', 60); 
        if (tier >= 3) addStack('crusader', 10);
        if (tier >= 4) addStack('bombard_cannon', 2); 
    } else if (faction === FactionId.VAMPIRE_HUNTERS) {
        addStack('witch_hunter', 10); 
        addStack('crossbowman', 80);
        addStack('inquisitor', 30);
        if (tier >= 3) addStack('witch_hunter', 20);
        if (tier >= 4) { addStack('vampire_hunter', 1); addStack('seraphim', 0.1); }
    } else {
        // Rival Vampire Houses
        addStack('zombie', 50);
        addStack('skeleton_warrior', 50);
        if (tier >= 2) { addStack('spectre', 20); addStack('blood_knight', 10); }
        if (tier >= 3) { addStack('lich', 5); addStack('sanguine_lord', 3); }
        if (tier >= 4) { addStack('bone_dragon', 0.2); }
    }
    return stacks;
};

const simulateRound = (pArmy: ArmyStack[], eArmy: ArmyStack[]): { p: ArmyStack[], e: ArmyStack[] } => {
    // Simulation logic remains abstract for now (stat-based), visual deployment only affects the canvas start
    type Combatant = { stack: ArmyStack; side: 'PLAYER' | 'ENEMY'; index: number; speed: number };
    const combatants: Combatant[] = [
        ...pArmy.map((s, i) => ({ stack: s, side: 'PLAYER' as const, index: i, speed: UNIT_DEFINITIONS[s.defId].baseStats.speed })),
        ...eArmy.map((s, i) => ({ stack: s, side: 'ENEMY' as const, index: i, speed: UNIT_DEFINITIONS[s.defId].baseStats.speed }))
    ].filter(c => c.stack.count > 0);
    combatants.sort((a, b) => b.speed - a.speed);

    combatants.forEach(attacker => {
        if (attacker.stack.count <= 0) return;
        const targets = attacker.side === 'PLAYER' ? eArmy : pArmy;
        const liveTargets = targets.filter(t => t.count > 0);
        if (liveTargets.length === 0) return;
        const targetStack = liveTargets[Math.floor(Math.random() * liveTargets.length)];
        const targetDef = UNIT_DEFINITIONS[targetStack.defId];
        const atkStats = calculateStackStats(attacker.stack, attacker.side === 'PLAYER' ? pArmy : eArmy);
        const defStats = calculateStackStats(targetStack, attacker.side === 'PLAYER' ? eArmy : pArmy);
        const baseDmg = atkStats.effectiveDamage * (0.9 + Math.random() * 0.2);
        const mitigation = 1 + (defStats.defense / 20); 
        const finalDmg = Math.floor(baseDmg / mitigation);
        targetStack.totalHp = Math.max(0, targetStack.totalHp - finalDmg);
        const singleUnitHp = targetDef.baseStats.hp;
        targetStack.count = Math.ceil(targetStack.totalHp / singleUnitHp);
        if (atkStats.activeSynergies.includes('Lifesteal')) {
            const heal = Math.floor(finalDmg * 0.2);
            attacker.stack.totalHp += heal;
            const maxHp = attacker.stack.count * UNIT_DEFINITIONS[attacker.stack.defId].baseStats.hp;
            if (attacker.stack.totalHp > maxHp) attacker.stack.totalHp = maxHp;
        }
    });
    return { p: pArmy.filter(s => s.count > 0), e: eArmy.filter(s => s.count > 0) };
};

export const useBattleStore = create<BattleState>((set, get) => ({
    isActive: false,
    territoryId: null,
    battleType: 'RAID',
    battlePhase: 'DEPLOYMENT',
    playerArmy: [],
    enemyArmy: [],
    initialPlayerArmy: [],
    initialEnemyArmy: [],
    deploymentPositions: {},
    battleOutcome: 'NONE',
    loot: null,
    logs: [],
    isFighting: false,

    initBattle: (territoryId, type) => {
        const game = useGameStore.getState();
        const territory = useTerritoryStore.getState().territories.find(t => t.id === territoryId);
        if (!territory) return;
        if (game.army.length === 0) { game.addLog({ type: 'Error', action: 'Battle', data: "No army to command." }); return; }
        const enemies = generateEnemyGarrison(territory.defendingFaction, territory.controlTier);
        const playerClones = JSON.parse(JSON.stringify(game.army));
        const enemyClones = JSON.parse(JSON.stringify(enemies));
        
        // Generate Default Positions
        const positions: Record<string, {x: number, y: number}> = {};
        
        // Player: Bottom side (0.6 - 0.9), scattered horizontally
        playerClones.forEach((s: ArmyStack, i: number) => {
            positions[s.uid] = {
                x: 0.1 + ((i / Math.max(1, playerClones.length)) * 0.8) + (Math.random() * 0.05),
                y: 0.65 + (Math.random() * 0.2)
            };
        });

        // Enemy: Top side (0.1 - 0.3), scattered horizontally
        enemyClones.forEach((s: ArmyStack, i: number) => {
            positions[s.uid] = {
                x: 0.1 + ((i / Math.max(1, enemyClones.length)) * 0.8) + (Math.random() * 0.05),
                y: 0.1 + (Math.random() * 0.2)
            };
        });

        set({ 
            isActive: true, 
            territoryId, 
            battleType: type, 
            battlePhase: 'DEPLOYMENT', // Start in Deployment
            playerArmy: playerClones, 
            enemyArmy: enemies, 
            initialPlayerArmy: JSON.parse(JSON.stringify(playerClones)), 
            initialEnemyArmy: enemyClones, 
            deploymentPositions: positions,
            battleOutcome: 'NONE', 
            loot: null, 
            logs: [{ round: 0, message: `Battle started at ${territory.name}! Deploy your forces.`, type: 'info' }], 
            isFighting: false 
        });
    },

    updateDeploymentPosition: (uid, x, y) => {
        set(state => ({
            deploymentPositions: {
                ...state.deploymentPositions,
                [uid]: { x, y }
            }
        }));
    },

    startBattle: () => {
        const state = get();
        if (state.isFighting || state.battleOutcome !== 'NONE') return;
        
        set({ isFighting: true, battlePhase: 'COMBAT' });
        
        let simP = JSON.parse(JSON.stringify(state.playerArmy));
        let simE = JSON.parse(JSON.stringify(state.enemyArmy));
        let rounds = 0;
        
        while (simP.length > 0 && simE.length > 0 && rounds < 300) {
            const res = simulateRound(simP, simE);
            simP = res.p; simE = res.e; rounds++;
        }
        const finalPlayerArmy = simP;
        const finalEnemyArmy = simE;
        const winner = simP.length > 0 ? 'PLAYER' : 'ENEMY';
        
        const marchDuration = 2000; 
        const combatDuration = 25000; 
        const totalDuration = marchDuration + combatDuration;
        const fps = 20;
        const totalFrames = (totalDuration / 1000) * fps;
        const marchFrames = (marchDuration / 1000) * fps;
        let frame = 0;
        const interval = setInterval(() => {
            frame++;
            if (frame >= marchFrames) {
                const combatProgress = (frame - marchFrames) / (totalFrames - marchFrames);
                const progress = Math.max(0, Math.min(1, combatProgress));
                const currentP = state.initialPlayerArmy.map(init => {
                    const final = finalPlayerArmy.find((f: ArmyStack) => f.uid === init.uid);
                    const finalCount = final ? final.count : 0;
                    const diff = init.count - finalCount;
                    const currCount = Math.floor(init.count - (diff * progress));
                    const def = UNIT_DEFINITIONS[init.defId];
                    return { ...init, count: Math.max(0, currCount), totalHp: currCount * (def?.baseStats.hp || 1) };
                });
                const currentE = state.initialEnemyArmy.map(init => {
                    const final = finalEnemyArmy.find((f: ArmyStack) => f.uid === init.uid);
                    const finalCount = final ? final.count : 0;
                    const diff = init.count - finalCount;
                    const currCount = Math.floor(init.count - (diff * progress));
                    const def = UNIT_DEFINITIONS[init.defId];
                    return { ...init, count: Math.max(0, currCount), totalHp: currCount * (def?.baseStats.hp || 1) };
                });
                set({ playerArmy: currentP, enemyArmy: currentE });
            }
            if (frame >= totalFrames) {
                clearInterval(interval);
                setTimeout(() => {
                    set({ 
                        playerArmy: finalPlayerArmy, 
                        enemyArmy: finalEnemyArmy, 
                        battleOutcome: winner === 'PLAYER' ? 'VICTORY' : 'DEFEAT', 
                        battlePhase: 'RESULTS',
                        isFighting: false 
                    });
                    
                    const game = useGameStore.getState();
                    const tStore = useTerritoryStore.getState();
                    if (winner === 'PLAYER') {
                        game.army = finalPlayerArmy; 
                        const lootReport: string[] = [];
                        if (state.territoryId) {
                            if (state.battleType === 'CONQUER') {
                                const res = tStore.claimTerritory(state.territoryId, true);
                                lootReport.push(res.message);
                            } else {
                                const res = tStore.performTerritoryAction(state.territoryId, TerritoryAction.RAID, true);
                                lootReport.push(res.message);
                            }
                        }
                        
                        // ITEM DROP LOGIC
                        if (Math.random() < 0.4) {
                            const possibleItems = Object.keys(ITEM_DEFINITIONS);
                            const itemId = possibleItems[Math.floor(Math.random() * possibleItems.length)];
                            const itemDef = ITEM_DEFINITIONS[itemId];
                            if (itemDef) {
                                lootReport.push(`Looted Item: ${itemDef.name}`);
                                useGameStore.setState(gs => ({
                                    inventory: [...gs.inventory, {
                                        id: Math.random().toString(36).substr(2, 9),
                                        defId: itemId,
                                        ...itemDef
                                    }]
                                }));
                            }
                        }

                        set({ loot: lootReport });
                    } else {
                        game.army = []; 
                        game.addLog({ type: 'Error', action: 'Defeat', data: "Army annihilated." });
                    }
                    game.saveState();
                }, 2000); 
            }
        }, 1000 / fps);
    },

    retreat: () => {
        const s = get();
        useGameStore.setState({ army: s.playerArmy }); 
        set({ battleOutcome: 'RETREAT', isFighting: false, battlePhase: 'RESULTS' });
        useGameStore.getState().addLog({ type: 'Response', action: 'Retreat', data: "You fled the battlefield." });
    },

    closeBattle: () => set({ isActive: false, isFighting: false, battleOutcome: 'NONE', loot: null, logs: [], initialPlayerArmy: [], initialEnemyArmy: [] })
}));
