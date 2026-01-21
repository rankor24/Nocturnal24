
export enum ItemRarity {
    COMMON = 'COMMON',
    RARE = 'RARE',
    EPIC = 'EPIC',
    LEGENDARY = 'LEGENDARY'
}

export enum ItemSlot {
    WEAPON = 'WEAPON',
    ARMOR = 'ARMOR',
    RELIC = 'RELIC'
}

export interface Item {
    id: string;
    defId: string;
    name: string;
    description: string;
    slot: ItemSlot;
    rarity: ItemRarity;
    stats: {
        damage?: number;
        defense?: number;
        hp?: number;
        speed?: number;
    }
}

export const ITEM_DEFINITIONS: Record<string, Omit<Item, 'id'>> = {
    // WEAPONS
    'rusted_blade': {
        defId: 'rusted_blade', name: 'Rusted Blade', description: 'Better than claws.',
        slot: ItemSlot.WEAPON, rarity: ItemRarity.COMMON, stats: { damage: 5 }
    },
    'shadow_fang': {
        defId: 'shadow_fang', name: 'Shadow Fang', description: 'Drips with dark ichor.',
        slot: ItemSlot.WEAPON, rarity: ItemRarity.RARE, stats: { damage: 15, speed: 2 }
    },
    'vorpal_scythe': {
        defId: 'vorpal_scythe', name: 'Vorpal Scythe', description: 'Reaps heads effortlessly.',
        slot: ItemSlot.WEAPON, rarity: ItemRarity.EPIC, stats: { damage: 40 }
    },
    
    // ARMOR
    'leather_vest': {
        defId: 'leather_vest', name: 'Leather Vest', description: 'Basic protection.',
        slot: ItemSlot.ARMOR, rarity: ItemRarity.COMMON, stats: { defense: 2, hp: 10 }
    },
    'obsidian_plate': {
        defId: 'obsidian_plate', name: 'Obsidian Plate', description: 'Shatters blades.',
        slot: ItemSlot.ARMOR, rarity: ItemRarity.RARE, stats: { defense: 10, hp: 50 }
    },
    
    // RELICS
    'blood_chalice': {
        defId: 'blood_chalice', name: 'Blood Chalice', description: 'A sip of power.',
        slot: ItemSlot.RELIC, rarity: ItemRarity.RARE, stats: { hp: 100 }
    },
    'cursed_ring': {
        defId: 'cursed_ring', name: 'Cursed Ring', description: 'Whispers of doom.',
        slot: ItemSlot.RELIC, rarity: ItemRarity.EPIC, stats: { damage: 10, speed: 5 }
    }
};
