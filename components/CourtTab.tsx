
import React, { useState } from 'react';
import { useFactionStore } from '../store/factionStore';
import { useTerritoryStore } from '../store/territoryStore';
import { useGameStore } from '../store/gameStore';
import { Faction, FactionId, IntrigueType, Territory, TerritoryAction, TerritoryTier, FACTION_COLORS, TECH_DEFINITIONS, FactionType, FactionStatus, ResourceType } from '../types';
import { generateDiplomacyFlavor } from '../services/geminiService';
import { FACTION_ICONS, GiBatWing, GiSwordsEmblem, GiManacles, GiSpy, GiPresent, GiCastle, GiScrollQuill, GiWalk, GiPadlock } from '../lib/icons';

interface CourtTabProps {
    notify: (msg: string) => void;
}

export const CourtTab = ({ notify }: CourtTabProps) => {
    const factionStore = useFactionStore();
    const territoryStore = useTerritoryStore();
    const { playerLevel, researchedTechs, resources } = useGameStore();
    
    const [expandedFactionId, setExpandedFactionId] = useState<FactionId | null>(null);
    const [expandedTerritoryId, setExpandedTerritoryId] = useState<string | null>(null);

    const handleIntrigue = async (factionId: FactionId, action: IntrigueType) => {
        const f = factionStore.factions[factionId];
        const res = factionStore.performIntrigue(factionId, action);
        
        notify(res.message);
        
        if (res.success) {
            generateDiplomacyFlavor(f.name, action, "Success").then(txt => {
                if (txt) notify(txt);
            });
        }
    };

    const handleTerritoryAction = (id: string, action: TerritoryAction) => {
        const res = territoryStore.performTerritoryAction(id, action);
        notify(res.message);
    };

    const factions = (Object.values(factionStore.factions) as Faction[]).filter(f => f.id !== FactionId.PLAYER);

    // Helpers to check research
    const isUnlocked = (type: IntrigueType) => {
        if (type === IntrigueType.BRIBE) return researchedTechs.includes('coin_of_judas');
        if (type === IntrigueType.SEDUCE) return researchedTechs.includes('pheromone_alchemy');
        if (type === IntrigueType.DEMAND) return researchedTechs.includes('imperial_mandate');
        
        // Vampire Techs
        if (type === IntrigueType.SELL_SLAVES || type === IntrigueType.GIFT_SLAVES) return researchedTechs.includes('thrall_trade');
        if (type === IntrigueType.ALLIANCE) return researchedTechs.includes('blood_pact');
        if (type === IntrigueType.MARRIAGE) return researchedTechs.includes('dynastic_marriage');
        if (type === IntrigueType.CONFEDERATE) return researchedTechs.includes('dark_confederation');

        return true; 
    };

    // Helper to check cost
    const canAffordIntrigue = (faction: Faction, type: IntrigueType) => {
        const res = resources;
        if (type === IntrigueType.BRIBE) {
            if (faction.type === FactionType.HUMAN_ORG) {
                return (res[ResourceType.GOLD] || 0) >= 100 + (playerLevel * 20);
            } else {
                return (res[ResourceType.BLOOD] || 0) >= 200 + (playerLevel * 50);
            }
        }
        if (type === IntrigueType.SEDUCE) return (res[ResourceType.INFLUENCE] || 0) >= 100;
        if (type === IntrigueType.DEMAND) return (res[ResourceType.INFLUENCE] || 0) >= 100;
        if (type === IntrigueType.GIFT_SLAVES) return (res[ResourceType.SLAVES] || 0) >= 50;
        if (type === IntrigueType.SELL_SLAVES) return (res[ResourceType.SLAVES] || 0) >= 50;
        if (type === IntrigueType.ALLIANCE) return (res[ResourceType.INFLUENCE] || 0) >= 1000;
        if (type === IntrigueType.MARRIAGE) return (res[ResourceType.INFLUENCE] || 0) >= 5000 && (res[ResourceType.ESSENCE] || 0) >= 500;
        if (type === IntrigueType.CONFEDERATE) return (res[ResourceType.INFLUENCE] || 0) >= 20000 && (res[ResourceType.VOID_CRYSTALS] || 0) >= 100;
        return true;
    };

    return (
        <div className="h-full flex flex-col p-4 bg-black">
           <h2 className="font-gothic text-2xl text-red-500 text-center mb-4 flex-none border-b border-red-900/30 pb-2">The Night Court</h2>
           
           <div className="flex-1 overflow-y-auto space-y-4 pb-20">
               {factions.map((faction) => {
                   const factionTerritories = territoryStore.territories.filter(t => t.defendingFaction === faction.id);
                   const isExpanded = expandedFactionId === faction.id;
                   const Icon = FACTION_ICONS[faction.avatarIcon] || GiBatWing;
                   const isHostile = faction.relation < -20;
                   const isAlly = faction.relation > 50;
                   const isVampire = faction.type === FactionType.VAMPIRE_HOUSE;

                   return (
                       <div 
                           key={faction.id}
                           className={`bg-void-900 border rounded-lg overflow-hidden transition-all duration-300 ${
                               isExpanded ? 'border-red-500 bg-void-950' : 'border-void-700 hover:border-gray-600'
                           }`}
                       >
                          {/* FACTION HEADER */}
                          <div 
                               onClick={() => setExpandedFactionId(isExpanded ? null : faction.id)}
                               className="p-4 flex items-center gap-4 cursor-pointer relative"
                          >
                                <div className={`absolute inset-0 opacity-5 ${
                                    isHostile ? 'bg-red-500' : isAlly ? 'bg-green-500' : 'bg-transparent'
                                }`} />

                                <div className={`text-3xl p-2 rounded-full border bg-black/50 z-10 ${
                                  isHostile ? 'border-red-600 text-red-600' : 
                                  isAlly ? 'border-green-600 text-green-500' : 'border-gray-600 text-gray-400'
                                }`}>
                                    <Icon />
                                </div>
                                
                                <div className="flex-1 z-10">
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className="font-bold text-lg text-gray-200">{faction.name}</h3>
                                        <div className="flex flex-col items-end">
                                            <span className={`font-mono text-sm font-bold ${
                                                faction.relation > 0 ? 'text-green-500' : faction.relation < 0 ? 'text-red-500' : 'text-gray-500'
                                            }`}>
                                                {faction.relation > 0 ? '+' : ''}{faction.relation.toFixed(0)} Rel
                                            </span>
                                            {faction.status !== FactionStatus.NEUTRAL && (
                                                <span className={`text-[10px] font-bold px-1 rounded uppercase ${
                                                    faction.status === FactionStatus.WAR ? 'bg-red-900 text-white' : 
                                                    faction.status === FactionStatus.ALLY ? 'bg-blue-900 text-white' : 
                                                    'bg-purple-900 text-white'
                                                }`}>{faction.status}</span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden mb-2 relative">
                                        <div className="absolute left-1/2 w-[1px] h-full bg-gray-600 z-20" />
                                        <div 
                                            className={`h-full transition-all duration-1000 ${faction.relation > 0 ? 'bg-green-600' : 'bg-red-600'}`}
                                            style={{ 
                                                width: `${Math.abs(faction.relation)}%`,
                                                marginLeft: '50%',
                                                transform: faction.relation < 0 ? 'translateX(-100%)' : 'none'
                                            }}
                                        />
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-2 text-[10px] text-gray-500">
                                            {faction.traits.map(t => <span key={t} className="bg-void-950 px-1.5 py-0.5 rounded border border-void-800">{t}</span>)}
                                        </div>
                                        <div className="text-[10px] text-gray-400">
                                            {factionTerritories.length} Domains Known
                                        </div>
                                    </div>
                                </div>
                          </div>

                          {/* EXPANDED CONTENT */}
                          {isExpanded && (
                              <div className="border-t border-void-800 bg-black/20 animate-in slide-in-from-top-2">
                                  
                                  {/* 1. Global Diplomacy Actions */}
                                  <div className="bg-void-950/80 p-3 border-b border-void-800">
                                      <div className="flex items-center gap-2 mb-2">
                                          <GiScrollQuill className="text-yellow-600" />
                                          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Diplomatic Channels (Global)</h4>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-2">
                                          {/* BRIBE */}
                                          <button 
                                             onClick={(e) => handleIntrigue(faction.id, IntrigueType.BRIBE)}
                                             disabled={!isUnlocked(IntrigueType.BRIBE) || !canAffordIntrigue(faction, IntrigueType.BRIBE)}
                                             className={`bg-void-900 p-2 rounded border border-void-700 text-xs text-left group ${(!isUnlocked(IntrigueType.BRIBE) || !canAffordIntrigue(faction, IntrigueType.BRIBE)) ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500'}`}
                                          >
                                              <div className="font-bold text-blue-400 mb-0.5 group-hover:text-blue-300 flex justify-between">
                                                  Offer Bribe 
                                                  {!isUnlocked(IntrigueType.BRIBE) && <GiPadlock className="text-gray-500"/>}
                                              </div>
                                              <div className="text-[9px] text-gray-400">Lowers Claim Cost</div>
                                              <div className={`text-[9px] font-mono mt-1 ${!canAffordIntrigue(faction, IntrigueType.BRIBE) ? 'text-red-500' : 'text-gray-500'}`}>
                                                  -{faction.type === FactionType.HUMAN_ORG ? (100 + playerLevel*20) + ' Gold' : (200 + playerLevel*50) + ' Blood'}
                                              </div>
                                          </button>

                                          {/* SEDUCE */}
                                          <button 
                                             onClick={(e) => handleIntrigue(faction.id, IntrigueType.SEDUCE)}
                                             disabled={!isUnlocked(IntrigueType.SEDUCE) || !canAffordIntrigue(faction, IntrigueType.SEDUCE)}
                                             className={`bg-void-900 p-2 rounded border border-void-700 text-xs text-left group ${(!isUnlocked(IntrigueType.SEDUCE) || !canAffordIntrigue(faction, IntrigueType.SEDUCE)) ? 'opacity-50 cursor-not-allowed' : 'hover:border-pink-500'}`}
                                          >
                                              <div className="font-bold text-pink-400 mb-0.5 group-hover:text-pink-300 flex justify-between">
                                                  Seduce
                                                  {!isUnlocked(IntrigueType.SEDUCE) && <GiPadlock className="text-gray-500"/>}
                                              </div>
                                              <div className="text-[9px] text-gray-400">Improves Relations</div>
                                              <div className={`text-[9px] font-mono mt-1 ${!canAffordIntrigue(faction, IntrigueType.SEDUCE) ? 'text-red-500' : 'text-yellow-500'}`}>-100 Inf</div>
                                          </button>

                                          {/* DEMAND */}
                                          <button 
                                             onClick={(e) => handleIntrigue(faction.id, IntrigueType.DEMAND)}
                                             disabled={!isUnlocked(IntrigueType.DEMAND) || !canAffordIntrigue(faction, IntrigueType.DEMAND)}
                                             className={`bg-void-900 p-2 rounded border border-void-700 text-xs text-left group ${(!isUnlocked(IntrigueType.DEMAND) || !canAffordIntrigue(faction, IntrigueType.DEMAND)) ? 'opacity-50 cursor-not-allowed' : 'hover:border-yellow-500'}`}
                                          >
                                              <div className="font-bold text-yellow-400 mb-0.5 group-hover:text-yellow-300 flex justify-between">
                                                  Demand Tribute
                                                  {!isUnlocked(IntrigueType.DEMAND) && <GiPadlock className="text-gray-500"/>}
                                              </div>
                                              <div className="text-[9px] text-gray-400">Extort Resources</div>
                                              <div className={`text-[9px] font-mono mt-1 ${!canAffordIntrigue(faction, IntrigueType.DEMAND) ? 'text-red-500' : 'text-yellow-500'}`}>-100 Inf</div>
                                          </button>

                                          {/* WAR */}
                                          <button 
                                             onClick={(e) => handleIntrigue(faction.id, IntrigueType.WAR)}
                                             className="bg-void-900 p-2 rounded border border-void-700 hover:border-red-500 text-xs text-left group"
                                          >
                                              <div className="font-bold text-red-500 mb-0.5 group-hover:text-red-400">Total War</div>
                                              <div className="text-[9px] text-gray-400">Claims become 50% more expensive</div>
                                              <div className="text-[9px] text-red-700 font-mono mt-1">Massive Relation Drop</div>
                                          </button>
                                      </div>
                                  </div>

                                  {/* 1.5 VAMPIRE SPECIFIC POLITICS */}
                                  {isVampire && (
                                    <div className="bg-red-950/20 p-3 border-b border-red-900/30">
                                      <div className="flex items-center gap-2 mb-2">
                                          <GiBatWing className="text-red-600" />
                                          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Blood Politics</h4>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                          {/* TRADE SLAVES */}
                                          <button 
                                             onClick={(e) => handleIntrigue(faction.id, IntrigueType.SELL_SLAVES)}
                                             disabled={!isUnlocked(IntrigueType.SELL_SLAVES) || !canAffordIntrigue(faction, IntrigueType.SELL_SLAVES)}
                                             className={`bg-void-900 p-2 rounded border border-void-700 text-xs text-left group ${(!isUnlocked(IntrigueType.SELL_SLAVES) || !canAffordIntrigue(faction, IntrigueType.SELL_SLAVES)) ? 'opacity-50 cursor-not-allowed' : 'hover:border-green-500'}`}
                                          >
                                              <div className="font-bold text-green-400 mb-0.5 group-hover:text-green-300 flex justify-between">
                                                  Sell Thralls
                                                  {!isUnlocked(IntrigueType.SELL_SLAVES) && <GiPadlock className="text-gray-500"/>}
                                              </div>
                                              <div className="text-[9px] text-gray-400">Exchange livestock for wealth</div>
                                              <div className={`text-[9px] font-mono mt-1 ${!canAffordIntrigue(faction, IntrigueType.SELL_SLAVES) ? 'text-red-500' : 'text-green-500'}`}>-50 Thralls</div>
                                          </button>

                                          {/* GIFT SLAVES */}
                                          <button 
                                             onClick={(e) => handleIntrigue(faction.id, IntrigueType.GIFT_SLAVES)}
                                             disabled={!isUnlocked(IntrigueType.GIFT_SLAVES) || !canAffordIntrigue(faction, IntrigueType.GIFT_SLAVES)}
                                             className={`bg-void-900 p-2 rounded border border-void-700 text-xs text-left group ${(!isUnlocked(IntrigueType.GIFT_SLAVES) || !canAffordIntrigue(faction, IntrigueType.GIFT_SLAVES)) ? 'opacity-50 cursor-not-allowed' : 'hover:border-green-500'}`}
                                          >
                                              <div className="font-bold text-gray-300 mb-0.5 group-hover:text-white flex justify-between">
                                                  Gift Thralls
                                                  {!isUnlocked(IntrigueType.GIFT_SLAVES) && <GiPadlock className="text-gray-500"/>}
                                              </div>
                                              <div className="text-[9px] text-gray-400">Improve Relations</div>
                                              <div className={`text-[9px] font-mono mt-1 ${!canAffordIntrigue(faction, IntrigueType.GIFT_SLAVES) ? 'text-red-500' : 'text-gray-500'}`}>-50 Thralls</div>
                                          </button>

                                          {/* ALLIANCE */}
                                          <button 
                                             onClick={(e) => handleIntrigue(faction.id, IntrigueType.ALLIANCE)}
                                             disabled={!isUnlocked(IntrigueType.ALLIANCE) || faction.status === FactionStatus.ALLY || !canAffordIntrigue(faction, IntrigueType.ALLIANCE)}
                                             className={`bg-void-900 p-2 rounded border border-void-700 text-xs text-left group ${(!isUnlocked(IntrigueType.ALLIANCE) || faction.status === FactionStatus.ALLY || !canAffordIntrigue(faction, IntrigueType.ALLIANCE)) ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500'}`}
                                          >
                                              <div className="font-bold text-blue-500 mb-0.5 group-hover:text-blue-400 flex justify-between">
                                                  Blood Pact
                                                  {!isUnlocked(IntrigueType.ALLIANCE) && <GiPadlock className="text-gray-500"/>}
                                              </div>
                                              <div className="text-[9px] text-gray-400">Prevent Relation Decay</div>
                                              <div className={`text-[9px] font-mono mt-1 ${!canAffordIntrigue(faction, IntrigueType.ALLIANCE) ? 'text-red-500' : 'text-yellow-500'}`}>-1000 Inf</div>
                                          </button>

                                          {/* MARRIAGE */}
                                          <button 
                                             onClick={(e) => handleIntrigue(faction.id, IntrigueType.MARRIAGE)}
                                             disabled={!isUnlocked(IntrigueType.MARRIAGE) || !canAffordIntrigue(faction, IntrigueType.MARRIAGE)}
                                             className={`bg-void-900 p-2 rounded border border-void-700 text-xs text-left group ${(!isUnlocked(IntrigueType.MARRIAGE) || !canAffordIntrigue(faction, IntrigueType.MARRIAGE)) ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-500'}`}
                                          >
                                              <div className="font-bold text-purple-400 mb-0.5 group-hover:text-purple-300 flex justify-between">
                                                  Dynastic Marriage
                                                  {!isUnlocked(IntrigueType.MARRIAGE) && <GiPadlock className="text-gray-500"/>}
                                              </div>
                                              <div className="text-[9px] text-gray-400">Gain Vampire Lord Hero</div>
                                              <div className={`text-[9px] font-mono mt-1 ${!canAffordIntrigue(faction, IntrigueType.MARRIAGE) ? 'text-red-500' : 'text-purple-500'}`}>-500 Essence</div>
                                          </button>
                                      </div>
                                      
                                      {/* CONFEDERATION BUTTON (Full Width) */}
                                      <button 
                                         onClick={(e) => handleIntrigue(faction.id, IntrigueType.CONFEDERATE)}
                                         disabled={!isUnlocked(IntrigueType.CONFEDERATE) || !canAffordIntrigue(faction, IntrigueType.CONFEDERATE)}
                                         className={`w-full mt-2 bg-gradient-to-r from-red-950 to-void-950 p-2 rounded border border-red-900 text-xs text-center group ${(!isUnlocked(IntrigueType.CONFEDERATE) || !canAffordIntrigue(faction, IntrigueType.CONFEDERATE)) ? 'opacity-50 cursor-not-allowed' : 'hover:border-red-500 hover:text-white'}`}
                                      >
                                          <div className="font-gothic text-lg text-red-500 mb-0.5 group-hover:text-red-400 flex justify-center items-center gap-2">
                                              <GiCastle /> Dark Confederation
                                          </div>
                                          {!isUnlocked(IntrigueType.CONFEDERATE) ? (
                                              <div className="text-[9px] text-gray-500">Requires Tech: Dark Confederation</div>
                                          ) : (
                                              <>
                                                <div className="text-[9px] text-gray-400">Absorb Faction Territories</div>
                                                <div className={`text-[9px] font-mono ${!canAffordIntrigue(faction, IntrigueType.CONFEDERATE) ? 'text-red-500' : 'text-red-400'}`}>-20k Inf, -100 Void Crystals</div>
                                              </>
                                          )}
                                      </button>
                                    </div>
                                  )}

                                  {/* 2. Territory List */}
                                  <div className="p-3 bg-void-950/30">
                                      <div className="flex items-center gap-2 mb-2">
                                          <GiWalk className="text-gray-500" />
                                          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Local Domains (Specific Targets)</h4>
                                      </div>
                                      
                                      {factionTerritories.length === 0 ? (
                                          <div className="text-xs text-gray-600 italic px-2 pb-2">No domains discovered yet. Scout the map.</div>
                                      ) : (
                                          <div className="space-y-2">
                                              {factionTerritories.map(t => {
                                                  const isTerritoryExpanded = expandedTerritoryId === t.id;
                                                  return (
                                                      <div key={t.id} className="bg-void-900 border border-void-800 rounded ml-1 transition-colors hover:border-void-600">
                                                          {/* Territory Row */}
                                                          <div 
                                                            onClick={() => setExpandedTerritoryId(isTerritoryExpanded ? null : t.id)}
                                                            className="p-2 flex items-center gap-3 cursor-pointer"
                                                          >
                                                              <div className="bg-void-950 p-1.5 rounded border border-void-700">
                                                                  <GiCastle className="text-gray-500 text-sm" />
                                                              </div>
                                                              <div className="flex-1">
                                                                  <div className="flex justify-between items-center">
                                                                      <span className="text-sm font-bold text-gray-300">{t.name}</span>
                                                                      <span className="text-[10px] text-gray-500 border border-void-700 px-1 rounded bg-black">Tier {t.controlTier}</span>
                                                                  </div>
                                                                  {/* Mini Corruption Bar */}
                                                                  <div className="flex items-center gap-2 mt-1">
                                                                      <div className="flex-1 h-1 bg-black rounded-full overflow-hidden border border-void-800">
                                                                          <div 
                                                                            className="h-full bg-red-600" 
                                                                            style={{ width: `${t.corruptionProgress}%` }} 
                                                                          />
                                                                      </div>
                                                                      <span className="text-[9px] text-red-500 font-mono">{t.corruptionProgress.toFixed(0)}% Corr</span>
                                                                  </div>
                                                              </div>
                                                          </div>

                                                          {/* Territory Actions */}
                                                          {isTerritoryExpanded && (
                                                              <div className="p-2 bg-black/40 grid grid-cols-4 gap-1 border-t border-void-800 animate-in slide-in-from-top-1">
                                                                  <button 
                                                                    onClick={() => handleTerritoryAction(t.id, TerritoryAction.RAID)}
                                                                    className="flex flex-col items-center p-1.5 rounded hover:bg-void-800 border border-transparent hover:border-red-900 group"
                                                                  >
                                                                      <GiSwordsEmblem className="text-red-500 mb-1" />
                                                                      <span className="text-[9px] font-bold text-gray-400 group-hover:text-red-400">Raid</span>
                                                                  </button>
                                                                  <button 
                                                                    onClick={() => handleTerritoryAction(t.id, TerritoryAction.ABDUCT)}
                                                                    className="flex flex-col items-center p-1.5 rounded hover:bg-void-800 border border-transparent hover:border-red-900 group"
                                                                  >
                                                                      <GiManacles className="text-red-500 mb-1" />
                                                                      <span className="text-[9px] font-bold text-gray-400 group-hover:text-red-400">Abduct</span>
                                                                  </button>
                                                                  <button 
                                                                    onClick={() => handleTerritoryAction(t.id, TerritoryAction.INFILTRATE)}
                                                                    className="flex flex-col items-center p-1.5 rounded hover:bg-void-800 border border-transparent hover:border-purple-900 group"
                                                                  >
                                                                      <GiSpy className="text-purple-500 mb-1" />
                                                                      <span className="text-[9px] font-bold text-gray-400 group-hover:text-purple-400">Spy</span>
                                                                  </button>
                                                                  <button 
                                                                    onClick={() => handleTerritoryAction(t.id, TerritoryAction.GIFT)}
                                                                    className="flex flex-col items-center p-1.5 rounded hover:bg-void-800 border border-transparent hover:border-blue-900 group"
                                                                  >
                                                                      <GiPresent className="text-blue-500 mb-1" />
                                                                      <span className="text-[9px] font-bold text-gray-400 group-hover:text-blue-400">Gift</span>
                                                                  </button>
                                                              </div>
                                                          )}
                                                      </div>
                                                  )
                                              })}
                                          </div>
                                      )}
                                  </div>
                              </div>
                          )}
                       </div>
                   );
               })}
           </div>
        </div>
    );
};
