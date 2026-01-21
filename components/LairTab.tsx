
import React, { useState, useMemo } from 'react';
import { useGameStore, getUpgradeCost, getMaxSlaves } from '../store/gameStore';
import { BUILDING_DEFINITIONS, UNIT_DEFINITIONS, ActiveBuilding, BuildingPlacement, ResourceType, BuildingDef } from '../types';
import { GiPerson, GiUpgrade, GiPauseButton, GiPlayButton, GiTrashCan, GiThorHammer, GiPadlock, GiCheckMark, GiCastle, GiRadarSweep } from '../lib/icons';
import { getNightMultiplier } from '../lib/resourceUtils';

interface LairTabProps {
    notify: (msg: string) => void;
    setActiveTab: (tab: string) => void;
}

// 1. HEADER: The main background for the top of this screen.
const CITADEL_HEADER_BG = "https://storage.googleapis.com/nocturnal24/images/art-17687322034446300.png";

// Helper: Falls back to placeholder if no URL is provided above
const getBuildingImage = (def: BuildingDef) => {
    if (def.image) return def.image;
    return `https://placehold.co/600x350/1a1a1a/ffffff?text=${def.name}`;
};

export const LairTab = ({ notify, setActiveTab }: LairTabProps) => {
    const gameState = useGameStore();
    const { resources, buildings, researchedTechs, location } = gameState;
    
    // Changed default to Citadel and moved it to front of list
    const [activeCategory, setActiveCategory] = useState<string>('Citadel');
    const [selectedDef, setSelectedDef] = useState<BuildingDef | null>(null);

    const CATEGORIES = ['Citadel', 'Survival', 'Construction', 'Metal', 'Magic', 'Elite', 'Military'];

    const getActiveInstance = (defId: string) => buildings.find(b => b.defId === defId);
    const citadelLevel = buildings.reduce((acc, b) => acc + b.level, 0);

    const handleConstruct = (defId: string) => {
        if (!location) return notify("Lair location not initialized.");
        
        const r = 0.002 * Math.sqrt(Math.random());
        const theta = Math.random() * 2 * Math.PI;
        const lat = location.lat + r * Math.cos(theta);
        const lng = location.lng + r * Math.sin(theta);
        
        const res = gameState.constructManualBuilding(defId, lat, lng, BUILDING_DEFINITIONS[defId].name);
        notify(res.message);
        if (res.success) {
            setSelectedDef(null);
        }
    };

    const handleHeaderClick = () => {
        const citadelDef = BUILDING_DEFINITIONS['dark_citadel'];
        if (citadelDef) {
            setSelectedDef(citadelDef);
        }
    };

    return (
        <div className="h-full flex flex-col bg-black relative">
            
            {/* --- TOP: CITADEL VIEW (Reduced Height for Space Economy) --- */}
            <div className="relative h-[25vh] w-full bg-[#0a0a0a] overflow-hidden flex-none border-b border-void-800">
                {/* Background Image */}
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-40 transition-opacity duration-1000"
                    style={{ backgroundImage: `url('${CITADEL_HEADER_BG}')` }}
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-void-950 via-transparent to-black/60 pointer-events-none" />
                
                {/* Header Info - Clickable Shortcut */}
                <div 
                    className="absolute top-3 left-3 z-10 cursor-pointer group"
                    onClick={handleHeaderClick}
                    title="Manage Citadel"
                >
                    <h2 className="font-gothic text-2xl text-red-600 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] tracking-widest leading-none group-hover:text-red-500 transition-colors">
                        DARK CITADEL
                    </h2>
                    <div className="text-gray-400 font-mono text-[10px] flex items-center gap-2 mt-1 bg-black/50 px-2 py-0.5 rounded inline-block border border-void-800 group-hover:border-red-900 transition-colors">
                        <GiCastle /> Dominion Lv.{Math.floor(citadelLevel / 5) + 1}
                    </div>
                </div>

                {/* Night Indicator */}
                <div className="absolute top-3 right-3 z-10">
                    {getNightMultiplier() > 1 ? (
                        <div className="bg-blue-950/50 border border-blue-900 px-2 py-1 rounded-full text-blue-300 text-[10px] font-bold animate-pulse flex items-center gap-1">
                            <span>🌙</span> Night
                        </div>
                    ) : (
                         <div className="bg-yellow-950/50 border border-yellow-900 px-2 py-1 rounded-full text-yellow-600 text-[10px] font-bold flex items-center gap-1 opacity-70">
                            <span>☀️</span> Day
                        </div>
                    )}
                </div>

                {/* Building Status Strip */}
                <div className="absolute bottom-2 left-0 right-0 px-3 flex gap-1.5 overflow-x-auto no-scrollbar mask-fade-sides">
                     {buildings.slice(0, 8).map(b => (
                         <div key={b.uid} className="flex-none w-8 h-8 rounded border border-void-700 bg-void-900/80 flex items-center justify-center text-[10px] text-gray-500 relative group cursor-default backdrop-blur-sm">
                             <img src={BUILDING_DEFINITIONS[b.defId].image} className="w-6 h-6 object-contain opacity-80" alt="" />
                             {b.paused && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm" />}
                         </div>
                     ))}
                     {buildings.length > 8 && <div className="flex-none text-gray-600 text-[10px] self-center">+{buildings.length - 8}</div>}
                </div>
            </div>

            {/* --- BOTTOM: CONSTRUCTION DISTRICT --- */}
            <div className="flex-1 flex flex-col bg-void-950 relative z-20">
                
                {/* Category Tabs (Compact) */}
                <div className="flex overflow-x-auto gap-0.5 p-1 bg-black/60 border-b border-void-800 no-scrollbar flex-none">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 ${
                                activeCategory === cat 
                                ? 'bg-void-800 border-red-600 text-red-500' 
                                : 'bg-transparent border-transparent text-gray-500 hover:text-gray-300 hover:bg-void-900'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Compact Grid */}
                <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 bg-[#080808]">
                    {Object.values(BUILDING_DEFINITIONS)
                        .filter(def => def.chain === activeCategory && def.placement !== BuildingPlacement.ENEMY)
                        .map(def => {
                            const active = getActiveInstance(def.id);
                            const reqsMet = (!def.requires || def.requires.every(reqId => buildings.some(b => b.defId === reqId)));
                            const techMet = (!def.requiredTech || researchedTechs.includes(def.requiredTech));
                            const isLocked = !active && (!reqsMet || !techMet);
                            const canAfford = !active && Object.entries(def.baseCost).every(([r, amt]) => (resources[r as ResourceType] || 0) >= amt);

                            return (
                                <button 
                                    key={def.id}
                                    onClick={() => setSelectedDef(def)}
                                    className={`
                                        relative h-20 w-full rounded-lg border flex items-center p-2 transition-all group overflow-hidden text-left
                                        ${active 
                                            ? 'bg-void-900 border-void-700 hover:border-yellow-600' 
                                            : isLocked 
                                                ? 'bg-black/40 border-void-800 opacity-50 grayscale cursor-not-allowed' 
                                                : 'bg-void-900 border-void-800 hover:bg-void-800 hover:border-red-600'
                                        }
                                    `}
                                >
                                    {/* Icon Column */}
                                    <div className={`
                                        w-12 h-12 flex-none rounded flex items-center justify-center text-2xl mr-3 shadow-inner bg-black/30 overflow-hidden
                                    `}>
                                        {isLocked 
                                            ? <GiPadlock className="text-gray-600" /> 
                                            : <img src={def.image} alt={def.name} className="w-10 h-10 object-contain drop-shadow-md" />
                                        }
                                    </div>

                                    {/* Info Column */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                                        <div className={`text-xs font-bold leading-tight truncate mb-1 ${active ? 'text-gray-200' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                            {def.name}
                                        </div>
                                        
                                        {active ? (
                                            <div className="flex items-center gap-1 text-[10px] text-yellow-600 font-mono">
                                                <span className="bg-yellow-950/30 px-1 rounded border border-yellow-900/50">Lv.{active.level}</span>
                                                {active.paused && <span className="text-red-500 font-bold ml-1">PAUSED</span>}
                                            </div>
                                        ) : isLocked ? (
                                            <div className="text-[9px] text-red-900 font-bold uppercase tracking-wider">Locked</div>
                                        ) : (
                                            <div className="flex gap-1 overflow-hidden opacity-70 group-hover:opacity-100">
                                                {Object.entries(def.baseCost).slice(0, 2).map(([k,v]) => (
                                                    <span key={k} className={`text-[9px] px-1 rounded ${canAfford ? 'bg-void-950 text-gray-500' : 'bg-red-950/20 text-red-500'}`}>
                                                        {v}{k.substr(0,1)}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Status Dot */}
                                    {active && !active.paused && (
                                        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_5px_lime]" />
                                    )}
                                    {!active && !isLocked && canAfford && (
                                        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                                    )}
                                </button>
                            );
                        })
                    }
                    <div className="h-12 col-span-full" /> {/* Spacer */}
                </div>
            </div>

            {/* --- INSPECTOR MODAL --- */}
            {selectedDef && (
                <BuildingInspector 
                    def={selectedDef} 
                    activeInstance={getActiveInstance(selectedDef.id)}
                    onClose={() => setSelectedDef(null)}
                    onConstruct={() => handleConstruct(selectedDef.id)}
                    notify={notify}
                    goToMap={() => setActiveTab('MAP')}
                />
            )}
        </div>
    );
};

// --- SUB-COMPONENT: INSPECTOR ---

interface InspectorProps {
    def: BuildingDef;
    activeInstance?: ActiveBuilding;
    onClose: () => void;
    onConstruct: () => void;
    notify: (msg: string) => void;
    goToMap: () => void;
}

const BuildingInspector = ({ def, activeInstance, onClose, onConstruct, notify, goToMap }: InspectorProps) => {
    const gameState = useGameStore();
    const { resources, researchedTechs } = gameState;
    
    // Derived State
    const isLocked = (def.requires?.some(r => !gameState.buildings.find(b => b.defId === r)) || (def.requiredTech && !researchedTechs.includes(def.requiredTech))) && !activeInstance;
    
    // Cost Calc
    const currentLevel = activeInstance ? activeInstance.level : 0;
    const nextCost = activeInstance ? getUpgradeCost(def.id, currentLevel) : def.baseCost;
    const canAfford = Object.entries(nextCost).every(([r, amt]) => (resources[r as ResourceType] || 0) >= amt);
    
    const maxSlaves = activeInstance ? getMaxSlaves(def.id, activeInstance.level) : def.maxSlavesBase;
    const idleSlaves = resources[ResourceType.SLAVES] || 0;

    const handleUpgrade = () => {
        if (!activeInstance) return;
        const res = gameState.upgradeBuilding(activeInstance.uid);
        notify(res.message);
    };

    const handleSlaveChange = (delta: number) => {
        if (!activeInstance) return;
        gameState.assignSlaves(activeInstance.uid, activeInstance.slaves + delta);
    };

    const handleTogglePause = () => {
        if (!activeInstance) return;
        gameState.togglePauseBuilding(activeInstance.uid);
        notify("Production toggled.");
    };

    const handleDestroy = () => {
        if (!activeInstance) return;
        if (confirm("Demolish this structure? Resources will be partially recovered.")) {
            gameState.destroyBuilding(activeInstance.uid);
            notify("Structure demolished.");
            onClose();
        }
    };

    return (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-void-900 w-full max-w-lg rounded-xl border border-void-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header Image */}
                <div className="relative h-40 bg-black shrink-0 flex items-center justify-center overflow-hidden">
                    {/* Background Blur Effect */}
                    <img 
                        src={getBuildingImage(def)} 
                        alt="" 
                        className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm scale-110"
                    />
                    {/* Main Icon */}
                    <img 
                        src={getBuildingImage(def)} 
                        alt={def.name} 
                        className="relative z-10 w-24 h-24 object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]"
                    />
                    
                    <button onClick={onClose} className="absolute top-2 right-2 bg-black/40 text-gray-200 rounded-full p-1.5 hover:bg-red-900 transition-colors z-20">✕</button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-void-900 to-transparent p-4 pt-8">
                        <h2 className="text-2xl font-gothic text-white drop-shadow-md">{def.name}</h2>
                    </div>
                </div>

                {/* Content Scroll */}
                <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                    <p className="text-xs text-gray-300 leading-relaxed mb-4 italic border-l-2 border-void-700 pl-3">"{def.flavor}"</p>
                    <p className="text-xs text-gray-400 mb-4">{def.description}</p>

                    {/* Stats Panel */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                         <div className="bg-black/30 p-2 rounded border border-void-800">
                             <h4 className="text-[10px] uppercase text-gray-500 font-bold mb-1">Production</h4>
                             {Object.keys(def.outputs).length === 0 && !def.outputsUnits ? <span className="text-[10px] text-gray-600">None</span> : (
                                 <div className="space-y-0.5">
                                     {Object.entries(def.outputs).map(([r,v]) => {
                                         const rate = activeInstance ? (v * activeInstance.level * activeInstance.efficiency).toFixed(1) : v;
                                         return (
                                             <div key={r} className="flex justify-between text-[10px] font-mono text-green-400">
                                                 <span>{r}</span> <span>+{rate}/s</span>
                                             </div>
                                         )
                                     })}
                                     {def.outputsUnits && Object.entries(def.outputsUnits).map(([u,v]) => (
                                         <div key={u} className="flex justify-between text-[10px] font-mono text-blue-400">
                                             <span>{UNIT_DEFINITIONS[u]?.name || u}</span> <span>+{v}/s</span>
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>
                         <div className="bg-black/30 p-2 rounded border border-void-800">
                             <h4 className="text-[10px] uppercase text-gray-500 font-bold mb-1">Consumption</h4>
                             {Object.keys(def.inputs).length === 0 ? <span className="text-[10px] text-gray-600">None</span> : (
                                 <div className="space-y-0.5">
                                     {Object.entries(def.inputs).map(([r,v]) => {
                                         const rate = activeInstance ? (v * activeInstance.level * activeInstance.efficiency).toFixed(1) : v;
                                         return (
                                             <div key={r} className="flex justify-between text-[10px] font-mono text-red-400">
                                                 <span>{r}</span> <span>-{rate}/s</span>
                                             </div>
                                         )
                                     })}
                                 </div>
                             )}
                         </div>
                    </div>

                    {/* Requirements Check */}
                    {!activeInstance && isLocked && (
                        <div className="mb-4 bg-red-950/20 border border-red-900/50 p-2 rounded">
                            <h4 className="text-[10px] uppercase text-red-500 font-bold mb-1">Missing Requirements</h4>
                            <div className="space-y-0.5">
                                {def.requires?.map(req => {
                                    const met = gameState.buildings.some(b => b.defId === req);
                                    return (
                                        <div key={req} className={`text-[10px] flex items-center gap-2 ${met ? 'text-green-500' : 'text-red-400'}`}>
                                            {met ? <GiCheckMark /> : <GiPadlock />} {BUILDING_DEFINITIONS[req]?.name}
                                        </div>
                                    )
                                })}
                                {def.requiredTech && (
                                    <div className={`text-[10px] flex items-center gap-2 ${researchedTechs.includes(def.requiredTech) ? 'text-green-500' : 'text-red-400'}`}>
                                        {researchedTechs.includes(def.requiredTech) ? <GiCheckMark /> : <GiPadlock />} Tech: {def.requiredTech.replace(/_/g, ' ')}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Slave Controls */}
                    {activeInstance && maxSlaves > 0 && (
                         <div className="mb-4 bg-void-950 p-2 rounded border border-void-800">
                             <div className="flex justify-between items-center mb-1">
                                 <div className="flex items-center gap-2 text-gray-300 text-xs font-bold">
                                     <GiPerson /> Slaves
                                 </div>
                                 <div className="text-[10px] text-gray-500">{activeInstance.slaves} / {maxSlaves}</div>
                             </div>
                             <div className="flex items-center gap-2">
                                 <button onClick={() => handleSlaveChange(-1)} disabled={activeInstance.slaves <= 0} className="w-6 h-6 rounded bg-void-800 border border-void-600 flex items-center justify-center hover:bg-red-900 text-xs disabled:opacity-30">-</button>
                                 <div className="flex-1 h-1.5 bg-black rounded-full overflow-hidden">
                                     <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${(activeInstance.slaves / maxSlaves) * 100}%` }} />
                                 </div>
                                 <button onClick={() => handleSlaveChange(1)} disabled={activeInstance.slaves >= maxSlaves || idleSlaves <= 0} className="w-6 h-6 rounded bg-void-800 border border-void-600 flex items-center justify-center hover:bg-green-900 text-xs disabled:opacity-30">+</button>
                             </div>
                             <div className="text-[9px] text-center text-gray-500 mt-0.5">Idle: {Math.floor(idleSlaves)}</div>
                         </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-black border-t border-void-800 flex flex-col gap-2 shrink-0">
                    <div className="flex justify-between items-center text-[10px] text-gray-400 px-1">
                        <span>{activeInstance ? 'Next Level:' : 'Cost:'}</span>
                        <div className="flex gap-2">
                            {Object.entries(nextCost).map(([r, amt]) => {
                                const affordable = (resources[r as ResourceType] || 0) >= amt;
                                return (
                                    <span key={r} className={affordable ? 'text-gray-200' : 'text-red-500 font-bold'}>
                                        {amt} {r.substr(0,3)}
                                    </span>
                                )
                            })}
                        </div>
                    </div>

                    {activeInstance ? (
                        <div className="flex gap-2">
                            <button 
                                onClick={handleUpgrade}
                                disabled={!canAfford}
                                className={`flex-1 py-2 rounded font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                    canAfford 
                                    ? 'bg-purple-900 hover:bg-purple-800 text-white border border-purple-700' 
                                    : 'bg-void-900 text-gray-500 cursor-not-allowed border border-void-800'
                                }`}
                            >
                                <GiUpgrade /> Lv.{currentLevel + 1}
                            </button>
                            <button onClick={handleTogglePause} className="w-10 rounded bg-void-900 text-gray-400 border border-void-700 flex items-center justify-center">
                                {activeInstance.paused ? <GiPlayButton /> : <GiPauseButton />}
                            </button>
                            <button onClick={handleDestroy} className="w-10 rounded bg-void-900 text-red-800 border border-void-700 flex items-center justify-center hover:text-red-500">
                                <GiTrashCan />
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={onConstruct}
                            disabled={!canAfford || isLocked}
                            className={`w-full py-2 rounded font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                isLocked 
                                ? 'bg-void-900 text-gray-600 border border-void-800 cursor-not-allowed' 
                                : canAfford 
                                    ? 'bg-red-900 hover:bg-red-800 text-white border border-red-700' 
                                    : 'bg-void-900 text-red-800 border border-red-900 cursor-not-allowed'
                            }`}
                        >
                            {isLocked ? <><GiPadlock /> Locked</> : <><GiThorHammer /> Construct</>}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
