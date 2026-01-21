
import { ResourceType } from './resources';
import { ActiveBuilding } from './buildings';
import { ArmyStack, RecruitmentOrder } from './units';
import { ScoutResult } from './world';
import { Item } from './items';

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'Request' | 'Response' | 'Error';
  action: string;
  data: any;
}

export interface ProgressionMilestone {
  id: string;
  requiredInfluence: number;
  title: string;
  description: string;
  unlocked: boolean;
}

export interface GameState {
  resources: Record<ResourceType, number>;
  buildings: ActiveBuilding[];
  army: ArmyStack[];
  inventory: Item[];
  recruitmentQueue: RecruitmentOrder[];
  activeResearch: { techId: string; startTime: number; endTime: number } | null;
  researchedTechs: string[];
  location: { lat: number; lng: number } | null;
  scoutResults: ScoutResult[];
  lastTick: number;
  activeQuests: any[]; // Placeholder
  logs: LogEntry[];
  playerLevel: number;
}

export const INITIAL_STATE: GameState = {
  resources: {
    [ResourceType.BLOOD]: 200,
    [ResourceType.SOULS]: 10,
    [ResourceType.BONE]: 50,
    [ResourceType.OBSIDIAN]: 50,
    [ResourceType.IRON]: 0,
    [ResourceType.ESSENCE]: 0,
    [ResourceType.VOID_CRYSTALS]: 0,
    [ResourceType.INFLUENCE]: 100,
    [ResourceType.DARK_WEAPONS]: 0,
    [ResourceType.DARK_ARMOR]: 0,
    [ResourceType.SLAVES]: 0,
    [ResourceType.REFINED_OBSIDIAN]: 0,
    [ResourceType.CONCENTRATED_ESSENCE]: 0,
    [ResourceType.GOLD]: 0
  },
  buildings: [],
  army: [],
  inventory: [],
  recruitmentQueue: [],
  activeResearch: null,
  researchedTechs: ['dark_covenant'],
  location: null,
  scoutResults: [],
  lastTick: Date.now(),
  activeQuests: [],
  logs: [],
  playerLevel: 1
};
