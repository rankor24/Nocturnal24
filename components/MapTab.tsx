
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useTerritoryStore } from '../store/territoryStore';
import { ScoutResult, ActiveBuilding, BUILDING_DEFINITIONS, UNIT_DEFINITIONS, FactionId, ResourceType, BuildingPlacement } from '../types';
import { scoutArea, corruptLocationNarrative } from '../services/geminiService';
import { WorldMap } from './WorldMap';
import { getDistMeters } from '../lib/geoUtils';
import { GiRadarSweep, GiThorHammer, GiSkullCrossedBones, GiPauseButton, GiPlayButton, GiTrashCan, GiRapidshareArrow, GiPadlock, GiCheckMark, GiCastle } from '../lib/icons';

interface MapTabProps {
    notify: (msg: string) => void;
    setActiveTab: (tab: string) => void;
}

// Order for categories
const CATEGORY_ORDER = ['Citadel', 'Survival', 'Construction', 'Metal', 'Military', 'Magic', 'Elite', 'Parasitic', 'Symbiotic'];

const CATEGORIES = Array.from(new Set(Object.values(BUILDING_DEFINITIONS).map(b => b.chain))).sort((a, b) => {
    const idxA = CATEGORY_ORDER.indexOf(a);
    const idxB = CATEGORY_ORDER.indexOf(b);
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
});

export const MapTab = ({ notify, setActiveTab }: MapTabProps) => {
    const gameState = useGameStore();
    const territoryStore = useTerritoryStore();
    
    // Local State specific to Map interactions
    const [isScouting, setIsScouting] = useState(false);
    const [selectedScout, setSelectedScout] = useState<ScoutResult | null>(null);
    const [selectedBuilding, setSelectedBuilding] = useState<ActiveBuilding | null>(null);
    const [corruptingId, setCorruptingId] = useState<string | null>(null);
    
    const [isBuildMenuOpen, setIsBuildMenuOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('Citadel');
    const [expandedDefId, setExpandedDefId] = useState<string | null>(null);
    const [manualBuildDefId, setManualBuildDefId] = useState<string | null>(null);
    const [movingBuilding, setMovingBuilding] = useState<ActiveBuilding | null>(null);

    // Auto-enter placement mode if no buildings
    useEffect(() => {
        if (gameState.buildings.length === 0 && !manualBuildDefId) {
            setManualBuildDefId('dark_citadel');
            notify("Select a location to establish your Dark Citadel.");
        }
    }, [gameState.buildings.length]);

    // Keep selected building fresh from store
    useEffect(() => {
        if (selectedBuilding) {
            const updated = gameState.buildings.find(b => b.uid === selectedBuilding.uid);
            if (updated) setSelectedBuilding(updated);
            else setSelectedBuilding(null); // It was destroyed
        }
    }, [gameState.buildings, selectedBuilding]);

    const handleScout = () => {
        if (manualBuildDefId || movingBuilding) return; // Block if in placement mode

        if (!navigator.geolocation) return notify("GPS Required");
        setIsScouting(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            gameState.setLocation(pos.coords.latitude, pos.coords.longitude);
            const res = await scoutArea(pos.coords.latitude, pos.coords.longitude);
            
            gameState.addScoutResults(res);
            // Auto-add to territory map
            res.forEach(s => territoryStore.addTerritoryFromScout(s));

            setIsScouting(false);
            if (res.length === 0) notify("Nothing found in the mist.");
            else notify(`Discovered ${res.length} potential targets.`);
        }, () => {
            setIsScouting(false);
            notify("GPS Access Denied");
        });
    };

    const handleCorrupt = async () => {
        if (!selectedScout) return;
        
        setCorruptingId(selectedScout.id);
        const narrative = await corruptLocationNarrative(selectedScout.name, BUILDING_DEFINITIONS[selectedScout.suggestedBuildingId].name);
        
        // Simulate Ritual Delay
        setTimeout(() => {
            const result = gameState.constructBuilding(selectedScout);
            if (result.success) {
                notify(narrative);
                territoryStore.claimTerritory(selectedScout.id);
                setSelectedScout(null);
            } else {
                notify(result.message);
            }
            setCorruptingId(null);
        }, 2000);
    };

    const handleManualBuildSelect = (defId: string) => {
        setManualBuildDefId(defId);
        setIsBuildMenuOpen(false);
        setExpandedDefId(null);
        notify(`Select a location to build ${BUILDING_DEFINITIONS[defId].name}`);
    }

    const handleBuildingControl = (action: 'PAUSE' | 'DESTROY' | 'MOVE') => {
        if (!selectedBuilding) return;
        
        if (action === 'PAUSE') {
            const res = gameState.togglePauseBuilding(selectedBuilding.uid);
            notify(res.message);
        } else if (action === 'DESTROY') {
            if (confirm("Destroy this lair? This cannot be undone.")) {
                const res = gameState.destroyBuilding(selectedBuilding.uid);
                notify(res.message);
                setSelectedBuilding(null);
            }
        } else if (action === 'MOVE') {
            if ((gameState.resources[ResourceType.BLOOD] || 0) < 100) {
                notify("Need 100 Blood to relocate.");
                return;
            }
            setMovingBuilding(selectedBuilding);
            setSelectedBuilding(null); // Close drawer to show map
            notify("Tap a new location to relocate.");
        }
    }

    const handleMapClick = (lat: number, lng: number) => {
        // --- MOVING BUILDING LOGIC ---
        if (movingBuilding) {
             const result = gameState.moveBuilding(movingBuilding.uid, lat, lng);
             if (result.success) {
                 notify(result.message);
                 setMovingBuilding(null);
                 // Reselect it
                 const updated = gameState.buildings.find(b => b.uid === movingBuilding.uid);
                 if (updated) setSelectedBuilding(updated);
             } else {
                 notify(result.message);
             }
             return;
        }

        // --- NEW CONSTRUCTION LOGIC ---
        if (manualBuildDefId) {
             // Range check: Must be within dominion (unless it's the first building)
            const currentBuildings = useGameStore.getState().buildings;
            const isFirst = currentBuildings.length === 0;
            const def = BUILDING_DEFINITIONS[manualBuildDefId];

            if (!isFirst) {
                // If Placement is ENEMY, must NOT be on player land
                if (def.placement === BuildingPlacement.ENEMY) {
                    const onPlayerLand = territoryStore.territories.some(t => 
                        t.defendingFaction === FactionId.PLAYER && 
                        getDistMeters(lat, lng, t.lat, t.lng) <= t.radius
                    );
                    if (onPlayerLand) {
                        notify("Must be built on FOREIGN soil (outside your borders).");
                        return;
                    }
                } else {
                    // Normal building: Must be on player land
                    const onPlayerLand = territoryStore.territories.some(t => 
                        t.defendingFaction === FactionId.PLAYER && 
                        getDistMeters(lat, lng, t.lat, t.lng) <= t.radius
                     );
        
                     if (!onPlayerLand) {
                         notify("You must build within your Dominion (Red Circles).");
                         return;
                     }
                }
             }

            const name = isFirst ? "Dark Citadel" : `${def.name} Outpost`;

            const result = gameState.constructManualBuilding(
                manualBuildDefId, 
                lat, 
                lng, 
                name
            );
            
            if (result.success) {
                notify(result.message);
                setManualBuildDefId(null);
                
                // Init world if first building
                if (isFirst) { 
                    useTerritoryStore.getState().initializeWorld(lat, lng);
                    notify("The world reacts to your presence. Rivals have been spotted.");
                    setActiveTab('LAIR');
                }
            } else {
                notify(result.message);
            }
        }
    }

    // Handlers passed to WorldMap to trigger local state changes
    const onSelectScoutCallback = (s: ScoutResult) => {
        if (movingBuilding) return;
        setSelectedScout(s);
    }
    const onSelectBuildingCallback = (b: ActiveBuilding) => {
        if (movingBuilding) return;
        setSelectedBuilding(b);
    }

    const handleManageLair = () => {
        setActiveTab('LAIR');
        setSelectedBuilding(null);
    };

    // Center map logic: Prioritize Dark Citadel if built
    const citadel = gameState.buildings.find(b => b.defId === 'dark_citadel');
    const mapCenterLat = citadel ? citadel.lat : gameState.location?.lat;
    const mapCenterLng = citadel ? citadel.lng : gameState.location?.lng;

    return (
        <div className="h-full w-full relative">
            {gameState.location && mapCenterLat !== undefined && mapCenterLng !== undefined ? (
               <WorldMap 
                 lat={mapCenterLat} 
                 lng={mapCenterLng} 
                 scoutResults={gameState.scoutResults} 
                 buildings={gameState.buildings} 
                 onSelectScout={onSelectScoutCallback}
                 onSelectBuilding={onSelectBuildingCallback}
                 isScouting={isScouting} 
                 onScout={handleScout} 
                 isPlacementMode={!!manualBuildDefId || !!movingBuilding}
                 onMapClick={handleMapClick}
                 notify={notify}
               />
            ) : (
               <div className="flex flex-col items-center justify-center h-full text-center px-4">
                 <GiRadarSweep className="text-6xl text-void-700 mb-4 animate-pulse" />
                 <p className="text-gray-500 mb-6 font-gothic text-xl">The world is shrouded in mist.</p>
                 <button onClick={handleScout} className="bg-red-900 text-white px-8 py-3 rounded-lg font-gothic tracking-widest hover:bg-red-800 transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] border border-red-700">
                   INITIALIZE DARKNESS
                 </button>
               </div>
            )}

            {/* Manual Build Button (Only show if not already placing) */}
            {gameState.location && !manualBuildDefId && !movingBuilding && (
                <button 
                  onClick={() => setIsBuildMenuOpen(true)}
                  className="absolute bottom-8 right-24 z-[401] w-14 h-14 rounded-full bg-void-800 border-2 border-void-600 flex items-center justify-center shadow-lg active:scale-95 hover:bg-void-700 transition-colors"
                >
                    <GiThorHammer className="text-2xl text-gray-300" />
                </button>
            )}

             {/* Cancel Placement/Move Button */}
             {(manualBuildDefId || movingBuilding) && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[401] w-full max-w-sm px-4">
                    <div className="bg-black/80 backdrop-blur-md p-3 rounded-lg border border-red-900 text-center mb-4 shadow-xl">
                        <div className="text-red-500 font-gothic text-lg mb-1 animate-pulse">
                            {movingBuilding ? "RELOCATING LAIR" : "SELECT CONSTRUCTION SITE"}
                        </div>
                        <div className="text-gray-400 text-xs">
                            {movingBuilding 
                                ? "Tap anywhere to move structure. Cost: 100 Blood." 
                                : BUILDING_DEFINITIONS[manualBuildDefId!]?.placement === BuildingPlacement.ENEMY
                                    ? "Tap on FOREIGN LAND to corrupt."
                                    : "Tap within DOMINION to build."
                            }
                        </div>
                    </div>
                    <button 
                      onClick={() => { setManualBuildDefId(null); setMovingBuilding(null); }}
                      className="w-full bg-void-900/90 text-white px-6 py-2 rounded-full shadow-lg border border-red-500 font-bold"
                    >
                        CANCEL
                    </button>
                </div>
            )}

            {/* Build Menu Drawer */}
            {isBuildMenuOpen && (
                 <div className="absolute inset-0 bg-black/80 z-[500] backdrop-blur-sm flex items-end">
                    <div className="bg-void-900 w-full h-[90%] rounded-t-2xl border-t border-void-700 flex flex-col animate-[slideUp_0.3s_ease-out] shadow-2xl">
                         {/* Drawer Header */}
                         <div className="p-4 border-b border-void-800 flex justify-between items-center bg-black/40 flex-none">
                            <div>
                                <h2 className="font-gothic text-2xl text-red-500 tracking-wider">Construct Lair</h2>
                                <p className="text-xs text-gray-400">Expand your dominion</p>
                            </div>
                            <button onClick={() => setIsBuildMenuOpen(false)} className="text-gray-500 hover:text-white text-2xl p-2 rounded hover:bg-void-800 transition-colors">✕</button>
                         </div>
                         
                         {/* CATEGORY TABS - Horizontal Scroll */}
                         <div className="flex-none pt-3 px-3 border-b border-void-800 bg-black/20">
                             <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
                                 {CATEGORIES.map(cat => (
                                     <button
                                        key={cat}
                                        onClick={() => { setActiveCategory(cat); setExpandedDefId(null); }}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                                            activeCategory === cat
                                            ? 'bg-red-900 text-white border-red-600 shadow-lg scale-105'
                                            : 'bg-void-950 text-gray-500 border-void-800 hover:border-gray-600 hover:text-gray-300'
                                        }`}
                                     >
                                         {cat}
                                     </button>
                                 ))}
                             </div>
                         </div>

                         {/* CONTENT AREA - Scrollable List */}
                         <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-black/20 custom-scrollbar">
                            {Object.values(BUILDING_DEFINITIONS)
                                .filter(b => b.chain === activeCategory)
                                .map(def => {
                                    const reqsMet = !def.requires || def.requires.every(reqId => gameState.buildings.some(b => b.defId === reqId));
                                    const techMet = !def.requiredTech || gameState.researchedTechs.includes(def.requiredTech);
                                    const canAfford = Object.entries(def.baseCost).every(([res, amt]) => (gameState.resources[res as ResourceType] || 0) >= amt);
                                    const isUniqueAndBuilt = def.unique && gameState.buildings.some(b => b.defId === def.id);
                                    const locked = !reqsMet || !techMet;
                                    const isParasitic = def.placement === BuildingPlacement.ENEMY;
                                    const isExpanded = expandedDefId === def.id;

                                    return (
                                        <div 
                                            key={def.id} 
                                            className={`border rounded-lg transition-all duration-300 overflow-hidden ${
                                                isExpanded 
                                                ? 'bg-void-900 border-red-900 shadow-lg ring-1 ring-red-900/30' 
                                                : (locked || isUniqueAndBuilt) ? 'bg-black/40 border-void-900 opacity-70' : 'bg-void-950 border-void-800 hover:border-void-600'
                                            }`}
                                        >
                                            {/* Row Header - Click to Expand */}
                                            <div 
                                                onClick={() => setExpandedDefId(isExpanded ? null : def.id)}
                                                className="p-3 flex justify-between items-center cursor-pointer active:bg-void-800"
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    {/* Icon Box */}
                                                    <div className={`w-12 h-12 flex-none rounded-lg flex items-center justify-center border text-xl ${
                                                        locked 
                                                        ? 'bg-black border-void-800 text-gray-700' 
                                                        : isExpanded 
                                                            ? 'bg-red-950 border-red-800 text-red-500'
                                                            : 'bg-void-800 border-void-600 text-gray-300'
                                                    }`}>
                                                         {locked ? <GiPadlock /> : <GiCastle />} 
                                                    </div>

                                                    {/* Name & Cost Preview */}
                                                    <div className="min-w-0">
                                                        <div className={`font-bold text-sm truncate ${locked ? 'text-gray-500' : 'text-gray-100'}`}>
                                                            {def.name}
                                                            {isParasitic && <span className="ml-2 text-[9px] bg-purple-900 text-purple-200 px-1.5 rounded uppercase align-middle">Parasitic</span>}
                                                            {def.unique && <span className="ml-2 text-[9px] bg-red-950 text-red-400 px-1.5 rounded uppercase align-middle">Unique</span>}
                                                        </div>
                                                        
                                                        {/* Preview Cost Line */}
                                                        {!locked && !isUniqueAndBuilt && (
                                                            <div className="flex items-center gap-2 mt-1 text-xs">
                                                                {Object.entries(def.baseCost).slice(0, 2).map(([k,v]) => {
                                                                    const affordable = (gameState.resources[k as ResourceType] || 0) >= v;
                                                                    return (
                                                                        <span key={k} className={`${affordable ? 'text-gray-500' : 'text-red-500'} bg-black/30 px-1.5 rounded`}>
                                                                            {v} {k.substr(0,3)}
                                                                        </span>
                                                                    );
                                                                })}
                                                                {Object.keys(def.baseCost).length > 2 && <span className="text-gray-600 text-[10px]">+more</span>}
                                                            </div>
                                                        )}
                                                        {isUniqueAndBuilt && <div className="text-[10px] text-green-500 italic">Already Constructed</div>}
                                                        {locked && <div className="text-[10px] text-gray-600 italic">Requirements not met</div>}
                                                    </div>
                                                </div>

                                                {/* Right Status */}
                                                <div className="pl-2 text-right flex-none">
                                                    {locked ? (
                                                        <GiPadlock className="text-gray-600 text-lg" />
                                                    ) : isUniqueAndBuilt ? (
                                                        <GiCheckMark className="text-green-600 text-lg" />
                                                    ) : (
                                                        <div className={`text-xs font-bold uppercase px-2 py-1 rounded border ${
                                                            canAfford 
                                                                ? 'bg-green-950/30 border-green-900 text-green-500' 
                                                                : 'bg-red-950/30 border-red-900 text-red-500'
                                                        }`}>
                                                            {canAfford ? 'Build' : 'Cost'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Expanded Detail Panel */}
                                            {isExpanded && (
                                                <div className="p-4 border-t border-void-800 bg-black/20 animate-in slide-in-from-top-2 fade-in">
                                                    
                                                    {/* Description */}
                                                    <p className="text-sm text-gray-300 mb-4 leading-relaxed font-sans">{def.description}</p>
                                                    
                                                    {/* Stats & Costs Grid */}
                                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                                        {/* Left: Input/Output */}
                                                        <div className="space-y-3">
                                                            {/* Inputs */}
                                                            <div className="bg-void-950 p-2 rounded border border-void-800">
                                                                <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Consumes</div>
                                                                {Object.keys(def.inputs).length === 0 ? <span className="text-xs text-gray-600 italic">None</span> : 
                                                                    Object.entries(def.inputs).map(([r,v]) => (
                                                                        <div key={r} className="text-xs text-red-400 font-mono flex justify-between">
                                                                            <span>{r}</span> <span>-{v}/s</span>
                                                                        </div>
                                                                    ))
                                                                }
                                                            </div>
                                                            {/* Outputs */}
                                                            <div className="bg-void-950 p-2 rounded border border-void-800">
                                                                <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Produces</div>
                                                                {(Object.keys(def.outputs).length === 0 && !def.outputsUnits) ? <span className="text-xs text-gray-600 italic">None</span> : (
                                                                    <>
                                                                        {Object.entries(def.outputs).map(([r,v]) => (
                                                                            <div key={r} className="text-xs text-green-400 font-mono flex justify-between">
                                                                                 <span>{r}</span> <span>+{v}/s</span>
                                                                            </div>
                                                                        ))}
                                                                        {def.outputsUnits && Object.entries(def.outputsUnits).map(([u,v]) => (
                                                                            <div key={u} className="text-xs text-blue-400 font-mono flex justify-between">
                                                                                 <span>{UNIT_DEFINITIONS[u]?.name || u}</span> <span>+{v}/s</span>
                                                                            </div>
                                                                        ))}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Right: Requirements & Cost Detail */}
                                                        <div className="bg-void-950 p-2 rounded border border-void-800 flex flex-col justify-between">
                                                            <div>
                                                                <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Requirements</div>
                                                                <div className="space-y-1">
                                                                    {(def.requires || []).map(reqId => {
                                                                        const met = gameState.buildings.some(b => b.defId === reqId);
                                                                        return (
                                                                            <div key={reqId} className={`text-[10px] flex items-center gap-1 ${met ? 'text-green-600' : 'text-red-500'}`}>
                                                                                {met ? '✓' : '✖'} {BUILDING_DEFINITIONS[reqId]?.name}
                                                                            </div>
                                                                        )
                                                                    })}
                                                                    {def.requiredTech && (
                                                                        <div className={`text-[10px] flex items-center gap-1 ${techMet ? 'text-green-600' : 'text-red-500'}`}>
                                                                             {techMet ? '✓' : '✖'} {def.requiredTech.replace(/_/g, ' ')}
                                                                        </div>
                                                                    )}
                                                                    {(!def.requires && !def.requiredTech) && <span className="text-[10px] text-gray-600 italic">None</span>}
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="mt-3 pt-3 border-t border-void-800">
                                                                <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Total Cost</div>
                                                                <div className="space-y-1">
                                                                     {Object.entries(def.baseCost).map(([k,v]) => {
                                                                         const affordable = (gameState.resources[k as ResourceType] || 0) >= v;
                                                                         return (
                                                                             <div key={k} className={`text-xs flex justify-between font-mono ${affordable ? 'text-gray-300' : 'text-red-500'}`}>
                                                                                 <span>{k}</span> <span>{v}</span>
                                                                             </div>
                                                                         )
                                                                     })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Construct Button */}
                                                    <button 
                                                        disabled={locked || !canAfford || isUniqueAndBuilt}
                                                        onClick={(e) => { e.stopPropagation(); handleManualBuildSelect(def.id); }}
                                                        className={`w-full py-3 rounded-lg font-bold text-sm tracking-widest uppercase shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
                                                            (locked || isUniqueAndBuilt) ? 'bg-void-800 text-gray-600 cursor-not-allowed border border-void-700' :
                                                            canAfford ? 'bg-red-900 hover:bg-red-800 text-white border border-red-600 shadow-red-900/20' :
                                                            'bg-void-900 text-red-500 border border-red-900/40 cursor-not-allowed'
                                                        }`}
                                                    >
                                                        {isUniqueAndBuilt ? <><GiCheckMark /> Unique Structure Built</> :
                                                         locked ? <><GiPadlock /> Locked</> : 
                                                         canAfford ? <><GiThorHammer /> Construct</> : 
                                                         'Insufficient Resources'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            
                            {/* Empty State for category */}
                            {Object.values(BUILDING_DEFINITIONS).filter(b => b.chain === activeCategory).length === 0 && (
                                <div className="text-center text-gray-500 py-12 italic border border-dashed border-void-800 rounded-lg">
                                    No schematics available in this category.
                                </div>
                            )}
                         </div>
                    </div>
                 </div>
            )}
            
            {/* SCOUT DETAIL DRAWER */}
            {selectedScout && (
                <div className="absolute bottom-0 left-0 right-0 bg-void-900 border-t-2 border-red-800 p-5 rounded-t-2xl shadow-[0_-5px_50px_rgba(0,0,0,1)] z-[500] animate-[slideUp_0.3s_ease-out]">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="text-xs text-red-400 tracking-widest mb-1 uppercase">{selectedScout.type.replace('_', ' ')}</div>
                            <h2 className="text-2xl font-gothic text-white leading-none">{selectedScout.name}</h2>
                            <div className="text-gray-500 text-sm mt-1">Suggested Lair: {BUILDING_DEFINITIONS[selectedScout.suggestedBuildingId].name}</div>
                        </div>
                        <button onClick={() => setSelectedScout(null)} className="text-gray-500 hover:text-white p-2 text-xl">✕</button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-black/40 p-2 rounded border border-void-700">
                             <span className="block text-[10px] text-gray-500 uppercase">Cost</span>
                             <div className="text-red-400 text-sm font-bold flex flex-wrap gap-2">
                                {Object.entries(BUILDING_DEFINITIONS[selectedScout.suggestedBuildingId].baseCost).map(([k,v]) => (
                                    <span key={k}>{v} {k}</span>
                                ))}
                             </div>
                        </div>
                        <div className="bg-black/40 p-2 rounded border border-void-700">
                             <span className="block text-[10px] text-gray-500 uppercase">Production</span>
                             <div className="text-green-400 text-sm font-bold">
                                {Object.keys(BUILDING_DEFINITIONS[selectedScout.suggestedBuildingId].outputs)[0] || "Various"}
                             </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleCorrupt}
                        disabled={corruptingId === selectedScout.id}
                        className={`w-full py-3 font-gothic text-lg rounded border transition-all relative overflow-hidden ${
                            corruptingId === selectedScout.id 
                            ? 'bg-red-900/50 text-gray-400 border-red-900' 
                            : 'bg-red-700 hover:bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]'
                        }`}
                    >
                        {corruptingId === selectedScout.id ? (
                            <span className="flex items-center justify-center gap-2">
                                <GiSkullCrossedBones className="animate-spin" /> RITUAL IN PROGRESS...
                            </span>
                        ) : "CORRUPT LOCATION"}
                    </button>
                </div>
            )}

            {/* BUILDING DETAIL DRAWER */}
            {selectedBuilding && (
                <div className="absolute bottom-0 left-0 right-0 bg-void-900 border-t-2 border-purple-800 p-5 rounded-t-2xl shadow-[0_-5px_50px_rgba(0,0,0,1)] z-[500] animate-[slideUp_0.3s_ease-out]">
                     <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="text-xs text-purple-400 tracking-widest mb-1 uppercase">Controlled Territory</div>
                            <h2 className="text-2xl font-gothic text-white leading-none flex items-center gap-2">
                                {selectedBuilding.customName}
                                {selectedBuilding.paused && <span className="text-[10px] bg-red-900 px-1 rounded uppercase">Paused</span>}
                            </h2>
                            <div className="text-gray-500 text-sm mt-1">{BUILDING_DEFINITIONS[selectedBuilding.defId].name} (Lv {selectedBuilding.level})</div>
                        </div>
                        <button onClick={() => setSelectedBuilding(null)} className="text-gray-500 hover:text-white p-2 text-xl">✕</button>
                    </div>
                    
                    {/* Management Controls */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                         <button 
                             onClick={() => handleBuildingControl('PAUSE')}
                             className={`flex flex-col items-center justify-center p-2 rounded border ${selectedBuilding.paused ? 'bg-red-900/30 border-red-800 text-red-400' : 'bg-void-950 border-void-800 text-gray-400'}`}
                         >
                             {selectedBuilding.paused ? <GiPlayButton className="text-xl"/> : <GiPauseButton className="text-xl"/>}
                             <span className="text-[9px] mt-1">{selectedBuilding.paused ? 'Resume' : 'Halt'}</span>
                         </button>

                         <button 
                             onClick={() => handleBuildingControl('MOVE')}
                             className="flex flex-col items-center justify-center p-2 rounded bg-void-950 border border-void-800 text-gray-400 hover:text-white"
                         >
                             <GiRapidshareArrow className="text-xl"/>
                             <span className="text-[9px] mt-1">Relocate</span>
                         </button>
                         
                         <button 
                             onClick={() => handleBuildingControl('DESTROY')}
                             className="flex flex-col items-center justify-center p-2 rounded bg-void-950 border border-void-800 text-red-900 hover:text-red-500"
                         >
                             <GiTrashCan className="text-xl"/>
                             <span className="text-[9px] mt-1">Destroy</span>
                         </button>

                         <button 
                             onClick={handleManageLair}
                             className="flex flex-col items-center justify-center p-2 rounded bg-void-800 border border-void-600 text-gray-300"
                         >
                             <GiThorHammer className="text-xl"/>
                             <span className="text-[9px] mt-1">Manage</span>
                         </button>
                    </div>
                </div>
            )}
        </div>
    );
};
