<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1rF64GlJoDO-I0duRmXha2v3aR0XNYkpe
```
{
  "game_title": "Vampire Lair Quest",
  "version": "1.0 Prototype Spec",
  "description": "An endless idle strategy/RPG game with vampire theme. Players rise as a vampire lord in a gothic world, corrupting real-world locations via Google Maps. Build lairs, generate resources, form armies of undead stacks (HoMM5-inspired: massive weak swarms or elite few), influence human settlements, engage in faction intrigues, and conquer endlessly. R-rated: Graphic gore, seduction, betrayals. Idle-friendly: Offline progress, short sessions. Core loop: Build -> Resources -> Army -> Fights/Quests -> Rewards -> New Demands -> Expand.",
  "target_platform": "Browser (HTML5/JS), expandable to Android. Use Google Maps JS API for world map.",
  "r_rating_elements": "Blood rituals with sacrifices, cannibalism events (thrall hunger failures), gory executions in faction betrayals, seduction rituals with visceral failures.",
  "core_loop": "Build structures to produce resources -> Use resources to recruit/upgrade army stacks -> Dispatch armies to corrupt/conquer map locations -> Win battles/quests for rewards (new units, buildings, influence) -> Unlock new demands (upkeep, tributes) -> Expand chains to meet demands -> Snowball endlessly.",
  "resources": [
    {
      "tier": 1,
      "name": "Blood",
      "role": "Primary currency, thrall food, basic fuel for everything.",
      "generation": "Passive from farms/thralls, raids.",
      "upkeep": "Thrall hunger drains daily."
    },
    {
      "tier": 1,
      "name": "Souls",
      "role": "Population conversion currency, magic ingredient.",
      "generation": "Raids, conversions, failed seductions.",
      "upkeep": "Faction tribute demands."
    },
    {
      "tier": 2,
      "name": "Bone/Stone",
      "role": "Construction materials for buildings/upgrades.",
      "generation": "Mines, battle dead.",
      "upkeep": "Exponential costs for expansions."
    },
    {
      "tier": 2,
      "name": "Iron/Obsidian",
      "role": "Metals for weapons/armor.",
      "generation": "Forges, mines.",
      "upkeep": "Army equipment maintenance."
    },
    {
      "tier": 3,
      "name": "Essence",
      "role": "Magic for unit upgrades/elites.",
      "generation": "Alchemy, rituals.",
      "upkeep": "Elite unit daily consumption."
    },
    {
      "tier": 3,
      "name": "Void Crystals",
      "role": "Rare magic for advanced evolutions.",
      "generation": "Corruption altars, deep raids.",
      "upkeep": "Late-game faction/war demands."
    },
    {
      "tier": 4,
      "name": "Crafted Items (Armor/Weapons/Poisons/Runes)",
      "role": "Buffs for army stacks.",
      "generation": "Workshops from inputs.",
      "upkeep": "Stack power multipliers."
    }
  ],
  "buildings": [
    {
      "chain": "Basic Survival & Population",
      "name": "Blood Font/Vein Mine",
      "inputs": "Thralls",
      "outputs": "Blood (passive/sec)",
      "upgrades": "Levels increase yield exponentially.",
      "demands": "More crypts for thralls."
    },
    {
      "chain": "Basic Survival & Population",
      "name": "Human Pen/Village Corruptor",
      "inputs": "Blood",
      "outputs": "Captives -> Thralls (conversion time)",
      "upgrades": "Faster conversions, higher capacity.",
      "demands": "Feeding pits upkeep."
    },
    {
      "chain": "Basic Survival & Population",
      "name": "Coffin Crypt",
      "inputs": "Bone/Stone",
      "outputs": "Houses Thralls (boosts Blood gen)",
      "upgrades": "More slots, morale buffs.",
      "demands": "Blood for maintenance."
    },
    {
      "chain": "Basic Survival & Population",
      "name": "Feeding Pit",
      "inputs": "Blood",
      "outputs": "Extra Souls",
      "upgrades": "Efficiency, risk reduction.",
      "demands": "Risk: Overfeed -> Cannibalism event (lose thralls, temp buff)."
    },
    {
      "chain": "Construction Material",
      "name": "Graveyard Excavation",
      "inputs": "Thralls",
      "outputs": "Bone (scales with battle dead)",
      "upgrades": "Auto-harvest multipliers.",
      "demands": "Lair expansions."
    },
    {
      "chain": "Construction Material",
      "name": "Obsidian Quarry",
      "inputs": "Thralls",
      "outputs": "Stone/Obsidian",
      "upgrades": "Yield boosts.",
      "demands": "Building tiers."
    },
    {
      "chain": "Construction Material",
      "name": "Bone Carver Workshop",
      "inputs": "Bone",
      "outputs": "Refined Bone Blocks",
      "upgrades": "Craft speed.",
      "demands": "Advanced structures."
    },
    {
      "chain": "Metal & Weapon",
      "name": "Blood Forge",
      "inputs": "Blood (fuel)",
      "outputs": "Molten Iron",
      "upgrades": "Purity levels.",
      "demands": "Army gear."
    },
    {
      "chain": "Metal & Weapon",
      "name": "Obsidian Smelter",
      "inputs": "Obsidian",
      "outputs": "Refined Ingots",
      "upgrades": "Efficiency.",
      "demands": "Elite weapons."
    },
    {
      "chain": "Metal & Weapon",
      "name": "Necrotic Armory",
      "inputs": "Iron/Obsidian + Blood",
      "outputs": "Necrotic Armor/Weapons",
      "upgrades": "Buff tiers.",
      "demands": "Stack equipping."
    },
    {
      "chain": "Magic & Essence",
      "name": "Blood Altar",
      "inputs": "Blood + Souls",
      "outputs": "Raw Essence",
      "upgrades": "Ritual success rate.",
      "demands": "R-rated sacrifices."
    },
    {
      "chain": "Magic & Essence",
      "name": "Alchemy Wing",
      "inputs": "Essence + Bone",
      "outputs": "Concentrated Essence",
      "upgrades": "Yield multipliers.",
      "demands": "Elite upkeep."
    },
    {
      "chain": "Magic & Essence",
      "name": "Void Rift Chamber",
      "inputs": "High Essence + Souls",
      "outputs": "Void Crystals",
      "upgrades": "Risk reduction.",
      "demands": "Failure -> Hunter raid."
    },
    {
      "chain": "Elite Unit Training",
      "name": "Necromancy Sanctum",
      "inputs": "Bone + Souls",
      "outputs": "Basic Skeletons",
      "upgrades": "Recruit rate.",
      "demands": "Swarm path."
    },
    {
      "chain": "Elite Unit Training",
      "name": "Evolution Crucible",
      "inputs": "Essence + Crafted Items + Souls",
      "outputs": "Upgraded Units (e.g., Skeletons -> Liches)",
      "upgrades": "Evolution trees.",
      "demands": "Quality path."
    },
    {
      "chain": "Faction Tribute & Intrigue",
      "name": "Tribute Vault",
      "inputs": "Excess Resources",
      "outputs": "Stored Tributes",
      "upgrades": "Capacity.",
      "demands": "Faction-specific mixes."
    }
  ],
  "units": [
    {
      "type": "Swarm/Basic",
      "name": "Skeleton Archers",
      "base_stats": {"damage": 1, "hp": 5, "cost": "Low (Bone + Souls)"},
      "scaling": "Quantity: High stacks (20k+), cheap recruits.",
      "synergies": "Fodder shield for elites."
    },
    {
      "type": "Tank",
      "name": "Ghouls/Wolves",
      "base_stats": {"damage": 3, "hp": 20, "cost": "Medium"},
      "scaling": "Balanced stacks, tank melee.",
      "synergies": "Protect ranged/dragons."
    },
    {
      "type": "Support",
      "name": "Bats",
      "base_stats": {"damage": 2, "hp": 10, "cost": "Low"},
      "scaling": "Swarm evasion, debuffs.",
      "synergies": "Counter ranged enemies."
    },
    {
      "type": "Elite/DPS",
      "name": "Vampire Lords/Blood Knights",
      "base_stats": {"damage": 10, "hp": 50, "cost": "High (Essence)"},
      "scaling": "Quality: Few (20-100), lifesteal auras.",
      "synergies": "Buff swarms."
    },
    {
      "type": "Caster/Elite",
      "name": "Liches",
      "base_stats": {"damage": 15, "hp": 30, "cost": "High (Void Crystals)"},
      "scaling": "Magic nukes, evolutions.",
      "synergies": "Area debuffs."
    },
    {
      "type": "God-Tier",
      "name": "Elder Dragons/Ancient Wyrms",
      "base_stats": {"damage": 50, "hp": 200, "cost": "Extreme (All resources)"},
      "scaling": "Quality: Very few (20 max), fear auras.",
      "synergies": "Dominate battles, high upkeep."
    }
  ],
  "army_system": {
    "stacks": "7 slots per army. Each stack: Single 2D sprite + unit count overlay + total HP bar.",
    "mechanics": "Strength = (base_damage * stack_size) * (1 + upgrades/synergies). Quantity path: Diminishing returns on huge stacks (^0.8). Quality: Raw power + auras.",
    "dispatch": "Move along Google Maps roads, time-based travel.",
    "synergies_examples": "Skeletons protect dragons from ranged; Bats + Knights = lifesteal."
  },
  "factions": {
    "vampire": [
      {
        "name": "House Dracul",
        "traits": "Aggressive warriors, +IP on military settlements.",
        "intrigues": "Wars for territory."
      },
      {
        "name": "House Lilitu",
        "traits": "Seductive schemers, double seduction speed.",
        "intrigues": "Betrayals, jealousy events."
      },
      {
        "name": "House Necros",
        "traits": "Magic focus, Void Crystal trades.",
        "intrigues": "Ritual alliances."
      },
      {
        "name": "4-7 Total Houses",
        "mechanics": "Relations: -100 to +100. Dailies: Tributes or wars. No prestige resetsâ€”endless diplomacy."
      }
    ],
    "human": [
      {
        "name": "Peasant Villages",
        "power": "Weak",
        "threats": "Passive, easy Souls.",
        "value": "Quick corruption."
      },
      {
        "name": "Merchant Guilds",
        "power": "Medium",
        "threats": "Trade disruptions.",
        "value": "Resource imports."
      },
      {
        "name": "Noble Houses",
        "power": "Medium",
        "threats": "Militia stacks.",
        "value": "Thrall conversions."
      },
      {
        "name": "Military Orders",
        "power": "Strong",
        "threats": "Knight armies.",
        "value": "Elite loot."
      },
      {
        "name": "Church Inquisitors",
        "power": "Very Strong",
        "threats": "Purge corruption.",
        "value": "Essence relics."
      },
      {
        "name": "Vampire Hunters",
        "power": "God-Tier",
        "threats": "Scaling legions, detection.",
        "value": "Void Crystals from victories."
      },
      {
        "dynamics": "Ally against vampires; unite on high corruption."
      }
    ]
  },
  "influence_system": {
    "points": "IP from Blood/Essence + favor. Auto-spread offline.",
    "tiers": [
      {"tier": "Shadow", "req": "100 IP", "benefits": "+10% Souls", "risks": "Minor rebellions"},
      {"tier": "Puppet", "req": "500 IP +1 day", "benefits": "Resource trickle", "risks": "Suspicion decay"},
      {"tier": "Corrupted", "req": "2k IP + rituals", "benefits": "Satellite buildings", "risks": "Hunter alerts"},
      {"tier": "Vampiric Hold", "req": "10k IP + win", "benefits": "Massive yields + recruits", "risks": "Total war"}
    ],
    "events": "Whispers, Curses, Infiltrators. Failures: Backlash raids."
  },
  "map_system": {
    "integration": "Google Maps JS API: Satellite/hybrid view, markers for lairs/territories.",
    "scope": "Start Riga (player lair). Procedural nodes: Villages (easy), Cities (e.g., Paris=high yield).",
    "overlays": "Darken for corruption, paths for army marches.",
    "events": "Blood Moon globals (+prod).",
    "scaling": "Local -> Europe -> Global. Clustered markers."
  },
  "battle_system": {
    "inspiration": "Simplified HoMM5 x Home Quest: Auto-resolve, progress bar.",
    "resolution": "Aggregate stack stats vs enemy. Tactics pre-fight (Aggro/Defend/Flank +20% mods).",
    "outcomes": "Win: Loot + control. Loss: Stack reductions.",
    "visuals": "Off-map modal: Sprites + counts + HP bars."
  },
  "quests": {
    "early": "Story-driven: Corrupt king, seduce noble (map pins).",
    "late": "Endless dailies: Suppress uprising, satisfy demands.",
    "mechanics": "Auto-complete partial offline, rewards scale with power."
  },
  "progression": {
    "idle": "Offline: 24-48h cap, blood farming + auto-raids/spread.",
    "curves": "Exponential: Day1=Basic army; Week1=Districts; Month1=Endless wars.",
    "endless": "Scaling hunters, multi-faction crises, no hard caps."
  },
  "technical_notes": {
    "engine": "Phaser.js for battles/overlays, IndexedDB saves.",
    "api": "Google Maps: Markers, Polygons, DirectionsService. Cache for perf.",
    "monetization": "Optional: IAP for teleports/boosters."
  }
}
```


**Team Stand-up: Vampire Lair Quest – Modular Prompt Library for Google AI Studio**  
**Date:** January 16, 2026 | **Location:** Virtual Crypt Conference, Riga time  


### 1. Resource Management System

```text
Create a complete TypeScript module for resource management in an idle vampire strategy game called "Vampire Lair Quest".

Requirements:
- Use modern TypeScript (latest features)
- Implement with Zustand for global state management
- Resources: Blood, Souls, Bone/Stone, Iron/Obsidian, Essence, Void Crystals, Crafted Items (as grouped category)
- Each resource has: current amount (number), per-second production (number), lastUpdate timestamp (for offline calculation)
- Implement offline progress calculation: when app loads/comes to foreground → calculate delta time → add production * time * multipliers
- Include basic production modifiers (global multiplier, night bonus, corruption bonus)
- Provide typed actions: addResource(resourceName, amount), upgradeProduction(resourceName, multiplier)
- Handle decimal precision (use toFixed(2) for display only, keep full precision internally)
- Export: useResourcesStore hook + typed resource interface + production calculation function
- Include comments explaining offline math
```

### 2. Buildings & Production Chains System

```text
Generate TypeScript code for the buildings and production chain system in an idle vampire-themed strategy game "Vampire Lair Quest".

Requirements:
- Define building types as union type or enum + interface
- Each building has: id, name, chain (string), level (1+), baseCost (formula: level * base), currentCost, productionFormula, inputs[], outputs[]
- Implement building upgrade logic with exponential cost scaling
- Handle dependencies between buildings (some buildings require others to be built first)
- Calculate total production per second across all buildings considering levels, thralls assigned, global modifiers
- Support offline production calculation based on total p/s
- Provide typed store/actions using Zustand: buildNew(buildingId), upgrade(buildingId), assignThralls(buildingId, count)
- Include error handling for insufficient resources
- Export: building definitions array/object, useBuildingsStore hook
```

### 3. Army Stacks & Unit System

```text
Create TypeScript implementation for army stack system inspired by simplified Heroes of Might & Magic V for game "Vampire Lair Quest".

Key requirements:
- Army = up to 7 stacks
- Each stack = { unitType: string, count: number, currentHp: number, upgrades: string[], equippedItems: string[] }
- Unit types: Skeleton Archers, Ghouls, Bats, Vampire Lords, Liches, Elder Dragons (with base stats: damage, hpPerUnit, speed, special)
- Stack total stats: totalDamage = baseDamage * count * (1 + upgradeBonus + itemBonus), totalHp = hpPerUnit * count * modifiers
- Implement quantity vs quality balance: large stacks get diminishing returns (damage multiplier ^0.8 for count > 1000)
- Synergy system: certain unit combinations give bonus auras (e.g. skeletons + dragons = +15% dragon damage)
- Typed interfaces and enums
- Zustand store with actions: recruit(unitType, count), mergeStacks, equipItem(stackIndex, itemId), calculateArmyStrength()
- Include comments explaining power scaling math
```

### 4. Google Maps Integration & Territory System

```text
Write TypeScript code module for Google Maps integration and territory influence system in browser-based idle vampire strategy game "Vampire Lair Quest".

Requirements:
- Use @react-google-maps/api library
- Create MapView component showing Google Maps (satellite/hybrid mode)
- Player starts with marker in Riga, Latvia
- Territories = array of { id: string, name: string, latLng: {lat:number,lng:number}, controlTier: 0-4, defendingFaction: string, corruptionProgress: number }
- Display custom markers/icons for player holdings (red pulsing), corrupted settlements (dark overlay), hunter hotspots (gold)
- Implement influence system: Influence Points (IP) generation, spending IP to increase control tier on selected territory
- Auto-spread influence offline (percentage per hour based on adjacent holdings)
- Show corruption overlay polygons that darken with progress
- Handle map zoom clustering for many territories
- Export: MapView component, useTerritoriesStore (Zustand), influence calculation functions
```

### 5. Battle Resolution System

```text
Implement simplified auto-battle resolution system in TypeScript for vampire strategy idle game "Vampire Lair Quest" (Home Quest style auto-combat with HoMM5 stack inspiration).

Requirements:
- Battle = attacker army (7 stacks) vs defender army (enemy stacks)
- Each side calculates total damage output and total HP
- Simulate in phases (3-5 turns) or simple single-round resolution
- Apply rock-paper-scissors advantages: bats evade ranged, wolves tank melee, etc.
- Pre-battle tactics choice: Aggressive (+damage -defense), Defensive (+defense -damage), Flank (+synergy)
- Outcome: win/loss/draw, calculate casualties (reduce stack counts proportionally)
- Rewards on win: souls, essence, crafted items, territory control progress
- Use deterministic math + small random variance (Math.random() * 0.2)
- Export: battleSimulation(attacker: Army, defender: Army, tactics: string) => { winner: 'player'|'enemy'|'draw', report: string[], rewards: ResourceDelta }
```

### 6. Vampire & Human Faction Diplomacy/Intrigue System

```text
Create TypeScript module for vampire houses and human factions diplomacy/intrigue system in idle strategy game "Vampire Lair Quest".

Requirements:
- Vampire factions: House Dracul, House Lilitu, House Necros + 2-4 more (relations -100..+100)
- Human factions: Peasant Villages, Merchants, Nobles, Military Orders, Church, Hunters
- Relations decay over time, modified by actions (tributes paid, seductions, wars won/lost)
- Intrigue actions: spend IP/resources to improve relations, betray, demand tribute, start war
- Daily procedural events based on relation levels (e.g. "Jealousy Purge" on high Lilitu relation)
- Typed store with Zustand: useFactionsStore, actions: improveRelation(houseId, amount), triggerIntrigue(actionType, targetId)
- Include simple text event generator for flavor (R-rated tone when appropriate)
```

### 7. Player Progression & Offline System

```text
Implement core player progression and offline calculation system in TypeScript for idle vampire game "Vampire Lair Quest".

Requirements:
- Save/load player state using Firebase Firestore (player document)
- Track lastActive timestamp
- On app load: calculate offline time (max 48 hours), apply offline production for all resources
- Apply offline influence spread, faction relation decay, auto-raid attempts (simple success chance)
- Progression milestones: unlock new building chains, army slots, map regions based on total power/corruption level
- Prestige-like "Ascension" events (optional later layers)
- Handle first-time player onboarding (starting resources, Riga lair)
- Export: useProgressionStore, calculateOfflineProgress() function, milestone checker
```

