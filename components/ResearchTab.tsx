
import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { TECH_DEFINITIONS, TechDef, ResourceType, UNIT_DEFINITIONS, BUILDING_DEFINITIONS } from '../types';
import * as Icons from '../lib/icons';

interface ResearchTabProps {
    notify: (msg: string) => void;
}

const formatDuration = (sec: number) => {
  if (sec < 60) return `${Math.ceil(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.ceil(sec % 60);
  return `${m}m ${s}s`;
};

export const ResearchTab = ({ notify }: ResearchTabProps) => {
    const { researchedTechs, activeResearch, startResearch, resources } = useGameStore();
    const [selectedTech, setSelectedTech] = useState<TechDef | null>(null);
    const [now, setNow] = useState(Date.now());
    const containerRef = useRef<HTMLDivElement>(null);

    // Timer sync
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 100);
        return () => clearInterval(interval);
    }, []);

    const handleResearch = (techId: string) => {
        const res = startResearch(techId);
        notify(res.message);
    };

    // --- VISUALIZATION HELPERS ---
    
    // Convert 0-100 grid coords to pixels for SVG lines
    const getPos = (tech: TechDef) => {
        // We'll calculate relative to a virtual 1000x1000 canvas to keep lines consistent
        return {
            x: tech.position.x * 10, // 0-100 -> 0-1000
            y: tech.position.y * 10
        };
    };

    const getNodeStatus = (techId: string) => {
        if (researchedTechs.includes(techId)) return 'COMPLETED';
        if (activeResearch?.techId === techId) return 'RESEARCHING';
        
        const tech = TECH_DEFINITIONS[techId];
        const reqsMet = tech.requires.every(req => researchedTechs.includes(req));
        if (reqsMet) return 'AVAILABLE';
        
        return 'LOCKED';
    };

    const techList = Object.values(TECH_DEFINITIONS);

    return (
        <div className="h-full flex flex-col bg-black overflow-hidden relative">
            {/* CANVAS CONTAINER */}
            <div className="flex-1 overflow-auto relative custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]">
                 <div className="absolute inset-0 bg-black/50 pointer-events-none" />
                 
                 <div className="relative min-w-[600px] min-h-[800px] w-full h-full p-10">
                    
                    {/* SVG CONNECTIONS LAYER */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        {techList.map(tech => {
                            const start = getPos(tech);
                            return tech.requires.map(reqId => {
                                const parent = TECH_DEFINITIONS[reqId];
                                if (!parent) return null;
                                const end = getPos(parent);
                                
                                const status = getNodeStatus(tech.id);
                                const isUnlocked = status === 'COMPLETED' || status === 'RESEARCHING' || status === 'AVAILABLE';
                                const strokeColor = isUnlocked ? '#b91c1c' : '#3f3f46'; // Red or Gray

                                return (
                                    <line 
                                        key={`${reqId}-${tech.id}`}
                                        x1={`${end.x / 10}%`} y1={`${end.y / 10}%`}
                                        x2={`${start.x / 10}%`} y2={`${start.y / 10}%`}
                                        stroke={strokeColor}
                                        strokeWidth={isUnlocked ? "3" : "2"}
                                        strokeDasharray={isUnlocked ? "" : "5,5"}
                                        className="transition-all duration-1000 ease-in-out"
                                        style={{ stroke: strokeColor, opacity: isUnlocked ? 0.8 : 0.4 }}
                                    />
                                );
                            });
                        })}
                    </svg>

                    {/* NODES LAYER */}
                    {techList.map(tech => {
                        const status = getNodeStatus(tech.id);
                        const Icon = (Icons as any)[tech.icon] || Icons.GiSecretBook;
                        
                        // Base styles
                        let baseClass = "w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 z-10 absolute -translate-x-1/2 -translate-y-1/2 shadow-xl ";
                        
                        if (status === 'COMPLETED') {
                            baseClass += "bg-red-900 border-2 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.6)] scale-100 hover:scale-110";
                        } else if (status === 'RESEARCHING') {
                            // No border here, handled by SVG
                            baseClass += "bg-void-900 text-yellow-500 scale-110 shadow-[0_0_30px_rgba(234,179,8,0.4)]"; 
                        } else if (status === 'AVAILABLE') {
                            baseClass += "bg-void-900 border-2 border-gray-500 text-gray-300 hover:border-white hover:bg-void-800 hover:scale-105 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]";
                        } else {
                            baseClass += "bg-black border-2 border-void-800 text-void-700 opacity-60 grayscale";
                        }

                        // Active Research Progress
                        const isResearchingThis = activeResearch?.techId === tech.id;
                        let progress = 0;
                        let remaining = 0;
                        if (isResearchingThis && activeResearch) {
                            const total = activeResearch.endTime - activeResearch.startTime;
                            const elapsed = now - activeResearch.startTime;
                            progress = Math.min(100, (elapsed / total) * 100);
                            remaining = Math.max(0, (activeResearch.endTime - now) / 1000);
                        }

                        return (
                            <div 
                                key={tech.id}
                                style={{ left: `${tech.position.x}%`, top: `${tech.position.y}%` }}
                                className={baseClass}
                                onClick={() => setSelectedTech(tech)}
                            >
                                <Icon className={`relative z-10 ${status === 'COMPLETED' ? 'text-2xl' : 'text-xl'}`} />
                                
                                {isResearchingThis && (
                                    <>
                                        <svg className="absolute inset-0 w-full h-full -rotate-90 z-0 overflow-visible">
                                            {/* Track */}
                                            <circle 
                                                cx="50%" cy="50%" r="24" 
                                                fill="transparent" 
                                                stroke="#4b5563" 
                                                strokeWidth="4"
                                                className="opacity-30"
                                            />
                                            {/* Progress */}
                                            <circle 
                                                cx="50%" cy="50%" r="24" 
                                                fill="transparent" 
                                                stroke="#eab308" 
                                                strokeWidth="4"
                                                strokeDasharray="150.8" // 2 * pi * 24
                                                strokeDashoffset={150.8 - (150.8 * progress / 100)}
                                                strokeLinecap="round"
                                                className="drop-shadow-[0_0_4px_#eab308]"
                                            />
                                        </svg>
                                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-yellow-400 border border-yellow-900/50 shadow-lg">
                                            {formatDuration(remaining)}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}

                 </div>
            </div>

            {/* DETAIL PANEL */}
            <div className="bg-void-950 border-t-2 border-void-800 p-4 min-h-[240px] z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.8)] relative">
                {selectedTech ? (
                    <div className="animate-in slide-in-from-bottom-5 fade-in duration-300">
                         <div className="flex justify-between items-start mb-2">
                             <div>
                                <h2 className="text-xl font-gothic text-red-500 tracking-wide">{selectedTech.name}</h2>
                                <p className="text-sm text-gray-400 italic font-serif">{selectedTech.description}</p>
                             </div>
                             <div className="flex flex-col items-end gap-1">
                                 <div className="text-xs font-mono text-gray-500 border border-void-800 px-2 py-1 rounded bg-black">
                                     {TECH_DEFINITIONS[selectedTech.id]?.requires.length === 0 ? "Root Knowledge" : "Forbidden Art"}
                                 </div>
                                 {activeResearch?.techId === selectedTech.id && (
                                     <div className="text-xs font-bold text-yellow-500 animate-pulse">
                                         Researching...
                                     </div>
                                 )}
                             </div>
                         </div>

                         {/* Effects / Unlocks */}
                         <div className="mb-4">
                             <div className="text-xs uppercase tracking-widest text-gray-500 mb-2 font-bold">Knowledge Grants</div>
                             <div className="flex flex-col gap-2">
                                {selectedTech.effects.length === 0 && <span className="text-xs text-gray-600 italic">Unlocks further research paths only.</span>}
                                
                                {selectedTech.effects.map((ef, i) => {
                                    // --- UNLOCK BUILDING CARD ---
                                    if (ef.type === 'UNLOCK_BUILDING') {
                                        const def = BUILDING_DEFINITIONS[ef.target!];
                                        if (!def) return null;

                                        return (
                                            <div key={i} className="bg-black/40 border border-void-700 rounded p-2 flex gap-3 items-start group hover:border-purple-800 transition-colors">
                                                <div className="p-2 bg-void-900 rounded border border-void-800 text-purple-400 group-hover:text-purple-300">
                                                    <Icons.GiCastle className="text-xl" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-bold text-gray-200">{def.name}</span>
                                                        <span className="text-[10px] text-gray-500 uppercase">Lair Structure</span>
                                                    </div>
                                                    <p className="text-xs text-gray-400 mb-1 leading-tight">{def.description}</p>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // --- UNLOCK UNIT CARD ---
                                    if (ef.type === 'UNLOCK_UNIT') {
                                        const def = UNIT_DEFINITIONS[ef.target!];
                                        if (!def) return null;

                                        return (
                                            <div key={i} className="bg-black/40 border border-void-700 rounded p-2 flex gap-3 items-start group hover:border-red-800 transition-colors">
                                                 <div className="p-2 bg-void-900 rounded border border-void-800 text-red-500 group-hover:text-red-400">
                                                    <Icons.GiSwordsEmblem className="text-xl" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm font-bold text-gray-200">{def.name}</span>
                                                        <span className="text-[10px] text-gray-500 uppercase">{def.tier} Unit</span>
                                                    </div>
                                                    <p className="text-xs text-gray-400 mb-1 leading-tight">{def.description}</p>
                                                </div>
                                            </div>
                                        );
                                    }
                                    
                                    // --- UNLOCK ABILITY ---
                                    if (ef.type === 'UNLOCK_ABILITY') {
                                        return (
                                            <div key={i} className="bg-black/40 border border-void-700 rounded p-2 flex gap-3 items-center group hover:border-blue-800 transition-colors">
                                                 <div className="p-2 bg-void-900 rounded border border-void-800 text-blue-400">
                                                    <Icons.GiScrollUnfurled className="text-xl" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-200">Unlock: {ef.target?.replace(/_/g, ' ')}</div>
                                                    <div className="text-xs text-gray-500">New Diplomatic Option</div>
                                                </div>
                                            </div>
                                        )
                                    }

                                    return null;
                                })}
                             </div>
                         </div>

                         {/* Action Area */}
                         <div className="flex items-center justify-between mt-4 border-t border-void-800 pt-3">
                             {/* Cost */}
                             <div className="flex flex-wrap gap-2 items-center">
                                 {Object.entries(selectedTech.cost).map(([res, amt]) => (
                                     <div key={res} className={`text-xs px-2 py-1 rounded border font-mono ${
                                         (resources[res as ResourceType] || 0) >= amt 
                                         ? 'bg-void-900 border-void-700 text-gray-300' 
                                         : 'bg-red-900/20 border-red-800 text-red-500'
                                     }`}>
                                         {amt} {res.substring(0,3)}
                                     </div>
                                 ))}
                                 <div className="text-xs px-3 py-1 rounded border bg-void-900 border-void-700 text-blue-300 font-bold flex items-center gap-1">
                                     <Icons.GiSpeedometer /> {formatDuration(selectedTech.researchTime)}
                                 </div>
                             </div>

                             {/* Button */}
                             {(() => {
                                 const status = getNodeStatus(selectedTech.id);
                                 if (status === 'COMPLETED') return <button disabled className="px-6 py-2 bg-void-800 text-green-500 rounded font-bold border border-void-700 flex items-center gap-2"><Icons.GiCheckMark /> MASTERED</button>;
                                 if (status === 'RESEARCHING') return <button disabled className="px-6 py-2 bg-yellow-900/50 text-yellow-500 rounded font-bold border border-yellow-700 animate-pulse shadow-[0_0_15px_rgba(234,179,8,0.2)]">RESEARCHING...</button>;
                                 if (status === 'LOCKED') return <button disabled className="px-6 py-2 bg-black text-gray-600 rounded font-bold border border-void-800 cursor-not-allowed flex items-center gap-2"><Icons.GiPadlock /> LOCKED</button>;
                                 
                                 // Available
                                 const canAfford = Object.entries(selectedTech.cost).every(([res, amt]) => (resources[res as ResourceType] || 0) >= amt);

                                 return (
                                     <button 
                                        onClick={() => handleResearch(selectedTech.id)}
                                        disabled={activeResearch !== null || !canAfford}
                                        className={`px-8 py-2 rounded font-bold border transition-all shadow-lg flex items-center gap-2 ${
                                            activeResearch !== null 
                                            ? 'bg-gray-800 text-gray-500 cursor-wait border-void-700' 
                                            : canAfford 
                                                ? 'bg-red-900 hover:bg-red-800 text-white border-red-600 hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] active:scale-95'
                                                : 'bg-void-900 text-red-500 border-red-900/50 cursor-not-allowed'
                                        }`}
                                     >
                                         {canAfford ? 'START RESEARCH' : 'INSUFFICIENT RESOURCES'}
                                     </button>
                                 );
                             })()}
                         </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600 italic gap-2 opacity-50">
                        <Icons.GiSecretBook className="text-4xl" />
                        <span>Select a node from the Dark Library to reveal its secrets.</span>
                    </div>
                )}
            </div>
        </div>
    );
};
