
import { FactionId } from './factions';

export enum TerritoryAction {
  RAID = 'RAID',
  ABDUCT = 'ABDUCT',
  INFILTRATE = 'INFILTRATE',
  GIFT = 'GIFT',
  // Player Owned Actions
  FESTIVAL = 'FESTIVAL',
  INFRASTRUCTURE = 'INFRASTRUCTURE'
}

export enum TerritoryTier {
  UNCLAIMED = 0,
  OUTPOST = 1,
  ESTABLISHED = 2,
  STRONGHOLD = 3,
  DOMINION = 4
}

export enum TerrainType {
  URBAN = 'URBAN',
  RURAL = 'RURAL',
  WILDERNESS = 'WILDERNESS',
  COASTAL = 'COASTAL'
}

export interface ScoutResult {
  id: string;
  name: string;
  type: string;
  suggestedBuildingId: string;
  lat: number;
  lng: number;
  controllingFactionId?: FactionId;
}

export interface Territory {
  id: string;
  name: string;
  lat: number;
  lng: number;
  controlTier: TerritoryTier;
  defendingFaction: FactionId;
  corruptionProgress: number;
  defense: number;
  radius: number;
  terrain: TerrainType; // New property
}
