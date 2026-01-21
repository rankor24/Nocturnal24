

import { ResourceType } from './resources';

export enum BuildingPlacement {
  OWNED = 'OWNED', // Must be on player territory
  ENEMY = 'ENEMY', // Must be on enemy territory (Parasitic)
  ANY = 'ANY'
}

export interface BuildingDef {
  id: string; 
  name: string; 
  chain: string; 
  inputs: Partial<Record<ResourceType, number>>; 
  outputs: Partial<Record<ResourceType, number>>; 
  outputsUnits?: Partial<Record<string, number>>; 
  description: string;
  baseCost: Partial<Record<ResourceType, number>>; 
  costScaling: number; 
  productionScaling: number; 
  maxSlavesBase: number; 
  requires?: string[]; 
  requiredTech?: string;
  placement?: BuildingPlacement; // Default OWNED
  unique?: boolean; // Max 1 per player
  // Visuals
  image: string; // URL to the building art (Transparent PNG recommended)
  flavor?: string; // Lore text
}

export interface ActiveBuilding {
  uid: string;
  defId: string;
  customName: string;
  lat: number;
  lng: number;
  level: number;
  slaves: number;
  efficiency: number;
  unitProgress?: Record<string, number>;
  paused?: boolean;
}

// Helper for placeholders to ensure the game looks good immediately
const PH = (text: string, color: string) => `https://placehold.co/128x128/transparent/${color}.png?text=${encodeURIComponent(text)}&font=playfair-display`;

export const BUILDING_DEFINITIONS: Record<string, BuildingDef> = {
  // --- CITADEL START ---
  dark_citadel: {
    id: 'dark_citadel',
    name: 'Black Citadel',
    chain: 'Citadel',
    inputs: {},
    outputs: { [ResourceType.BLOOD]: 1.0, [ResourceType.INFLUENCE]: 1.0 },
    description: "The seat of your power. Upgrade this structure to increase base production. To expand your territory borders, go to the Map.",
    flavor: "A monolith of obsidian and bone, casting a long shadow over the map.",
    baseCost: { [ResourceType.BLOOD]: 1000, [ResourceType.OBSIDIAN]: 100 }, // Non-zero cost so upgrades scale. First build is free via logic.
    costScaling: 1.6, // REDUCED from 3.0
    productionScaling: 1.2,
    maxSlavesBase: 10,
    unique: true,
    image: 'https://storage.googleapis.com/nocturnal24/images/Castle1.png'
  },

  // --- SURVIVAL CHAIN (TIER 1) ---
  blood_font: {
    id: 'blood_font',
    name: 'Blood Font',
    chain: 'Survival',
    inputs: {},
    outputs: { [ResourceType.BLOOD]: 2.0 },
    description: "Generates passive Blood. More efficient than the Citadel.",
    flavor: "The earth bleeds for those who know where to cut.",
    baseCost: { [ResourceType.INFLUENCE]: 20 },
    costScaling: 1.25, // REDUCED from 1.4
    productionScaling: 1.0,
    maxSlavesBase: 5,
    image: 'https://storage.googleapis.com/nocturnal24/images/sprite-1768731850094.png'
  },
  human_pen: {
    id: 'human_pen',
    name: 'Human Pen',
    chain: 'Survival',
    inputs: { [ResourceType.BLOOD]: 1.0 },
    outputs: { [ResourceType.SLAVES]: 0.1 }, 
    description: "Captives are broken into obedient Slaves.",
    flavor: "Break their will, bind their bodies.",
    baseCost: { [ResourceType.BLOOD]: 50, [ResourceType.INFLUENCE]: 30 },
    costScaling: 1.3, // REDUCED from 1.5
    productionScaling: 1.0,
    maxSlavesBase: 0, 
    requires: ['blood_font'],
    image: 'https://storage.googleapis.com/nocturnal24/images/slaves2.png'
  },
  feeding_pit: {
    id: 'feeding_pit',
    name: 'Feeding Pit',
    chain: 'Survival',
    inputs: { [ResourceType.BLOOD]: 2.0 },
    outputs: { [ResourceType.SOULS]: 1.0 },
    description: "Extract souls from the living.",
    flavor: "A gentle drain or a violent tear. The soul flows either way.",
    baseCost: { [ResourceType.BLOOD]: 100 },
    costScaling: 1.25, // REDUCED from 1.4
    productionScaling: 1.0,
    maxSlavesBase: 5,
    requires: ['human_pen'],
    image: 'https://storage.googleapis.com/nocturnal24/images/Souls.png'
  },
  slave_quarters: {
    id: 'slave_quarters',
    name: 'Slave Quarters',
    chain: 'Survival',
    inputs: { [ResourceType.BLOOD]: 2.0 },
    outputs: { [ResourceType.SLAVES]: 0.5 }, 
    description: "Advanced containment. Breaks captives into Slaves efficiently (Tier 2).",
    flavor: "Straw mats and iron bars. Keep the livestock fresh.",
    baseCost: { [ResourceType.BONE]: 50, [ResourceType.OBSIDIAN]: 20 },
    costScaling: 1.3,
    productionScaling: 1.0,
    maxSlavesBase: 25,
    requiredTech: 'dark_architecture',
    requires: ['human_pen'],
    image: 'https://storage.googleapis.com/nocturnal24/images/Quarters.png'
  },

  // --- SURVIVAL CHAIN (TIER 2 - UPGRADES) ---
  crimson_reservoir: {
    id: 'crimson_reservoir',
    name: 'Crimson Reservoir',
    chain: 'Survival',
    inputs: { [ResourceType.SOULS]: 0.2 },
    outputs: { [ResourceType.BLOOD]: 15.0 },
    description: "Massive blood storage and generation.",
    flavor: "A lake of vitality, rippling with dark promise.",
    baseCost: { [ResourceType.BLOOD]: 2000, [ResourceType.IRON]: 500 },
    costScaling: 1.4, // REDUCED from 1.5
    productionScaling: 1.0,
    maxSlavesBase: 20,
    requiredTech: 'crimson_engineering',
    requires: ['blood_font'],
    image: 'https://storage.googleapis.com/nocturnal24/images/Blood%20Pool.png'
  },
  soul_conduit: {
    id: 'soul_conduit',
    name: 'Soul Conduit',
    chain: 'Survival',
    inputs: { [ResourceType.BLOOD]: 10.0 },
    outputs: { [ResourceType.SOULS]: 5.0 },
    description: "High-volume soul extraction.",
    flavor: "The screams are filtered out. Only the energy remains.",
    baseCost: { [ResourceType.OBSIDIAN]: 1000, [ResourceType.ESSENCE]: 50 },
    costScaling: 1.4, // REDUCED from 1.6
    productionScaling: 1.0,
    maxSlavesBase: 10,
    requiredTech: 'soul_harvesting',
    requires: ['feeding_pit'],
    image: 'https://storage.googleapis.com/nocturnal24/images/Soul%20Spire.png'
  },

  // --- CONSTRUCTION CHAIN (TIER 1) ---
  graveyard: {
    id: 'graveyard',
    name: 'Graveyard',
    chain: 'Construction',
    inputs: {},
    outputs: { [ResourceType.BONE]: 1.5 },
    description: "Dig for raw materials.",
    flavor: "Ancestors provide the mortar for our future.",
    baseCost: { [ResourceType.INFLUENCE]: 30 },
    costScaling: 1.25, // Reduced from 1.3
    productionScaling: 1.0,
    maxSlavesBase: 10,
    image: 'https://storage.googleapis.com/nocturnal24/images/Bones1.png'
  },
  quarry: {
    id: 'quarry',
    name: 'Obsidian Quarry',
    chain: 'Construction',
    inputs: {},
    outputs: { [ResourceType.OBSIDIAN]: 0.8 },
    description: "Mining volcanic glass.",
    flavor: "Sharp as a razor, black as the night.",
    baseCost: { [ResourceType.BONE]: 100 },
    costScaling: 1.25, // Reduced from 1.4
    productionScaling: 1.0,
    maxSlavesBase: 10,
    image: 'https://storage.googleapis.com/nocturnal24/images/Obsidian.png'
  },
  bone_carver: {
    id: 'bone_carver',
    name: 'Bone Carver',
    chain: 'Construction',
    inputs: { [ResourceType.BLOOD]: 1.0 },
    outputs: { [ResourceType.BONE]: 4.0 },
    description: "Artisanal bone shaping for advanced construction.",
    flavor: "Scrimshaw written in forbidden tongues.",
    baseCost: { [ResourceType.BONE]: 200, [ResourceType.SOULS]: 10 },
    costScaling: 1.3, // Reduced from 1.4
    productionScaling: 1.1,
    maxSlavesBase: 5,
    requiredTech: 'skeletal_mastery',
    image: 'https://storage.googleapis.com/nocturnal24/images/Bone%20carver.png'
  },

  // --- CONSTRUCTION CHAIN (TIER 2) ---
  catacomb_complex: {
    id: 'catacomb_complex',
    name: 'Catacomb Complex',
    chain: 'Construction',
    inputs: { [ResourceType.SLAVES]: 0.1 },
    outputs: { [ResourceType.BONE]: 10.0, [ResourceType.OBSIDIAN]: 4.0 },
    description: "Deep earth excavation network.",
    flavor: "Miles of tunnels, paved with the dead.",
    baseCost: { [ResourceType.BONE]: 5000, [ResourceType.DARK_WEAPONS]: 50 },
    costScaling: 1.4, // Reduced from 1.5
    productionScaling: 1.0,
    maxSlavesBase: 50,
    requiredTech: 'deep_excavation',
    requires: ['graveyard', 'quarry'],
    image: 'https://storage.googleapis.com/nocturnal24/images/Catacombs.png'
  },

  // --- METAL & WAR CHAIN ---
  blood_forge: {
    id: 'blood_forge',
    name: 'Blood Forge',
    chain: 'Metal',
    inputs: { [ResourceType.BLOOD]: 2.0 },
    outputs: { [ResourceType.IRON]: 0.3 },
    description: "Smelts iron using blood.",
    flavor: "Quenched in gore, the steel never rusts.",
    baseCost: { [ResourceType.BONE]: 200, [ResourceType.OBSIDIAN]: 100 },
    costScaling: 1.3, // Reduced from 1.5
    productionScaling: 1.0,
    maxSlavesBase: 5,
    requires: ['quarry'],
    image: 'https://storage.googleapis.com/nocturnal24/images/Blood%20forge.png'
  },
  obsidian_smelter: {
    id: 'obsidian_smelter',
    name: 'Obsidian Smelter',
    chain: 'Metal',
    inputs: { [ResourceType.OBSIDIAN]: 5.0 },
    outputs: { [ResourceType.REFINED_OBSIDIAN]: 0.5 },
    description: "Refines raw obsidian.",
    baseCost: { [ResourceType.IRON]: 100, [ResourceType.BONE]: 500 },
    costScaling: 1.3, // Reduced from 1.6
    productionScaling: 1.0,
    maxSlavesBase: 5,
    requires: ['blood_forge'],
    image: 'https://storage.googleapis.com/nocturnal24/images/echanting.png'
  },
  necrotic_armory: {
    id: 'necrotic_armory',
    name: 'Necrotic Armory',
    chain: 'Metal',
    inputs: { [ResourceType.IRON]: 1.0, [ResourceType.REFINED_OBSIDIAN]: 1.0, [ResourceType.BLOOD]: 5.0 },
    outputs: { [ResourceType.DARK_WEAPONS]: 0.1, [ResourceType.DARK_ARMOR]: 0.1 },
    description: "Forges dark weapons and armor.",
    flavor: "Blades that hunger and plates that bleed.",
    baseCost: { [ResourceType.REFINED_OBSIDIAN]: 50, [ResourceType.IRON]: 200 },
    costScaling: 1.4, // Reduced from 1.8
    productionScaling: 1.0,
    maxSlavesBase: 5,
    requires: ['obsidian_smelter'],
    requiredTech: 'necrotic_metallurgy',
    image: 'https://storage.googleapis.com/nocturnal24/images/Enchanting%20pool.png'
  },

  // --- CITADEL & HEROES ---
  vampire_manor: {
    id: 'vampire_manor',
    name: 'Vampire Manor',
    chain: 'Citadel',
    inputs: { [ResourceType.BLOOD]: 5.0, [ResourceType.SLAVES]: 0.2 },
    outputs: { [ResourceType.INFLUENCE]: 0.5 },
    description: "Grants +1 Hero Slot. Maintains minor lords.",
    flavor: "Decadence and decay in equal measure.",
    baseCost: { [ResourceType.INFLUENCE]: 500, [ResourceType.REFINED_OBSIDIAN]: 50 },
    costScaling: 1.8, // Reduced from 2.5
    productionScaling: 1.0,
    maxSlavesBase: 10,
    requiredTech: 'noble_lineage',
    image: PH('Manor', 'a855f7')
  },
  throne_of_night: {
    id: 'throne_of_night',
    name: 'Throne of Night',
    chain: 'Citadel',
    inputs: { [ResourceType.BLOOD]: 50.0, [ResourceType.SOULS]: 10.0 },
    outputs: { [ResourceType.INFLUENCE]: 5.0 },
    description: "Grants +2 Hero Slots. The seat of supreme power. Unique.",
    flavor: "A chair of bone, from which the world looks small.",
    baseCost: { [ResourceType.INFLUENCE]: 5000, [ResourceType.VOID_CRYSTALS]: 10 },
    costScaling: 2.5, // Reduced from 5.0
    productionScaling: 1.0,
    maxSlavesBase: 20,
    unique: true,
    requiredTech: 'dark_sovereignty',
    requires: ['vampire_manor'],
    image: PH('Throne', 'facc15')
  },

  // --- MILITARY INFRASTRUCTURE ---
  spire_of_wailing: {
    id: 'spire_of_wailing',
    name: 'Spire of Wailing',
    chain: 'Military',
    inputs: { [ResourceType.ESSENCE]: 1.0 },
    outputs: { [ResourceType.SOULS]: 0.5 },
    description: "Attracts spirits. Required for Spectres.",
    flavor: "The wind through the spires sounds like the damned.",
    baseCost: { [ResourceType.OBSIDIAN]: 500, [ResourceType.ESSENCE]: 50 },
    costScaling: 1.3, // Reduced from 1.5
    productionScaling: 1.0,
    maxSlavesBase: 0,
    requiredTech: 'ethereal_binding',
    image: ''
  },
  dueling_grounds: {
    id: 'dueling_grounds',
    name: 'Dueling Grounds',
    chain: 'Military',
    inputs: { [ResourceType.BLOOD]: 5.0 },
    outputs: {},
    description: "Arena for Vampire training. Required for Blood Knights.",
    flavor: "Only the strongest survive the training. The rest are dinner.",
    baseCost: { [ResourceType.DARK_WEAPONS]: 50, [ResourceType.BONE]: 1000 },
    costScaling: 1.3,
    productionScaling: 1.0,
    maxSlavesBase: 5,
    requiredTech: 'sanguine_aristocracy',
    image: 'https://storage.googleapis.com/nocturnal24/images/Dueling%20sands.png'
  },
  bone_bowyer: {
    id: 'bone_bowyer',
    name: 'Bone Bowyer',
    chain: 'Military',
    inputs: { [ResourceType.BONE]: 8.0 }, 
    outputs: {},
    outputsUnits: { 'skeleton_archer': 0.1 }, 
    description: "Crafts bows from bone and sinew. Raises Skeleton Archers.",
    flavor: "The snap of bone, the whistle of death.",
    baseCost: { [ResourceType.BONE]: 300, [ResourceType.INFLUENCE]: 50 },
    costScaling: 1.4,
    productionScaling: 1.0,
    maxSlavesBase: 5,
    requiredTech: 'skeletal_archery',
    image: PH('Bowyer', 'f5f5f4')
  },
  sanguine_fletcher: {
    id: 'sanguine_fletcher',
    name: 'Sanguine Fletcher',
    chain: 'Military',
    inputs: { [ResourceType.BLOOD]: 10.0, [ResourceType.DARK_WEAPONS]: 0.2 },
    outputs: {},
    outputsUnits: { 'vampire_marksman': 0.05 },
    description: "Trains Vampire Marksmen.",
    flavor: "Every arrow seeks the heart.",
    baseCost: { [ResourceType.OBSIDIAN]: 500, [ResourceType.BLOOD]: 1000 },
    costScaling: 1.4,
    productionScaling: 1.0,
    maxSlavesBase: 3,
    requiredTech: 'blood_ballistics',
    requires: ['dueling_grounds'],
    image: PH('Fletcher', '7f1d1d')
  },
  cursed_library: {
    id: 'cursed_library',
    name: 'Cursed Library',
    chain: 'Military',
    inputs: { [ResourceType.SOULS]: 2.0 },
    outputs: { [ResourceType.CONCENTRATED_ESSENCE]: 0.1 },
    description: "Forbidden knowledge storage. Required for Liches.",
    flavor: "Books bound in skin, inked in blood.",
    baseCost: { [ResourceType.OBSIDIAN]: 1000, [ResourceType.ESSENCE]: 200 },
    costScaling: 1.4,
    productionScaling: 1.0,
    maxSlavesBase: 2,
    requiredTech: 'phylactery_crafting',
    image: PH('Library', '818cf8')
  },
  hall_of_lords: { 
    id: 'hall_of_lords',
    name: 'Hall of Lords',
    chain: 'Military',
    inputs: { [ResourceType.INFLUENCE]: 5.0 },
    outputs: {},
    description: "Seat of power for Minor Lords. (+1 Hero Slot)",
    baseCost: { [ResourceType.REFINED_OBSIDIAN]: 100, [ResourceType.VOID_CRYSTALS]: 10 },
    costScaling: 1.8,
    productionScaling: 1.0,
    maxSlavesBase: 0,
    requiredTech: 'dark_court',
    image: PH('Hall', 'c026d3')
  },

  // --- MAGIC CHAIN ---
  blood_altar: {
    id: 'blood_altar',
    name: 'Blood Altar',
    chain: 'Magic',
    inputs: { [ResourceType.BLOOD]: 10.0, [ResourceType.SOULS]: 2.0 },
    outputs: { [ResourceType.ESSENCE]: 0.1 },
    description: "Sacrifice blood and souls for Essence.",
    flavor: "The gods are dead. We take their power.",
    baseCost: { [ResourceType.BONE]: 300, [ResourceType.IRON]: 50 },
    costScaling: 1.4,
    productionScaling: 1.0,
    maxSlavesBase: 3,
    requires: ['blood_forge'],
    requiredTech: 'blood_sorcery',
    image: 'https://storage.googleapis.com/nocturnal24/images/Howling%20spire.png'
  },
  alchemy_wing: {
    id: 'alchemy_wing',
    name: 'Alchemy Wing',
    chain: 'Magic',
    inputs: { [ResourceType.ESSENCE]: 1.0, [ResourceType.BONE]: 10.0 },
    outputs: { [ResourceType.CONCENTRATED_ESSENCE]: 0.05 },
    description: "Distills essence.",
    flavor: "Bubbling vials of liquid nightmare.",
    baseCost: { [ResourceType.ESSENCE]: 50, [ResourceType.OBSIDIAN]: 200 },
    costScaling: 1.5,
    productionScaling: 1.0,
    maxSlavesBase: 3,
    requires: ['blood_altar'],
    requiredTech: 'alchemy_basics',
    image: 'https://storage.googleapis.com/nocturnal24/images/Lab.png'
  },
  void_rift: {
    id: 'void_rift',
    name: 'Void Rift',
    chain: 'Magic',
    inputs: { [ResourceType.CONCENTRATED_ESSENCE]: 0.5, [ResourceType.SOULS]: 20.0 },
    outputs: { [ResourceType.VOID_CRYSTALS]: 0.01 },
    description: "Yields Void Crystals.",
    flavor: "Stare not too long, lest it stares back.",
    baseCost: { [ResourceType.CONCENTRATED_ESSENCE]: 20, [ResourceType.OBSIDIAN]: 1000 },
    costScaling: 1.8,
    productionScaling: 1.0,
    maxSlavesBase: 0,
    requires: ['alchemy_wing'],
    requiredTech: 'void_manipulation',
    image: 'https://storage.googleapis.com/nocturnal24/images/Portal.png'
  },

  // --- ELITE TRAINING CHAIN ---
  necromancy_sanctum: {
    id: 'necromancy_sanctum',
    name: 'Necromancy Sanctum',
    chain: 'Elite',
    inputs: { [ResourceType.BONE]: 10.0, [ResourceType.SOULS]: 1.0 },
    outputs: {},
    outputsUnits: { 'skeleton_warrior': 0.1 },
    description: "Automatically raises Skeletons.",
    flavor: "The dead do not rest here. They enlist.",
    baseCost: { [ResourceType.ESSENCE]: 100, [ResourceType.BONE]: 500 },
    costScaling: 1.4,
    productionScaling: 1.0,
    maxSlavesBase: 2,
    requires: ['blood_altar'],
    requiredTech: 'skeletal_mastery',
    image: PH('Sanctum', '22c55e')
  },

  // --- PARASITIC CHAIN (On Enemy Territory) ---
  whispering_totem: {
    id: 'whispering_totem',
    name: 'Whispering Totem',
    chain: 'Parasitic',
    inputs: {},
    outputs: { [ResourceType.INFLUENCE]: 0.5 }, // Passive inf
    description: "Corrupts enemy lands over time. Must be built on Enemy land.",
    flavor: "A subtle monument to madness.",
    baseCost: { [ResourceType.BONE]: 200, [ResourceType.SOULS]: 50 },
    costScaling: 1.3,
    productionScaling: 1.0,
    maxSlavesBase: 0,
    placement: BuildingPlacement.ENEMY,
    requiredTech: 'subversive_influence',
    image: PH('Totem', '84cc16')
  },
  shadow_siphon: {
    id: 'shadow_siphon',
    name: 'Shadow Siphon',
    chain: 'Parasitic',
    inputs: {},
    outputs: { [ResourceType.BLOOD]: 1.0, [ResourceType.SOULS]: 0.2 },
    description: "Steals resources from local populace.",
    flavor: "They grow weak, we grow strong.",
    baseCost: { [ResourceType.OBSIDIAN]: 300, [ResourceType.DARK_WEAPONS]: 5 },
    costScaling: 1.3,
    productionScaling: 1.0,
    maxSlavesBase: 0,
    placement: BuildingPlacement.ENEMY,
    requiredTech: 'resource_leeching',
    image: PH('Siphon', '14b8a6')
  },
  blood_tax_office: {
    id: 'blood_tax_office',
    name: 'Blood Tax Office',
    chain: 'Parasitic',
    inputs: { [ResourceType.INFLUENCE]: 1.0 },
    outputs: { [ResourceType.BLOOD]: 5.0 },
    description: "Aggressively drains blood. High relationship penalty.",
    flavor: "The bureaucracy of death.",
    baseCost: { [ResourceType.INFLUENCE]: 200, [ResourceType.DARK_WEAPONS]: 10 },
    costScaling: 1.4,
    productionScaling: 1.0,
    maxSlavesBase: 0,
    placement: BuildingPlacement.ENEMY,
    requiredTech: 'blood_tithe_rights',
    image: PH('Tax', 'eab308')
  },

  // --- SYMBIOTIC CHAIN (On Enemy Territory) ---
  cultist_lodge: {
    id: 'cultist_lodge',
    name: 'Cultist Lodge',
    chain: 'Symbiotic',
    inputs: { [ResourceType.INFLUENCE]: 2.0 },
    outputs: { [ResourceType.SOULS]: 2.0 }, // Converts people
    description: "Symbiotic: Spreads corruption rapidly (+Influence area effect).",
    flavor: "Open your mind to the darkness.",
    baseCost: { [ResourceType.INFLUENCE]: 500, [ResourceType.BLOOD]: 500 },
    costScaling: 1.4,
    productionScaling: 1.0,
    maxSlavesBase: 0,
    placement: BuildingPlacement.ENEMY,
    requiredTech: 'cult_propagation',
    image: PH('Lodge', '6366f1')
  },
  
  // --- ECONOMY / MERCENARY CHAIN ---
  shadow_market: {
    id: 'shadow_market',
    name: 'Shadow Market',
    chain: 'Construction',
    inputs: { [ResourceType.INFLUENCE]: 0.5 },
    outputs: { [ResourceType.GOLD]: 1.0 },
    description: "A hub for illicit trade and mercenaries.",
    flavor: "Everything has a price. Even loyalty.",
    baseCost: { [ResourceType.INFLUENCE]: 200, [ResourceType.BLOOD]: 100 },
    costScaling: 1.3,
    productionScaling: 1.0,
    maxSlavesBase: 5,
    requiredTech: 'mercenary_contracts',
    image: PH('Market', 'd4af37')
  }
};
