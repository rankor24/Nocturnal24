
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { UNIT_DEFINITIONS, ResourceType, UnitKind } from '../types';
import { GiSwordsEmblem, GiCoins, GiBloodySword, GiShield, GiSpeedometer, GiHealthNormal } from '../lib/icons';

interface MercenaryTabProps {
    notify: (msg: string) => void;
}

export const MercenaryTab = ({ notify }: MercenaryTabProps) => {
    const gameState = useGameStore();
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 100);
        return () => clearInterval(interval);
    }, []);

    const handleRecruit = (defId: string, multiplier: number) => {
        const result = gameState.recruitUnit(defId, multiplier);
        notify(result.message);
    };

    const formatTime = (ms: number) => {
        if (ms <= 0) return "Ready";
        const seconds = Math.ceil(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    };

    return (
        <div className="h-full overflow-y-auto p-4 bg-void-950 text-gray-300">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-yellow-900/50 pb-2 mb-6">
                <div>
                    <h2 className="font-gothic text-2xl text-yellow-500">Mercenary Contracts</h2>
                    <div className="text-xs text-gray-500">Gold commands what blood cannot.</div>
                </div>
                <div className="flex items-center gap-2 bg-yellow-900/20 px-3 py-1 rounded border border-yellow-900/50">
                    <GiCoins className="text-yellow-400 text-xl" />
                    <span className="text-xl font-bold font-mono text-white">{Math.floor(gameState.resources[ResourceType.GOLD] || 0)}</span>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(UNIT_DEFINITIONS)
                    .filter(u => u.kind === UnitKind.MERCENARY)
                    .map(def => {
                        // Check affordability
                        const canAfford = (mult: number) => {
                            const total = def.summonBatchSize * mult;
                            return Object.entries(def.cost).every(([r, amt]) => (gameState.resources[r as ResourceType] || 0) >= amt * total);
                        };

                        const isUnlocked = !def.requiredTech || gameState.researchedTechs.includes(def.requiredTech);

                        return (
                            <div key={def.id} className={`bg-black/40 border p-4 rounded-lg flex flex-col justify-between transition-all ${isUnlocked ? 'border-void-700 hover:border-yellow-700' : 'border-void-900 opacity-50 grayscale'}`}>
                                <div>
                                    <div className="flex gap-4 mb-3">
                                        <img src={def.image} alt={def.name} className="w-16 h-16 rounded object-cover border border-void-700" />
                                        <div>
                                            <h3 className="font-bold text-gray-200">{def.name}</h3>
                                            <span className="text-[10px] bg-void-800 px-1.5 py-0.5 rounded text-gray-500 uppercase">{def.tier} Class</span>
                                            <p className="text-[11px] text-gray-400 mt-1 leading-snug">{def.description}</p>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-4 gap-1 text-[10px] text-gray-400 bg-void-900/50 p-2 rounded mb-3">
                                        <div className="text-center"><GiBloodySword className="inline text-red-500"/> {def.baseStats.damage}</div>
                                        <div className="text-center"><GiHealthNormal className="inline text-green-500"/> {def.baseStats.hp}</div>
                                        <div className="text-center"><GiSpeedometer className="inline text-blue-400"/> {def.baseStats.speed}</div>
                                        <div className="text-center"><GiShield className="inline text-gray-300"/> {def.baseStats.defense}</div>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="border-t border-void-800 pt-3">
                                    <div className="flex flex-wrap gap-2 mb-3 justify-center">
                                        {Object.entries(def.cost).map(([r, v]) => (
                                            <span key={r} className={`text-xs px-2 py-0.5 rounded font-mono ${r === 'GOLD' ? 'bg-yellow-900/20 text-yellow-500' : 'bg-void-800 text-gray-400'}`}>
                                                {v} {r}
                                            </span>
                                        ))}
                                    </div>

                                    {isUnlocked ? (
                                        <div className="flex gap-2">
                                            {[1, 5, 10].map(mult => {
                                                const count = def.summonBatchSize * mult;
                                                const affordable = canAfford(mult);
                                                // Calculate total price for display
                                                const totalPrice = Object.entries(def.cost)
                                                    .map(([_, v]) => v * count)
                                                    .reduce((a, b) => a + b, 0); // Simplified for single currency mostly

                                                return (
                                                    <button 
                                                        key={mult}
                                                        disabled={!affordable}
                                                        onClick={() => handleRecruit(def.id, mult)}
                                                        className={`flex-1 py-2 rounded text-[10px] font-bold border transition-colors flex flex-col items-center justify-center ${
                                                            affordable 
                                                            ? 'bg-yellow-900/30 border-yellow-800 text-yellow-500 hover:bg-yellow-900/50' 
                                                            : 'bg-void-900 border-void-800 text-gray-600 cursor-not-allowed'
                                                        }`}
                                                    >
                                                        <span>Hire x{count}</span>
                                                        <span className="opacity-70">({totalPrice} G)</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center text-red-500 text-xs font-bold py-2 bg-black/50 rounded">LOCKED</div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
            </div>
        </div>
    );
};
