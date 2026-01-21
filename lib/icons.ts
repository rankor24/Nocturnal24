
import { 
  GiDrop, GiGhost, GiBrokenBone, GiCrystalGrowth, GiBloodySword, GiStoneBlock, GiAnvil, GiWizardStaff,
  GiBatWing, GiCastle, GiRadarSweep, GiPerson, GiUpgrade, GiSkullCrossedBones, GiPotionBall, GiAbdominalArmor, GiSwordSmithing,
  GiThorHammer, GiSecretBook, GiShield, GiSpeedometer, GiHealthNormal, GiClover, GiExitDoor,
  GiCrownCoin, GiSwordsEmblem, GiLips, GiSkullStaff, GiPitchfork, GiCrossShield, GiCoins, GiCrossbow,
  GiManacles, GiSpy, GiPresent, GiScrollQuill, GiWalk, GiScrollUnfurled, GiDragonHead, GiPadlock,
  GiPauseButton, GiPlayButton, GiTrashCan, GiRapidshareArrow, GiHood, GiCrownedSkull, GiKing, GiCheckMark,
  GiRunningNinja, GiPartyPopper, GiStoneWall, GiForest, GiVillage, GiSpikedWall, GiMagnifyingGlass
} from 'react-icons/gi';
import { ResourceType } from '../types';

export const RES_ICONS: Record<ResourceType, any> = {
  [ResourceType.BLOOD]: GiDrop,
  [ResourceType.SOULS]: GiGhost,
  [ResourceType.BONE]: GiBrokenBone,
  [ResourceType.OBSIDIAN]: GiStoneBlock,
  [ResourceType.IRON]: GiAnvil,
  [ResourceType.ESSENCE]: GiWizardStaff,
  [ResourceType.VOID_CRYSTALS]: GiCrystalGrowth,
  [ResourceType.INFLUENCE]: GiCastle,
  [ResourceType.DARK_WEAPONS]: GiSwordSmithing,
  [ResourceType.DARK_ARMOR]: GiAbdominalArmor,
  [ResourceType.SLAVES]: GiPerson,
  [ResourceType.REFINED_OBSIDIAN]: GiStoneBlock,
  [ResourceType.CONCENTRATED_ESSENCE]: GiPotionBall,
  [ResourceType.GOLD]: GiCoins
};

export const RES_COLORS: Record<ResourceType, string> = {
  [ResourceType.BLOOD]: 'text-red-500',
  [ResourceType.SOULS]: 'text-blue-400',
  [ResourceType.BONE]: 'text-gray-300',
  [ResourceType.OBSIDIAN]: 'text-gray-800',
  [ResourceType.IRON]: 'text-orange-400',
  [ResourceType.ESSENCE]: 'text-purple-400',
  [ResourceType.VOID_CRYSTALS]: 'text-pink-500',
  [ResourceType.INFLUENCE]: 'text-yellow-500',
  [ResourceType.DARK_WEAPONS]: 'text-slate-400',
  [ResourceType.DARK_ARMOR]: 'text-slate-500',
  [ResourceType.SLAVES]: 'text-green-200',
  [ResourceType.REFINED_OBSIDIAN]: 'text-purple-800',
  [ResourceType.CONCENTRATED_ESSENCE]: 'text-pink-300',
  [ResourceType.GOLD]: 'text-yellow-400'
};

export const FACTION_ICONS: Record<string, any> = {
  'GiSwordsEmblem': GiSwordsEmblem,
  'GiLips': GiLips,
  'GiSkullStaff': GiSkullStaff,
  'GiPitchfork': GiPitchfork,
  'GiCrossShield': GiCrossShield,
  'GiCoins': GiCoins,
  'GiCrossbow': GiCrossbow
};

export {
  GiDrop, GiGhost, GiBrokenBone, GiCrystalGrowth, GiBloodySword, GiStoneBlock, GiAnvil, GiWizardStaff,
  GiBatWing, GiCastle, GiRadarSweep, GiPerson, GiUpgrade, GiSkullCrossedBones, GiPotionBall, GiAbdominalArmor, GiSwordSmithing,
  GiThorHammer, GiSecretBook, GiShield, GiSpeedometer, GiHealthNormal, GiClover, GiExitDoor,
  GiCrownCoin, GiSwordsEmblem, GiLips, GiSkullStaff, GiPitchfork, GiCrossShield, GiCoins, GiCrossbow,
  GiManacles, GiSpy, GiPresent, GiScrollQuill, GiWalk, GiScrollUnfurled, GiDragonHead, GiPadlock,
  GiPauseButton, GiPlayButton, GiTrashCan, GiRapidshareArrow, GiHood, GiCrownedSkull, GiKing, GiCheckMark,
  GiRunningNinja, GiPartyPopper, GiStoneWall, GiForest, GiVillage, GiSpikedWall, GiMagnifyingGlass
};
