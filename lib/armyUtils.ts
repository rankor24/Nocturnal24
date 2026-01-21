

import { ArmyStack, UNIT_DEFINITIONS, UnitDef, UnitSpecial } from "../types";

export interface StackStats {
  effectiveDamage: number;
  effectiveHp: number;
  effectiveSpeed: number;
  defense: number;
  activeSynergies: string[];
}

/**
 * Calculates the power and effective stats of a stack,
 * considering diminishing returns for large swarms and synergies.
 */
export const calculateStackStats = (stack: ArmyStack, allStacks: ArmyStack[]): StackStats => {
  const def = UNIT_DEFINITIONS[stack.defId];
  if (!def) return { effectiveDamage: 0, effectiveHp: 0, effectiveSpeed: 0, defense: 0, activeSynergies: [] };

  const activeSynergies: string[] = [];
  let damageMod = 1.0;
  let defenseMod = 1.0;
  let speedMod = 1.0;
  let effectiveHpMod = 1.0;

  // --- SPECIAL ABILITIES ---
  if (def.special === UnitSpecial.EVASION) {
      // Evasion acts as a multiplier to Effective HP (dodge 33% = 1.5x EHP approx)
      effectiveHpMod += 0.5;
      activeSynergies.push("Evasion (50%)");
  }
  
  if (def.special === UnitSpecial.FLYING) {
      // Flying units are hard to hit and fast
      effectiveHpMod += 0.2;
      speedMod += 0.2;
      activeSynergies.push("Flying");
  }
  
  if (def.special === UnitSpecial.REGENERATION) {
      // Regeneration implies staying power
      effectiveHpMod += 0.3;
      activeSynergies.push("Regen");
  }

  if (def.special === UnitSpecial.LIFESTEAL) {
      // Lifesteal implies sustainability
      effectiveHpMod += 0.4;
      activeSynergies.push("Lifesteal");
  }

  if (def.special === UnitSpecial.LAST_STAND || def.special === UnitSpecial.SURVIVOR) {
      // Massive boost to defensive rating to simulate unit refusal to die
      defenseMod += 2.0; 
      activeSynergies.push(def.special === UnitSpecial.SURVIVOR ? "Undying" : "Last Stand");
  }

  if (def.special === UnitSpecial.LEADER) {
      damageMod += 1.0; // Heroes hit hard
      effectiveHpMod += 2.0;
      activeSynergies.push("Dark Lord");
  }

  // --- SYNERGY CHECKS ---
  
  // 1. Bone Shield: Skeletons protect Dragons/Liches
  if (def.id.includes('dragon') || def.id.includes('lich')) {
    const hasSkeletons = allStacks.some(s => s.defId.includes('skeleton') && s.count > 50);
    if (hasSkeletons) {
      defenseMod += 0.3; // +30% Defense
      activeSynergies.push("Bone Shield");
    }
  }

  // 2. Necrotic Frenzy: Liches enrage Zombies/Ghouls
  if (def.id.includes('zombie') || def.id.includes('hulk')) {
    const hasLiches = allStacks.some(s => s.defId.includes('lich') && s.count > 0);
    if (hasLiches) {
      speedMod += 0.2;
      damageMod += 0.20;
      activeSynergies.push("Necrotic Frenzy");
    }
  }

  // 3. Night Cover: Spectres/Bats distract for Vampires
  if (def.id.includes('knight') || def.id.includes('lord')) {
    const hasCover = allStacks.some(s => (s.defId === 'bat_swarm' || s.defId === 'spectre' || s.defId === 'banshee') && s.count > 10);
    if (hasCover) {
        defenseMod += 0.20;
        activeSynergies.push("Night Cover");
    }
  }
  
  // 4. Hero Buff (Leader)
  const hasHero = allStacks.some(s => UNIT_DEFINITIONS[s.defId].special === UnitSpecial.LEADER);
  if (hasHero && def.special !== UnitSpecial.LEADER) {
      damageMod += 0.15;
      defenseMod += 0.15;
      activeSynergies.push("Lord's Command");
  }

  // --- DIMINISHING RETURNS (The "HoMM Swarm Penalty") ---
  // If stack > 1000, efficiency drops. 
  // Formula: First 1000 count normally. Excess counts as (Excess ^ 0.8).
  let effectiveCountForDamage = stack.count;
  const SWARM_CAP = 1000;
  
  if (stack.count > SWARM_CAP) {
    const excess = stack.count - SWARM_CAP;
    effectiveCountForDamage = SWARM_CAP + Math.pow(excess, 0.8);
  }

  // --- FINAL CALCULATIONS ---

  // Damage
  const effectiveDamage = def.baseStats.damage * effectiveCountForDamage * damageMod;

  // HP
  // Total pool calculation with modifiers
  const effectiveHp = stack.totalHp * effectiveHpMod; 

  // Speed
  const effectiveSpeed = def.baseStats.speed * speedMod;

  // Defense
  const totalDefense = def.baseStats.defense * defenseMod;

  return {
    effectiveDamage,
    effectiveHp,
    effectiveSpeed,
    defense: totalDefense,
    activeSynergies
  };
};

/**
 * Calculates total army power for quick battle resolution.
 * Normalized to approximate "combat value".
 */
export const calculateArmyPower = (army: ArmyStack[]): number => {
    return Math.floor(army.reduce((total, stack) => {
        const stats = calculateStackStats(stack, army);
        // Heuristic power formula
        // DPS + (EHP / 10 * DefenseFactor)
        const defenseFactor = 1 + (stats.defense / 20); // 20 def = 2x durability
        const stackPower = (stats.effectiveDamage * 1.5) + ((stats.effectiveHp / 5) * defenseFactor);
        return total + stackPower;
    }, 0));
};

export const getStackHealthPercentage = (stack: ArmyStack): number => {
    const def = UNIT_DEFINITIONS[stack.defId];
    if (!def) return 0;
    const maxHp = def.baseStats.hp * stack.count;
    if (maxHp === 0) return 0;
    return Math.min(100, (stack.totalHp / maxHp) * 100);
};