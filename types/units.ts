
import { ResourceType } from './resources';

export enum UnitTier {
  SWARM = 'SWARM',
  TANK = 'TANK',
  SUPPORT = 'SUPPORT',
  ELITE = 'ELITE',
  CASTER = 'CASTER',
  GOD = 'GOD',
  HERO = 'HERO'
}

export enum UnitKind {
  UNDEAD = 'UNDEAD',
  HUMAN = 'HUMAN',
  MERCENARY = 'MERCENARY'
}

export enum UnitSpecial {
  NONE = 'NONE',
  LIFESTEAL = 'LIFESTEAL',         
  FLYING = 'FLYING',               
  NECROMANCY = 'NECROMANCY',       
  DRAGON_FEAR = 'DRAGON_FEAR',     
  CANNIBALIZE = 'CANNIBALIZE',     
  SWARM_TACTICS = 'SWARM_TACTICS', 
  EVASION = 'EVASION',             
  REGENERATION = 'REGENERATION',   
  LAST_STAND = 'LAST_STAND',        
  SURVIVOR = 'SURVIVOR', // One always survives (Lich/Dracolich)
  LEADER = 'LEADER' // Buffs army
}

export interface UnitDef {
  id: string;
  name: string;
  tier: UnitTier;
  kind: UnitKind;
  baseStats: {
    damage: number;
    hp: number;
    speed: number;      
    defense: number;    
  };
  special: UnitSpecial;
  cost: Partial<Record<ResourceType, number>>;
  summonBatchSize: number; 
  recruitTime: number; 
  description: string;
  requiredTech?: string;
  requiredBuilding?: string; // Building ID required on map to recruit
  upgradedFrom?: string; // ID of the base unit this evolves from
  upgradeCost?: Partial<Record<ResourceType, number>>; // Cost per unit to upgrade
  image?: string; // URL to unit art
}

export interface ArmyStack {
  uid: string;
  defId: string;
  count: number;
  totalHp: number; 
  upgrades: string[]; 
  equippedItems: string[]; 
}

export interface RecruitmentOrder {
  id: string;
  defId: string;
  count: number; 
  startTime: number;
  finishTime: number;
}

// Helper for placeholders
const UnitPH = (text: string, color: string) => `https://placehold.co/128x128/transparent/${color}.png?text=${encodeURIComponent(text)}&font=playfair-display`;

export const UNIT_DEFINITIONS: Record<string, UnitDef> = {
  // --- TIER 1 ---
  zombie: {
    id: 'zombie',
    name: 'Rotting Zombie',
    tier: UnitTier.TANK,
    kind: UnitKind.UNDEAD,
    baseStats: { damage: 2, hp: 18, speed: 2, defense: 2 },
    special: UnitSpecial.NONE,
    cost: { [ResourceType.SOULS]: 2, [ResourceType.BLOOD]: 2 },
    summonBatchSize: 100,
    recruitTime: 4,
    description: "Cheap fodder. High HP, low damage.",
    image: UnitPH('Zombie', '16a34a'), 
  },
  rotting_hulk: {
    id: 'rotting_hulk',
    name: 'Rotting Hulk',
    tier: UnitTier.TANK,
    kind: UnitKind.UNDEAD,
    baseStats: { damage: 6, hp: 45, speed: 3, defense: 8 },
    special: UnitSpecial.CANNIBALIZE,
    cost: { [ResourceType.SOULS]: 5, [ResourceType.BLOOD]: 10 },
    summonBatchSize: 5,
    recruitTime: 10,
    description: "Upgraded Zombie. Massive meat shield that heals after battle.",
    requiredTech: 'flesh_weaving',
    upgradedFrom: 'zombie',
    upgradeCost: { [ResourceType.BLOOD]: 5 },
    image: UnitPH('Hulk', '14532d'), 
  },
  skeleton_warrior: {
    id: 'skeleton_warrior',
    name: 'Skeleton Warrior',
    tier: UnitTier.SWARM,
    kind: UnitKind.UNDEAD,
    baseStats: { damage: 4, hp: 8, speed: 5, defense: 3 },
    special: UnitSpecial.SWARM_TACTICS,
    cost: { [ResourceType.BONE]: 5 },
    summonBatchSize: 200,
    recruitTime: 5,
    description: "Basic infantry. Scales with numbers.",
    requiredTech: 'skeletal_mastery',
    image: UnitPH('Skeleton', 'd4d4d8'), 
  },
  skeleton_archer: {
    id: 'skeleton_archer',
    name: 'Skeleton Archer',
    tier: UnitTier.SWARM,
    kind: UnitKind.UNDEAD,
    baseStats: { damage: 3, hp: 6, speed: 5, defense: 1 },
    special: UnitSpecial.NONE, // Ranged logic handled by ID check in battle
    cost: { [ResourceType.BONE]: 8 },
    summonBatchSize: 100,
    recruitTime: 5,
    description: "Ranged infantry raised from the dead.",
    requiredTech: 'skeletal_archery',
    image: UnitPH('Skel. Bow', 'a1a1aa'),
  },
  skeleton_champion: {
    id: 'skeleton_champion',
    name: 'Skeleton Champion',
    tier: UnitTier.SWARM,
    kind: UnitKind.UNDEAD,
    baseStats: { damage: 12, hp: 20, speed: 6, defense: 10 },
    special: UnitSpecial.SWARM_TACTICS,
    cost: { [ResourceType.BONE]: 15, [ResourceType.DARK_ARMOR]: 1 },
    summonBatchSize: 20,
    recruitTime: 10,
    description: "Upgraded Skeleton. Heavily armored dps.",
    requiredTech: 'dark_steel_forging',
    upgradedFrom: 'skeleton_warrior',
    upgradeCost: { [ResourceType.DARK_ARMOR]: 1 },
    image: UnitPH('Champion', '52525b'), 
  },

  // --- TIER 2 ---
  spectre: {
    id: 'spectre',
    name: 'Wailing Spectre',
    tier: UnitTier.SUPPORT,
    kind: UnitKind.UNDEAD,
    baseStats: { damage: 8, hp: 15, speed: 8, defense: 0 },
    special: UnitSpecial.EVASION,
    cost: { [ResourceType.SOULS]: 15, [ResourceType.ESSENCE]: 1 },
    summonBatchSize: 5,
    recruitTime: 30,
    description: "Incorporeal spirits. 33% Evasion.",
    requiredTech: 'ethereal_binding',
    requiredBuilding: 'spire_of_wailing',
    image: UnitPH('Spectre', '22d3ee'), 
  },
  banshee: {
    id: 'banshee',
    name: 'Banshee',
    tier: UnitTier.SUPPORT,
    kind: UnitKind.UNDEAD,
    baseStats: { damage: 15, hp: 25, speed: 9, defense: 0 },
    special: UnitSpecial.EVASION, 
    cost: { [ResourceType.SOULS]: 30, [ResourceType.ESSENCE]: 2 },
    summonBatchSize: 1,
    recruitTime: 40,
    description: "Upgraded Spectre. Near perfect evasion and high speed.",
    requiredTech: 'screaming_void',
    upgradedFrom: 'spectre',
    upgradeCost: { [ResourceType.ESSENCE]: 2 },
    image: UnitPH('Banshee', '06b6d4'), 
  },

  // --- TIER 3 ---
  blood_knight: {
    id: 'blood_knight',
    name: 'Blood Knight',
    tier: UnitTier.ELITE,
    kind: UnitKind.UNDEAD,
    baseStats: { damage: 25, hp: 90, speed: 7, defense: 10 },
    special: UnitSpecial.LIFESTEAL,
    cost: { [ResourceType.BLOOD]: 100, [ResourceType.IRON]: 20, [ResourceType.DARK_ARMOR]: 5 },
    summonBatchSize: 1,
    recruitTime: 60,
    description: "Vampiric warriors who heal on hit.",
    requiredTech: 'sanguine_aristocracy',
    requiredBuilding: 'dueling_grounds',
    image: UnitPH('Knight', '991b1b'), 
  },
  vampire_marksman: {
    id: 'vampire_marksman',
    name: 'Vampire Marksman',
    tier: UnitTier.ELITE,
    kind: UnitKind.UNDEAD,
    baseStats: { damage: 35, hp: 70, speed: 7, defense: 8 },
    special: UnitSpecial.LIFESTEAL,
    cost: { [ResourceType.BLOOD]: 80, [ResourceType.DARK_WEAPONS]: 2 },
    summonBatchSize: 2,
    recruitTime: 45,
    description: "Deadly accuracy with arrows dipped in cursed blood.",
    requiredTech: 'blood_ballistics',
    requiredBuilding: 'sanguine_fletcher',
    image: UnitPH('Marksman', '7f1d1d'),
  },
  sanguine_lord: {
    id: 'sanguine_lord',
    name: 'Sanguine Lord',
    tier: UnitTier.ELITE,
    kind: UnitKind.UNDEAD,
    baseStats: { damage: 50, hp: 200, speed: 8, defense: 20 },
    special: UnitSpecial.LIFESTEAL, 
    cost: { [ResourceType.BLOOD]: 300, [ResourceType.REFINED_OBSIDIAN]: 10 },
    summonBatchSize: 1,
    recruitTime: 120,
    description: "Upgraded Knight. A vampiric engine of destruction.",
    requiredTech: 'eternal_thirst',
    upgradedFrom: 'blood_knight',
    upgradeCost: { [ResourceType.BLOOD]: 200 },
    image: UnitPH('Lord', '7f1d1d'), 
  },

  // --- TIER 4 ---
  lich: {
    id: 'lich',
    name: 'Arch Lich',
    tier: UnitTier.CASTER,
    kind: UnitKind.UNDEAD,
    baseStats: { damage: 40, hp: 50, speed: 5, defense: 5 },
    special: UnitSpecial.REGENERATION,
    cost: { [ResourceType.CONCENTRATED_ESSENCE]: 2, [ResourceType.BONE]: 100 },
    summonBatchSize: 1,
    recruitTime: 120,
    description: "Dark casters with regeneration.",
    requiredTech: 'phylactery_crafting',
    requiredBuilding: 'cursed_library',
    image: UnitPH('Lich', 'a855f7'), 
  },
  ancient_lich: {
    id: 'ancient_lich',
    name: 'Ancient Lich',
    tier: UnitTier.CASTER,
    kind: UnitKind.UNDEAD,
    baseStats: { damage: 90, hp: 100, speed: 6, defense: 10 },
    special: UnitSpecial.SURVIVOR,
    cost: { [ResourceType.VOID_CRYSTALS]: 1, [ResourceType.CONCENTRATED_ESSENCE]: 10 },
    summonBatchSize: 1,
    recruitTime: 240,
    description: "Upgraded Lich. Phylactery ensures one always survives retreat.",
    requiredTech: 'phylactery_mastery',
    upgradedFrom: 'lich',
    upgradeCost: { [ResourceType.CONCENTRATED_ESSENCE]: 5 },
    image: UnitPH('Ancient', '7e22ce'), 
  },

  // --- TIER 5 ---
  bone_dragon: {
    id: 'bone_dragon',
    name: 'Bone Dragon',
    tier: UnitTier.GOD,
    kind: UnitKind.UNDEAD,
    baseStats: { damage: 150, hp: 800, speed: 9, defense: 20 },
    special: UnitSpecial.LAST_STAND,
    cost: { [ResourceType.VOID_CRYSTALS]: 15, [ResourceType.CONCENTRATED_ESSENCE]: 30, [ResourceType.BONE]: 2000 },
    summonBatchSize: 1,
    recruitTime: 600,
    description: "The ultimate terror.",
    requiredTech: 'draconic_resurrection',
    image: UnitPH('Dragon', 'facc15'), 
  },
  dracolich: {
    id: 'dracolich',
    name: 'Dracolich',
    tier: UnitTier.GOD,
    kind: UnitKind.UNDEAD,
    baseStats: { damage: 300, hp: 2000, speed: 10, defense: 40 },
    special: UnitSpecial.SURVIVOR,
    cost: { [ResourceType.VOID_CRYSTALS]: 50, [ResourceType.SOULS]: 1000 },
    summonBatchSize: 1,
    recruitTime: 1000,
    description: "God of Death. Cannot be fully destroyed if one remains.",
    requiredTech: 'draconic_ascension',
    upgradedFrom: 'bone_dragon',
    upgradeCost: { [ResourceType.VOID_CRYSTALS]: 20 },
    image: UnitPH('Dracolich', 'eab308'), 
  },

  // --- HEROES ---
  vampire_lord_hero: {
    id: 'vampire_lord_hero',
    name: 'Minor Lord',
    tier: UnitTier.HERO,
    kind: UnitKind.UNDEAD,
    baseStats: { damage: 100, hp: 1000, speed: 8, defense: 30 },
    special: UnitSpecial.LEADER,
    cost: { [ResourceType.INFLUENCE]: 500, [ResourceType.BLOOD]: 2000 },
    summonBatchSize: 1,
    recruitTime: 300,
    description: "A vassal lord. Buffs army. Requires a free Hero Slot (Manor/Throne).",
    requiredTech: 'noble_lineage',
    image: UnitPH('Hero', 'e11d48'), 
  },

  // --- MERCENARIES (Recruitable for GOLD) ---
  sellsword: {
    id: 'sellsword',
    name: 'Sellsword Veteran',
    tier: UnitTier.TANK,
    kind: UnitKind.MERCENARY,
    baseStats: { damage: 8, hp: 35, speed: 5, defense: 6 },
    special: UnitSpecial.NONE,
    cost: { [ResourceType.GOLD]: 50 },
    summonBatchSize: 10,
    recruitTime: 5,
    description: "Human fighters who care only for coin. Reliable front-liners.",
    requiredTech: 'mercenary_contracts',
    image: UnitPH('Sellsword', 'd4d4d4')
  },
  heavy_arbalest: {
    id: 'heavy_arbalest',
    name: 'Heavy Arbalest',
    tier: UnitTier.ELITE,
    kind: UnitKind.MERCENARY,
    baseStats: { damage: 20, hp: 20, speed: 3, defense: 4 },
    special: UnitSpecial.NONE,
    cost: { [ResourceType.GOLD]: 100, [ResourceType.IRON]: 5 },
    summonBatchSize: 5,
    recruitTime: 10,
    description: "Mercenary crossbowmen with armor-piercing bolts.",
    requiredTech: 'mercenary_contracts',
    image: UnitPH('Arbalest', '71717a')
  },
  cultist_warlock: {
    id: 'cultist_warlock',
    name: 'Cultist Warlock',
    tier: UnitTier.CASTER,
    kind: UnitKind.MERCENARY,
    baseStats: { damage: 30, hp: 40, speed: 6, defense: 2 },
    special: UnitSpecial.LIFESTEAL,
    cost: { [ResourceType.GOLD]: 200, [ResourceType.SOULS]: 10 },
    summonBatchSize: 1,
    recruitTime: 30,
    description: "Mad sorcerers seeking forbidden power.",
    requiredTech: 'mercenary_contracts',
    image: UnitPH('Warlock', '7c3aed')
  },

  // --- ENEMIES (HUMAN & OTHERS) ---
  peasant_militia: {
    id: 'peasant_militia',
    name: 'Peasant Militia',
    tier: UnitTier.SWARM,
    kind: UnitKind.HUMAN,
    baseStats: { damage: 2, hp: 6, speed: 4, defense: 0 },
    special: UnitSpecial.NONE,
    cost: {},
    summonBatchSize: 1,
    recruitTime: 0,
    description: "Armed with pitchforks and torches.",
    image: UnitPH('Peasant', 'fca5a5')
  },
  town_guard: {
    id: 'town_guard',
    name: 'Town Guard',
    tier: UnitTier.TANK,
    kind: UnitKind.HUMAN,
    baseStats: { damage: 5, hp: 20, speed: 4, defense: 5 },
    special: UnitSpecial.NONE,
    cost: {},
    summonBatchSize: 1,
    recruitTime: 0,
    description: "Trained defenders.",
    image: UnitPH('Guard', '94a3b8')
  },
  crossbowman: {
    id: 'crossbowman',
    name: 'Crossbowman',
    tier: UnitTier.SWARM,
    kind: UnitKind.HUMAN,
    baseStats: { damage: 8, hp: 12, speed: 4, defense: 2 },
    special: UnitSpecial.NONE,
    cost: {},
    summonBatchSize: 1,
    recruitTime: 0,
    description: "Ranged defenders with heavy bolts.",
    image: UnitPH('X-Bow', '78350f')
  },
  battle_priest: {
    id: 'battle_priest',
    name: 'Battle Priest',
    tier: UnitTier.SUPPORT,
    kind: UnitKind.HUMAN,
    baseStats: { damage: 5, hp: 25, speed: 5, defense: 5 },
    special: UnitSpecial.REGENERATION, // Simulates healing aura
    cost: {},
    summonBatchSize: 1,
    recruitTime: 0,
    description: "Heals allies and blesses weapons.",
    image: UnitPH('Priest', 'fcd34d')
  },
  crusader: {
    id: 'crusader',
    name: 'Holy Crusader',
    tier: UnitTier.ELITE,
    kind: UnitKind.HUMAN,
    baseStats: { damage: 20, hp: 80, speed: 6, defense: 15 },
    special: UnitSpecial.NONE,
    cost: {},
    summonBatchSize: 1,
    recruitTime: 0,
    description: "Heavily armored knight sworn to destroy evil.",
    image: UnitPH('Crusader', 'e5e7eb')
  },
  inquisitor: {
    id: 'inquisitor',
    name: 'Inquisitor',
    tier: UnitTier.ELITE,
    kind: UnitKind.HUMAN,
    baseStats: { damage: 25, hp: 40, speed: 6, defense: 5 },
    special: UnitSpecial.NONE,
    cost: {},
    summonBatchSize: 1,
    recruitTime: 0,
    description: "Fanatics who burn the impure.",
    image: UnitPH('Inquisitor', 'dc2626')
  },
  witch_hunter: {
    id: 'witch_hunter',
    name: 'Witch Hunter',
    tier: UnitTier.CASTER, 
    kind: UnitKind.HUMAN,
    baseStats: { damage: 45, hp: 60, speed: 7, defense: 10 },
    special: UnitSpecial.NONE,
    cost: {},
    summonBatchSize: 1,
    recruitTime: 0,
    description: "Inquisitorial agents trained to kill mages and beasts.",
    image: UnitPH('Witch H.', '4c1d95')
  },
  bombard_cannon: {
    id: 'bombard_cannon',
    name: 'Bombard Cannon',
    tier: UnitTier.CASTER,
    kind: UnitKind.HUMAN,
    baseStats: { damage: 80, hp: 40, speed: 1, defense: 0 },
    special: UnitSpecial.NONE,
    cost: {},
    summonBatchSize: 1,
    recruitTime: 0,
    description: "Heavy siege weaponry funded by the Guilds.",
    image: UnitPH('Cannon', '1f2937')
  },
  vampire_hunter: {
    id: 'vampire_hunter',
    name: 'Legendary Hunter',
    tier: UnitTier.HERO,
    kind: UnitKind.HUMAN,
    baseStats: { damage: 40, hp: 150, speed: 9, defense: 15 },
    special: UnitSpecial.EVASION,
    cost: {},
    summonBatchSize: 1,
    recruitTime: 0,
    description: "A professional slayer (Van Helsing) of your kind.",
    image: UnitPH('Hunter', '000000')
  },
  seraphim: {
    id: 'seraphim',
    name: 'Seraphim',
    tier: UnitTier.GOD,
    kind: UnitKind.HUMAN,
    baseStats: { damage: 120, hp: 1000, speed: 9, defense: 30 },
    special: UnitSpecial.FLYING,
    cost: {},
    summonBatchSize: 1,
    recruitTime: 0,
    description: "A biblically accurate angel of burning fire.",
    image: UnitPH('Seraphim', 'fbbf24')
  }
};
