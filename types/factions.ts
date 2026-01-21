
export enum FactionId {
  PLAYER = 'PLAYER',
  HOUSE_DRACUL = 'HOUSE_DRACUL',
  HOUSE_LILITU = 'HOUSE_LILITU',
  HOUSE_NECROS = 'HOUSE_NECROS',
  PEASANT_VILLAGES = 'PEASANT_VILLAGES',
  CHURCH_INQUISITION = 'CHURCH_INQUISITION',
  MERCHANT_GUILD = 'MERCHANT_GUILD',
  VAMPIRE_HUNTERS = 'VAMPIRE_HUNTERS'
}

export enum FactionType {
  VAMPIRE_HOUSE = 'VAMPIRE_HOUSE',
  HUMAN_ORG = 'HUMAN_ORG'
}

export enum FactionStatus {
  NEUTRAL = 'NEUTRAL',
  WAR = 'WAR',
  ALLY = 'ALLY',
  VASSAL = 'VASSAL'
}

export enum IntrigueType {
  BRIBE = 'BRIBE',
  SEDUCE = 'SEDUCE',
  DEMAND = 'DEMAND',
  WAR = 'WAR',
  // Vampire Specific
  GIFT_SLAVES = 'GIFT_SLAVES',
  SELL_SLAVES = 'SELL_SLAVES',
  MARRIAGE = 'MARRIAGE',
  ALLIANCE = 'ALLIANCE',
  CONFEDERATE = 'CONFEDERATE'
}

export interface Faction {
  id: FactionId;
  name: string;
  type: FactionType;
  description: string;
  relation: number;
  status: FactionStatus;
  traits: string[];
  avatarIcon: string;
}

export const FACTION_COLORS: Record<FactionId, string> = {
  [FactionId.PLAYER]: '#ef4444', // Red-500
  [FactionId.HOUSE_DRACUL]: '#7f1d1d', // Red-900
  [FactionId.HOUSE_LILITU]: '#ec4899', // Pink-500
  [FactionId.HOUSE_NECROS]: '#8b5cf6', // Violet-500
  [FactionId.PEASANT_VILLAGES]: '#10b981', // Emerald-500
  [FactionId.CHURCH_INQUISITION]: '#fbbf24', // Amber-400
  [FactionId.MERCHANT_GUILD]: '#3b82f6', // Blue-500
  [FactionId.VAMPIRE_HUNTERS]: '#52525b' // Zinc-600
};
