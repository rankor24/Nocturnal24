

import { ResourceType } from './resources';

export enum TechEffectType {
  UNLOCK_UNIT = 'UNLOCK_UNIT',
  UNLOCK_BUILDING = 'UNLOCK_BUILDING',
  PRODUCTION_MODIFIER = 'PRODUCTION_MODIFIER',
  UNIT_STAT_MODIFIER = 'UNIT_STAT_MODIFIER',
  UNLOCK_ABILITY = 'UNLOCK_ABILITY'
}

export interface TechEffect {
  type: TechEffectType;
  target?: string; 
  value: number; 
}

export interface TechDef {
  id: string;
  name: string;
  description: string;
  cost: Partial<Record<ResourceType, number>>;
  researchTime: number; 
  requires: string[]; 
  effects: TechEffect[];
  position: { x: number; y: number }; 
  icon: string;
}

export const TECH_DEFINITIONS: Record<string, TechDef> = {
  // ROOT (Top Center)
  dark_covenant: {
    id: 'dark_covenant',
    name: 'Dark Covenant',
    description: 'The first pact with the shadows. Unlocks basic construction.',
    cost: { [ResourceType.BLOOD]: 50 },
    researchTime: 10,
    requires: [],
    effects: [],
    position: { x: 50, y: 5 },
    icon: 'GiSecretBook'
  },
  
  // --- ECONOMY & BLOOD BRANCH (Left) ---
  industrial_hematology: {
    id: 'industrial_hematology',
    name: 'Industrial Hematology',
    description: 'Mass processing of vital fluids.',
    cost: { [ResourceType.BLOOD]: 500, [ResourceType.IRON]: 100 },
    researchTime: 60,
    requires: ['dark_covenant'],
    effects: [],
    position: { x: 25, y: 15 },
    icon: 'GiDrop'
  },
  crimson_engineering: {
    id: 'crimson_engineering',
    name: 'Crimson Engineering',
    description: 'Advanced blood processing. Unlocks Crimson Reservoir.',
    cost: { [ResourceType.BLOOD]: 2000, [ResourceType.OBSIDIAN]: 500 },
    researchTime: 120,
    requires: ['industrial_hematology'],
    effects: [{ type: TechEffectType.UNLOCK_BUILDING, target: 'crimson_reservoir', value: 1 }],
    position: { x: 15, y: 25 },
    icon: 'GiDrop'
  },
  
  // --- MAGIC BRANCH (Deep Left) ---
  blood_sorcery: {
    id: 'blood_sorcery',
    name: 'Blood Sorcery',
    description: 'Harness the power of vital fluid. Unlocks Altar.',
    cost: { [ResourceType.BLOOD]: 200, [ResourceType.SOULS]: 10 },
    researchTime: 30,
    requires: ['industrial_hematology'],
    effects: [{ type: TechEffectType.UNLOCK_BUILDING, target: 'blood_altar', value: 1 }],
    position: { x: 35, y: 25 },
    icon: 'GiWizardStaff'
  },
  alchemy_basics: {
    id: 'alchemy_basics',
    name: 'Forbidden Alchemy',
    description: 'Distillation of souls into essence.',
    cost: { [ResourceType.ESSENCE]: 20, [ResourceType.BONE]: 100 },
    researchTime: 60,
    requires: ['blood_sorcery'],
    effects: [{ type: TechEffectType.UNLOCK_BUILDING, target: 'alchemy_wing', value: 1 }],
    position: { x: 30, y: 35 },
    icon: 'GiPotionBall'
  },
  soul_harvesting: {
    id: 'soul_harvesting',
    name: 'Soul Harvesting',
    description: 'Advanced soul extraction.',
    cost: { [ResourceType.SOULS]: 500, [ResourceType.ESSENCE]: 50 },
    researchTime: 120,
    requires: ['alchemy_basics'],
    effects: [{ type: TechEffectType.UNLOCK_BUILDING, target: 'soul_conduit', value: 1 }],
    position: { x: 15, y: 40 },
    icon: 'GiGhost'
  },
  ethereal_binding: {
    id: 'ethereal_binding',
    name: 'Ethereal Binding',
    description: 'Unlocks Spectres & Spire of Wailing.',
    cost: { [ResourceType.ESSENCE]: 50, [ResourceType.SOULS]: 100 },
    researchTime: 120,
    requires: ['alchemy_basics'],
    effects: [
      { type: TechEffectType.UNLOCK_UNIT, target: 'spectre', value: 1 },
      { type: TechEffectType.UNLOCK_BUILDING, target: 'spire_of_wailing', value: 1 }
    ],
    position: { x: 25, y: 50 },
    icon: 'GiGhost'
  },
  screaming_void: {
    id: 'screaming_void',
    name: 'Screaming Void',
    description: 'Evolve Spectres into Banshees.',
    cost: { [ResourceType.CONCENTRATED_ESSENCE]: 5 },
    researchTime: 180,
    requires: ['ethereal_binding'],
    effects: [{ type: TechEffectType.UNLOCK_UNIT, target: 'banshee', value: 1 }],
    position: { x: 20, y: 60 },
    icon: 'GiGhost'
  },
  phylactery_crafting: {
    id: 'phylactery_crafting',
    name: 'Phylactery Crafting',
    description: 'Soul vessels. Unlocks Liches & Cursed Library.',
    cost: { [ResourceType.SOULS]: 200, [ResourceType.OBSIDIAN]: 200 },
    researchTime: 150,
    requires: ['alchemy_basics'],
    effects: [
        { type: TechEffectType.UNLOCK_UNIT, target: 'lich', value: 1 },
        { type: TechEffectType.UNLOCK_BUILDING, target: 'cursed_library', value: 1 }
    ],
    position: { x: 40, y: 50 },
    icon: 'GiSkullStaff'
  },
  phylactery_mastery: {
    id: 'phylactery_mastery',
    name: 'Phylactery Mastery',
    description: 'Evolve Liches into Ancient Liches (Survivor).',
    cost: { [ResourceType.VOID_CRYSTALS]: 2 },
    researchTime: 300,
    requires: ['phylactery_crafting'],
    effects: [{ type: TechEffectType.UNLOCK_UNIT, target: 'ancient_lich', value: 1 }],
    position: { x: 40, y: 65 },
    icon: 'GiSkullStaff'
  },
  void_manipulation: {
    id: 'void_manipulation',
    name: 'Void Manipulation',
    description: 'Unlocks Void Rift.',
    cost: { [ResourceType.CONCENTRATED_ESSENCE]: 10 },
    researchTime: 300,
    requires: ['phylactery_mastery'],
    effects: [{ type: TechEffectType.UNLOCK_BUILDING, target: 'void_rift', value: 1 }],
    position: { x: 35, y: 80 },
    icon: 'GiCrystalGrowth'
  },

  // --- MILITARY & BONE BRANCH (Center) ---
  skeletal_mastery: {
    id: 'skeletal_mastery',
    name: 'Skeletal Mastery',
    description: 'Reanimate bones. Unlocks Skeletons & Carvers.',
    cost: { [ResourceType.BONE]: 100, [ResourceType.BLOOD]: 50 },
    researchTime: 45,
    requires: ['dark_covenant'], // Decoupled from Industrial Hematology for distinct path
    effects: [
      { type: TechEffectType.UNLOCK_UNIT, target: 'skeleton_warrior', value: 1 },
      { type: TechEffectType.UNLOCK_BUILDING, target: 'bone_carver', value: 1 }
    ],
    position: { x: 50, y: 20 },
    icon: 'GiBrokenBone'
  },
  skeletal_archery: {
    id: 'skeletal_archery',
    name: 'Skeletal Archery',
    description: 'Teach the dead to aim.',
    cost: { [ResourceType.BONE]: 200, [ResourceType.INFLUENCE]: 50 },
    researchTime: 60,
    requires: ['skeletal_mastery'],
    effects: [
        { type: TechEffectType.UNLOCK_UNIT, target: 'skeleton_archer', value: 1 },
        { type: TechEffectType.UNLOCK_BUILDING, target: 'bone_bowyer', value: 1 }
    ],
    position: { x: 40, y: 30 }, 
    icon: 'GiCrossbow'
  },
  flesh_weaving: {
    id: 'flesh_weaving',
    name: 'Flesh Weaving',
    description: 'Evolve Zombies into Rotting Hulks.',
    cost: { [ResourceType.BLOOD]: 200, [ResourceType.SOULS]: 50 },
    researchTime: 60,
    requires: ['skeletal_mastery'],
    effects: [{ type: TechEffectType.UNLOCK_UNIT, target: 'rotting_hulk', value: 1 }],
    position: { x: 57, y: 30 },
    icon: 'GiHealthNormal'
  },
  necrotic_metallurgy: {
    id: 'necrotic_metallurgy',
    name: 'Necrotic Metallurgy',
    description: 'Infuse iron with death. Unlocks Armory.',
    cost: { [ResourceType.IRON]: 50, [ResourceType.BONE]: 200 },
    researchTime: 90,
    requires: ['skeletal_mastery'],
    effects: [{ type: TechEffectType.UNLOCK_BUILDING, target: 'necrotic_armory', value: 1 }],
    position: { x: 50, y: 40 },
    icon: 'GiAnvil'
  },
  dark_steel_forging: {
    id: 'dark_steel_forging',
    name: 'Dark Steel Forging',
    description: 'Evolve Skeletons into Champions.',
    cost: { [ResourceType.IRON]: 100, [ResourceType.DARK_ARMOR]: 5 },
    researchTime: 60,
    requires: ['necrotic_metallurgy'],
    effects: [{ type: TechEffectType.UNLOCK_UNIT, target: 'skeleton_champion', value: 1 }],
    position: { x: 40, y: 50 },
    icon: 'GiAnvil'
  },
  sanguine_aristocracy: {
    id: 'sanguine_aristocracy',
    name: 'Sanguine Aristocracy',
    description: 'Unlocks Blood Knights & Dueling Grounds.',
    cost: { [ResourceType.BLOOD]: 500, [ResourceType.DARK_WEAPONS]: 10 },
    researchTime: 180,
    requires: ['necrotic_metallurgy'],
    effects: [
        { type: TechEffectType.UNLOCK_UNIT, target: 'blood_knight', value: 1 },
        { type: TechEffectType.UNLOCK_BUILDING, target: 'dueling_grounds', value: 1 }
    ],
    position: { x: 50, y: 60 },
    icon: 'GiAbdominalArmor'
  },
  blood_ballistics: {
    id: 'blood_ballistics',
    name: 'Blood Ballistics',
    description: 'Precision warfare for the immortal.',
    cost: { [ResourceType.BLOOD]: 1000, [ResourceType.DARK_WEAPONS]: 20 },
    researchTime: 120,
    requires: ['sanguine_aristocracy'],
    effects: [
        { type: TechEffectType.UNLOCK_UNIT, target: 'vampire_marksman', value: 1 },
        { type: TechEffectType.UNLOCK_BUILDING, target: 'sanguine_fletcher', value: 1 }
    ],
    position: { x: 62, y: 65 },
    icon: 'GiCrossbow'
  },
  eternal_thirst: {
    id: 'eternal_thirst',
    name: 'Eternal Thirst',
    description: 'Evolve Knights into Sanguine Lords.',
    cost: { [ResourceType.BLOOD]: 2000, [ResourceType.REFINED_OBSIDIAN]: 20 },
    researchTime: 300,
    requires: ['sanguine_aristocracy'],
    effects: [{ type: TechEffectType.UNLOCK_UNIT, target: 'sanguine_lord', value: 1 }],
    position: { x: 50, y: 75 },
    icon: 'GiAbdominalArmor'
  },
  
  // --- CONSTRUCTION / MINING SUB-BRANCH (Moved from Diplo) ---
  deep_excavation: {
    id: 'deep_excavation',
    name: 'Deep Excavation',
    description: 'Access the underworld. Unlocks Catacombs.',
    cost: { [ResourceType.BONE]: 2000, [ResourceType.SLAVES]: 10 },
    researchTime: 90,
    requires: ['skeletal_mastery'], 
    effects: [{ type: TechEffectType.UNLOCK_BUILDING, target: 'catacomb_complex', value: 1 }],
    position: { x: 62, y: 24 },
    icon: 'GiStoneBlock'
  },

  // --- DIPLOMACY & INFLUENCE BRANCH (Right) ---
  dark_architecture: {
    id: 'dark_architecture',
    name: 'Dark Architecture',
    description: 'Efficient lair design. Unlocks Slave Quarters.',
    cost: { [ResourceType.INFLUENCE]: 50, [ResourceType.OBSIDIAN]: 50 },
    researchTime: 40,
    requires: ['dark_covenant'],
    effects: [{ type: TechEffectType.UNLOCK_BUILDING, target: 'slave_quarters', value: 1 }],
    position: { x: 80, y: 15 },
    icon: 'GiCastle'
  },
  // deep_excavation MOVED FROM HERE
  subversive_influence: {
    id: 'subversive_influence',
    name: 'Subversive Influence',
    description: 'Unlocks "Whispering Totem" (Parasitic).',
    cost: { [ResourceType.INFLUENCE]: 200, [ResourceType.SOULS]: 50 },
    researchTime: 90,
    requires: ['dark_architecture'],
    effects: [{ type: TechEffectType.UNLOCK_BUILDING, target: 'whispering_totem', value: 1 }],
    position: { x: 88, y: 30 },
    icon: 'GiSpy'
  },
  pheromone_alchemy: {
    id: 'pheromone_alchemy',
    name: 'Pheromone Alchemy',
    description: 'Unlocks the ability to Seduce leaders.',
    cost: { [ResourceType.INFLUENCE]: 400, [ResourceType.ESSENCE]: 10 },
    researchTime: 120,
    requires: ['subversive_influence'],
    effects: [{ type: TechEffectType.UNLOCK_ABILITY, target: 'SEDUCE', value: 1 }],
    position: { x: 94, y: 40 },
    icon: 'GiLips'
  },
  cult_propagation: {
    id: 'cult_propagation',
    name: 'Cult Propagation',
    description: 'Unlocks "Cultist Lodge" (Symbiotic). Spreads corruption.',
    cost: { [ResourceType.INFLUENCE]: 1000, [ResourceType.BLOOD]: 1000 },
    researchTime: 180,
    requires: ['subversive_influence'],
    effects: [{ type: TechEffectType.UNLOCK_BUILDING, target: 'cultist_lodge', value: 1 }],
    position: { x: 94, y: 50 },
    icon: 'GiHood'
  },
  resource_leeching: {
    id: 'resource_leeching',
    name: 'Resource Leeching',
    description: 'Unlocks "Shadow Siphon" (Parasitic).',
    cost: { [ResourceType.INFLUENCE]: 500, [ResourceType.VOID_CRYSTALS]: 1 },
    researchTime: 150,
    requires: ['subversive_influence'],
    effects: [{ type: TechEffectType.UNLOCK_BUILDING, target: 'shadow_siphon', value: 1 }],
    position: { x: 85, y: 40 },
    icon: 'GiBatWing'
  },
  blood_tithe_rights: {
    id: 'blood_tithe_rights',
    name: 'Blood Tithe Rights',
    description: 'Unlocks "Blood Tax Office" (Parasitic).',
    cost: { [ResourceType.INFLUENCE]: 800, [ResourceType.BLOOD]: 500 },
    researchTime: 180,
    requires: ['resource_leeching'],
    effects: [{ type: TechEffectType.UNLOCK_BUILDING, target: 'blood_tax_office', value: 1 }],
    position: { x: 85, y: 50 },
    icon: 'GiScrollQuill'
  },
  dark_court: {
    id: 'dark_court',
    name: 'The Dark Court',
    description: 'Establish a hierarchy of Lords.',
    cost: { [ResourceType.INFLUENCE]: 2000, [ResourceType.BLOOD]: 5000 },
    researchTime: 600,
    requires: ['resource_leeching'],
    effects: [{ type: TechEffectType.UNLOCK_BUILDING, target: 'hall_of_lords', value: 1 }],
    position: { x: 85, y: 60 },
    icon: 'GiCrownCoin'
  },
  imperial_mandate: {
    id: 'imperial_mandate',
    name: 'Imperial Mandate',
    description: 'Unlocks the ability to Demand Tribute.',
    cost: { [ResourceType.INFLUENCE]: 3000, [ResourceType.DARK_WEAPONS]: 50 },
    researchTime: 300,
    requires: ['dark_court'],
    effects: [{ type: TechEffectType.UNLOCK_ABILITY, target: 'DEMAND', value: 1 }],
    position: { x: 95, y: 65 },
    icon: 'GiScrollUnfurled'
  },
  noble_lineage: {
    id: 'noble_lineage',
    name: 'Noble Lineage',
    description: 'Unlocks Minor Lord hero units and Vampire Manors.',
    cost: { [ResourceType.INFLUENCE]: 5000, [ResourceType.ESSENCE]: 100 },
    researchTime: 600,
    requires: ['dark_court'],
    effects: [
       { type: TechEffectType.UNLOCK_UNIT, target: 'vampire_lord_hero', value: 1 },
       { type: TechEffectType.UNLOCK_BUILDING, target: 'vampire_manor', value: 1 }
    ],
    position: { x: 85, y: 70 },
    icon: 'GiCrownedSkull'
  },
  dark_sovereignty: {
    id: 'dark_sovereignty',
    name: 'Dark Sovereignty',
    description: 'Unlocks Throne of Night. Maximum Hero capacity.',
    cost: { [ResourceType.INFLUENCE]: 10000, [ResourceType.VOID_CRYSTALS]: 50 },
    researchTime: 1200,
    requires: ['noble_lineage'],
    effects: [{ type: TechEffectType.UNLOCK_BUILDING, target: 'throne_of_night', value: 1 }],
    position: { x: 85, y: 80 },
    icon: 'GiKing'
  },

  // --- COMMERCE & ALLIANCE (Branching from Root) ---
  coin_of_judas: {
    id: 'coin_of_judas',
    name: 'Coin of Judas',
    description: 'Unlocks the ability to Bribe factions.',
    cost: { [ResourceType.BLOOD]: 300, [ResourceType.INFLUENCE]: 100 },
    researchTime: 60,
    requires: ['dark_covenant'],
    effects: [{ type: TechEffectType.UNLOCK_ABILITY, target: 'BRIBE', value: 1 }],
    position: { x: 70, y: 22 },
    icon: 'GiCoins'
  },
  mercenary_contracts: {
    id: 'mercenary_contracts',
    name: 'Mercenary Contracts',
    description: 'Hire human scum for Gold. Unlocks Shadow Market.',
    cost: { [ResourceType.INFLUENCE]: 250, [ResourceType.BLOOD]: 500 },
    researchTime: 90,
    requires: ['coin_of_judas'],
    effects: [{ type: TechEffectType.UNLOCK_BUILDING, target: 'shadow_market', value: 1 }],
    position: { x: 66, y: 34 },
    icon: 'GiSwordsEmblem'
  },
  thrall_trade: {
    id: 'thrall_trade',
    name: 'Slave Trading',
    description: 'Establish markets for the living. Sell or Gift Slaves to Vampire Houses.',
    cost: { [ResourceType.INFLUENCE]: 500, [ResourceType.SLAVES]: 10 },
    researchTime: 120,
    requires: ['coin_of_judas'],
    effects: [
      { type: TechEffectType.UNLOCK_ABILITY, target: 'SELL_SLAVES', value: 1 },
      { type: TechEffectType.UNLOCK_ABILITY, target: 'GIFT_SLAVES', value: 1 }
    ],
    position: { x: 76, y: 34 },
    icon: 'GiManacles'
  },
  blood_pact: {
    id: 'blood_pact',
    name: 'Blood Pacts',
    description: 'Formal Alliances with other Houses. Prevents relationship decay.',
    cost: { [ResourceType.INFLUENCE]: 1500, [ResourceType.BLOOD]: 1000 },
    researchTime: 240,
    requires: ['thrall_trade'],
    effects: [{ type: TechEffectType.UNLOCK_ABILITY, target: 'ALLIANCE', value: 1 }],
    position: { x: 72, y: 45 },
    icon: 'GiSwordsEmblem'
  },
  dynastic_marriage: {
    id: 'dynastic_marriage',
    name: 'Dynastic Marriage',
    description: 'Secure loyalty through unholy matrimony. Gain a Vampire Bride/Groom (Hero).',
    cost: { [ResourceType.INFLUENCE]: 5000, [ResourceType.ESSENCE]: 500 },
    researchTime: 600,
    requires: ['blood_pact', 'noble_lineage'],
    effects: [{ type: TechEffectType.UNLOCK_ABILITY, target: 'MARRIAGE', value: 1 }],
    position: { x: 78, y: 75 }, // Bridges Politics and Court
    icon: 'GiPresent'
  },
  dark_confederation: {
    id: 'dark_confederation',
    name: 'Dark Confederation',
    description: 'Unify the Houses under one banner. Absorb their lands.',
    cost: { [ResourceType.INFLUENCE]: 20000, [ResourceType.VOID_CRYSTALS]: 100 },
    researchTime: 1500,
    requires: ['dynastic_marriage', 'dark_sovereignty'],
    effects: [{ type: TechEffectType.UNLOCK_ABILITY, target: 'CONFEDERATE', value: 1 }],
    position: { x: 80, y: 95 },
    icon: 'GiCastle'
  },
  
  // --- GOD TIER (Bottom Center) ---
  draconic_resurrection: {
    id: 'draconic_resurrection',
    name: 'Draconic Rites',
    description: 'The ultimate necromancy. Unlocks Bone Dragon.',
    cost: { [ResourceType.VOID_CRYSTALS]: 5, [ResourceType.CONCENTRATED_ESSENCE]: 10 },
    researchTime: 600,
    // CHANGED: Now requires maximum magic and military
    requires: ['eternal_thirst', 'void_manipulation'], 
    effects: [{ type: TechEffectType.UNLOCK_UNIT, target: 'bone_dragon', value: 1 }],
    position: { x: 42, y: 88 },
    icon: 'GiDragonHead'
  },
  draconic_ascension: {
    id: 'draconic_ascension',
    name: 'Draconic Ascension',
    description: 'Evolve Dragon into Dracolich.',
    cost: { [ResourceType.VOID_CRYSTALS]: 20, [ResourceType.SOULS]: 5000 },
    researchTime: 1200,
    requires: ['draconic_resurrection'],
    effects: [{ type: TechEffectType.UNLOCK_UNIT, target: 'dracolich', value: 1 }],
    position: { x: 42, y: 98 },
    icon: 'GiDragonHead'
  }
};