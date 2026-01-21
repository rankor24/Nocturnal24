
import React, { useEffect, useRef, useState } from 'react';
import { useBattleStore } from '../../store/battleStore';
import { useTerritoryStore } from '../../store/territoryStore';
import { UNIT_DEFINITIONS, FACTION_COLORS, FactionId } from '../../types';
import { BattleCanvas } from '../BattleCanvas';
import { GiSwordsEmblem, GiSkullCrossedBones, GiRunningNinja, GiPlayButton, GiPauseButton, GiCheckMark, GiBrokenBone, GiCrownedSkull, GiExitDoor } from '../../lib/icons';

export const BattleModal = () => {
    const { 
        isActive, playerArmy, enemyArmy, logs, 
        startBattle, retreat, battleType,
        battleOutcome, loot, closeBattle, initialPlayerArmy, initialEnemyArmy,
        territoryId, isFighting, battlePhase, deploymentPositions, updateDeploymentPosition
    } = useBattleStore();
    
    // Retrieve territory to identify enemy faction color
    const territory = useTerritoryStore(s => s.territories.find(t => t.id === territoryId));
    const enemyFaction = territory ? territory.defendingFaction : FactionId.PEASANT_VILLAGES; 
    const enemyColor = FACTION_COLORS[enemyFaction] || '#808080'; // Default grey if unknown
    const playerColor = FACTION_COLORS[FactionId.PLAYER];

    const logsEndRef = useRef<HTMLDivElement>(null);
    const [viewingLog, setViewingLog] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync log scroll
    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs, viewingLog]);

    // Handle Resize
    useEffect(() => {
        const updateDim = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        };
        window.addEventListener('resize', updateDim);
        updateDim();
        // small delay to let layout settle
        setTimeout(updateDim, 100);
        return () => window.removeEventListener('resize', updateDim);
    }, [isActive]);

    if (!isActive) return null;

    const renderResultScreen = () => {
        if (battleOutcome === 'NONE') return null;

        // Calculate Losses
        const calcLosses = (initial: any[], current: any[]) => {
            let lostCount = 0;
            let totalInitial = 0;
            initial.forEach(s => {
                totalInitial += s.count;
                const survivorStack = current.find(c => c.uid === s.uid);
                const survivorCount = survivorStack ? survivorStack.count : 0;
                lostCount += (s.count - survivorCount);
            });
            return { lostCount, totalInitial };
        };

        const playerStats = calcLosses(initialPlayerArmy, playerArmy);
        const enemyStats = calcLosses(initialEnemyArmy, enemyArmy);

        let title = "";
        let color = "";
        let flavor = "";
        let Icon = GiSwordsEmblem;

        if (battleOutcome === 'VICTORY') {
            title = "VICTORY";
            color = "text-yellow-500";
            flavor = "The enemy is broken. Their essence is yours.";
            Icon = GiCrownedSkull;
        } else if (battleOutcome === 'DEFEAT') {
            title = "DEFEAT";
            color = "text-red-600";
            flavor = "Your forces return to the dust from whence they came.";
            Icon = GiSkullCrossedBones;
        } else {
            title = "ESCAPED";
            color = "text-blue-400";
            flavor = "You live to fight another night.";
            Icon = GiExitDoor;
        }

        return (
            <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
                <Icon className={`text-6xl mb-4 ${color} drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]`} />
                <h1 className={`font-gothic text-5xl mb-2 ${color} tracking-widest uppercase`}>{title}</h1>
                <p className="text-gray-400 text-sm italic mb-8 font-serif text-center max-w-md">"{flavor}"</p>

                <div className="grid grid-cols-2 gap-8 w-full max-w-lg mb-8">
                    {/* Player Stats */}
                    <div className="bg-void-900/50 p-4 rounded border border-void-700 text-center">
                        <div className="text-xs text-blue-400 uppercase tracking-widest mb-2 font-bold">Your Casualties</div>
                        <div className="text-3xl font-gothic text-gray-200">{playerStats.lostCount.toLocaleString()} <span className="text-sm text-gray-500">/ {playerStats.totalInitial.toLocaleString()}</span></div>
                        <div className="text-[10px] text-red-500 mt-1 uppercase">Lost Forever</div>
                    </div>
                    {/* Enemy Stats */}
                    <div className="bg-void-900/50 p-4 rounded border border-void-700 text-center">
                        <div className="text-xs text-red-400 uppercase tracking-widest mb-2 font-bold">Enemy Casualties</div>
                        <div className="text-3xl font-gothic text-gray-200">{enemyStats.lostCount.toLocaleString()} <span className="text-sm text-gray-500">/ {enemyStats.totalInitial.toLocaleString()}</span></div>
                        <div className="text-[10px] text-green-500 mt-1 uppercase">Slaughtered</div>
                    </div>
                </div>

                {battleOutcome === 'VICTORY' && loot && loot.length > 0 && (
                     <div className="mb-8 w-full max-w-lg">
                         <div className="text-center text-xs text-yellow-500 uppercase tracking-widest mb-2 font-bold border-b border-yellow-900/30 pb-1">Spoils of War</div>
                         <div className="space-y-1">
                             {loot.map((l, i) => (
                                 <div key={i} className="text-sm text-gray-300 text-center bg-yellow-950/20 py-1 rounded border border-yellow-900/20">{l}</div>
                             ))}
                         </div>
                     </div>
                )}

                <div className="flex gap-4">
                    <button 
                        onClick={closeBattle}
                        className={`px-8 py-2 rounded font-bold border transition-all ${
                            battleOutcome === 'VICTORY' 
                            ? 'bg-yellow-900/50 border-yellow-700 text-yellow-500 hover:bg-yellow-900' 
                            : 'bg-red-900 border-red-700 text-white hover:bg-red-800'
                        }`}
                    >
                        {battleOutcome === 'VICTORY' ? 'Claim Dominion' : 'Leave Battlefield'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-md flex flex-col animate-in fade-in duration-300">
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/90 to-transparent p-4 flex justify-between items-center pointer-events-none">
                <div className="pointer-events-auto">
                    <h2 className="font-gothic text-2xl text-red-500 flex items-center gap-2 drop-shadow-md">
                        <GiSwordsEmblem /> {battleType}
                    </h2>
                    {battlePhase === 'DEPLOYMENT' && <div className="text-yellow-500 font-mono text-xs animate-pulse">DEPLOYMENT PHASE</div>}
                    {isFighting && <div className="text-red-400 font-mono text-xs animate-pulse">Total War Engaged...</div>}
                </div>
                
                {/* Army Strength HUD */}
                <div className="flex gap-8 pointer-events-auto">
                    <div className="text-right">
                        <div className="text-xs font-bold uppercase" style={{ color: playerColor }}>Your Army</div>
                        <div className="text-xl font-gothic text-white">
                            {playerArmy.reduce((a, b) => a + b.count, 0).toLocaleString()} Units
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-bold uppercase" style={{ color: enemyColor }}>Enemy Army</div>
                        <div className="text-xl font-gothic text-white">
                            {enemyArmy.reduce((a, b) => a + b.count, 0).toLocaleString()} Units
                        </div>
                    </div>
                </div>
            </div>

            {/* BATTLE SIMULATION CANVAS */}
            <div ref={containerRef} className="flex-1 w-full h-full bg-[#050505] relative">
                {containerRef.current && (
                    <BattleCanvas 
                        playerArmy={playerArmy}
                        enemyArmy={enemyArmy}
                        width={dimensions.width}
                        height={dimensions.height}
                        isPaused={false}
                        battleStarted={isFighting} // Only start simulation when fighting
                        playerColor={playerColor}
                        enemyColor={enemyColor}
                        phase={battlePhase}
                        deploymentPositions={deploymentPositions}
                        onUpdatePosition={updateDeploymentPosition}
                    />
                )}
                
                {/* Visual Overlay Gradient for cinematic look */}
                <div 
                    className="absolute inset-0 pointer-events-none mix-blend-overlay" 
                    style={{ background: `linear-gradient(90deg, ${playerColor}20 0%, transparent 50%, ${enemyColor}20 100%)` }}
                />
            </div>

            {/* Result Overlay */}
            {renderResultScreen()}

            {/* Controls Bar */}
            <div className={`absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black to-transparent flex justify-center gap-4 ${battleOutcome !== 'NONE' && !viewingLog ? 'hidden' : ''}`}>
                <button 
                    onClick={retreat}
                    disabled={isFighting || battleOutcome !== 'NONE'}
                    className="px-6 py-3 rounded-full bg-black/80 border border-gray-600 text-gray-400 hover:text-white hover:bg-gray-800 flex items-center gap-2 disabled:opacity-30 backdrop-blur-md"
                >
                    <GiRunningNinja /> Retreat
                </button>
                
                {isFighting ? (
                    <div className="px-8 py-3 rounded-full border border-red-600 bg-red-900/20 text-red-500 font-bold animate-pulse backdrop-blur-md">
                        BATTLE IN PROGRESS...
                    </div>
                ) : (
                    <button 
                        onClick={startBattle}
                        disabled={battleOutcome !== 'NONE'}
                        className={`px-10 py-3 rounded-full border font-bold shadow-[0_0_20px_rgba(220,38,38,0.5)] active:scale-95 transition-all flex items-center gap-2 ${
                            battlePhase === 'DEPLOYMENT' 
                            ? 'bg-yellow-900 text-white border-yellow-600 hover:bg-yellow-800' 
                            : 'bg-red-900 text-white border-red-600 hover:bg-red-800'
                        }`}
                    >
                        <GiSwordsEmblem /> {battlePhase === 'DEPLOYMENT' ? 'START BATTLE' : 'ENGAGED'}
                    </button>
                )}
            </div>
        </div>
    );
};
