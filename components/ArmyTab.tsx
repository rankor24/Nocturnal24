
import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { UNIT_DEFINITIONS, ResourceType, UnitKind, UnitSpecial, ITEM_DEFINITIONS } from '../types';
import { calculateStackStats, getStackHealthPercentage, calculateArmyPower } from '../lib/armyUtils';
import { formatResource } from '../lib/resourceUtils';
import { GiBloodySword, GiHealthNormal, GiSpeedometer, GiShield, GiClover, GiSwordsEmblem, GiUpgrade, GiTrashCan, GiAbdominalArmor } from '../lib/icons';

interface ArmyTabProps {
    notify: (msg: string) => void;
}

export const ArmyTab = ({ notify }: ArmyTabProps) => {
    const gameState = useGameStore();
    const armyPower = calculateArmyPower(gameState.army);
    const [now, setNow] = useState(Date.now());
    const [equipModalHeroId, setEquipModalHeroId] = useState<string | null>(null);

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 100);
        return () => clearInterval(interval);
    }, []);

    const handleRecruit = (defId: string, multiplier: number) => {
        const result = gameState.recruitUnit(defId, multiplier);
        notify(result.message);
    };
    
    const handleUpgradeStack = (stackUid: string) => {
        const result = gameState.upgradeUnitStack(stackUid);
        notify(result.message);
    }

    const handleCancel = (orderId: string) => {
        const result = gameState.cancelRecruitment(orderId);
        notify(result.message);
    }

    const handleEquip = (heroId: string, itemId: string) => {
        const res = gameState.equipItem(heroId, itemId);
        notify(res.message);
        if(res.success) setEquipModalHeroId(null);
    }

    const formatTime = (ms: number) => {
        if (ms <= 0) return "Ready";
        const seconds = Math.ceil(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}m ${secs}s`;
        }
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${mins}m`;
    };

    return (
        <div className="h-full overflow-y-auto space-y-6 p-4">
            {gameState.recruitmentQueue.length > 0 && (
                <div className="bg-void-950/50 p-3 rounded border border-void-800">
                    <h3 className="font-gothic text-gray-400 text-sm mb-2 border-b border-void-800 pb-1">Rituals in Progress</h3>
                    <div className="space-y-2">
                        {gameState.recruitmentQueue.map(order => {
                            const def = UNIT_DEFINITIONS[order.defId];
                            const totalDuration = order.finishTime - order.startTime;
                            const elapsed = now - order.startTime;
                            const percent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
                            const remaining = order.finishTime - now;

                            return (
                                <div key={order.id} className="bg-black/40 p-2 rounded relative overflow-hidden group">
                                    <div className="flex justify-between items-center text-xs relative z-10 text-gray-200">
                                        <div className="flex items-center gap-2">
                                            <img src={def.image} className="w-6 h-6 rounded object-cover border border-void-700" alt="" />
                                            <div className="font-bold">{formatResource(order.count)}x {def.name}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="font-mono text-gray-400">{formatTime(remaining)}</div>
                                            <button onClick={() => handleCancel(order.id)} className="bg-red-900/20 hover:bg-red-900 text-red-500 hover:text-white p-1 rounded"><GiTrashCan /></button>
                                        </div>
                                    </div>
                                    <div className="absolute top-0 left-0 bottom-0 bg-red-900/30" style={{ width: `${percent}%` }}></div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div>
                <div className="flex justify-between items-center border-b border-red-900/50 pb-2 mb-4">
                    <h2 className="font-gothic text-xl text-red-500">Dark Rituals</h2>
                    <div className="text-[10px] text-gray-500 font-mono">
                         Army Cap: {formatResource(gameState.army.reduce((a,u) => a+u.count, 0))} / 500k
                    </div>
                </div>

                <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
                {Object.values(UNIT_DEFINITIONS)
                    .filter(u => !u.upgradedFrom && u.kind === UnitKind.UNDEAD)
                    .sort((a,b) => (a.tier === 'SWARM' ? -1 : 1))
                    .map(def => {
                    const canAfford = (mult: number) => {
                         const total = def.summonBatchSize * mult;
                         return Object.entries(def.cost).every(([r, amt]) => (gameState.resources[r as ResourceType] || 0) >= amt * total);
                    };
                    const isUnlocked = !def.requiredTech || gameState.researchedTechs.includes(def.requiredTech);
                    const buildingReqMet = !def.requiredBuilding || gameState.buildings.some(b => b.defId === def.requiredBuilding);

                    return (
                        <div key={def.id} className={`flex-none w-56 bg-void-900 border p-3 rounded transition-colors flex flex-col justify-between ${isUnlocked && buildingReqMet ? 'border-void-700 hover:border-red-800' : 'border-void-900 opacity-60'}`}>
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <img src={def.image} alt={def.name} className="w-10 h-10 object-cover rounded border border-void-700 bg-black" />
                                        <span className="font-bold text-gray-200 text-sm leading-tight">{def.name}</span>
                                    </div>
                                    <span className="text-[9px] bg-void-950 px-1 rounded text-gray-500 self-center border border-void-800">{def.tier}</span>
                                </div>
                                <p className="text-[10px] text-gray-500 h-8 line-clamp-2 leading-tight mb-2">{def.description}</p>
                                <div className="grid grid-cols-2 gap-1 mb-2 text-[10px] text-gray-400 bg-black/30 p-1 rounded">
                                    <div className="flex items-center gap-1"><GiBloodySword className="text-red-500"/> {def.baseStats.damage}</div>
                                    <div className="flex items-center gap-1"><GiHealthNormal className="text-green-500"/> {def.baseStats.hp}</div>
                                    <div className="flex items-center gap-1"><GiSpeedometer className="text-blue-400"/> {def.baseStats.speed}</div>
                                    <div className="flex items-center gap-1"><GiShield className="text-gray-300"/> {def.baseStats.defense}</div>
                                </div>
                            </div>
                            <div className="border-t border-void-800 pt-2">
                                <div className="flex flex-wrap gap-1 mb-2 justify-center">
                                    {Object.entries(def.cost).map(([r, v]) => (
                                    <span key={r} className="text-[9px] px-1 rounded bg-black/50 text-gray-400">{v} {r.substring(0,3)}/unit</span>
                                    ))}
                                </div>
                                {isUnlocked && buildingReqMet ? (
                                    <div className="flex flex-wrap gap-1">
                                        {[1, 5, 50, 100, 1000].map(mult => {
                                            const count = def.summonBatchSize * mult;
                                            const affordable = canAfford(mult);
                                            const time = def.recruitTime * mult;
                                            
                                            // Formatting count for button
                                            let countLabel = count.toString();
                                            if (count >= 1000000) countLabel = (count / 1000000).toFixed(1).replace('.0','') + 'M';
                                            else if (count >= 1000) countLabel = (count / 1000).toFixed(0) + 'k';

                                            return (
                                                <button key={mult} disabled={!affordable} onClick={() => handleRecruit(def.id, mult)} className={`flex-grow min-w-[30%] py-1.5 rounded border text-[10px] flex flex-col items-center justify-center leading-tight ${affordable ? 'bg-void-800 border-void-600 text-gray-300 hover:bg-red-900 hover:border-red-700' : 'bg-black border-void-900 text-gray-600 cursor-not-allowed opacity-50'}`}>
                                                    <span className="font-bold">x{countLabel}</span>
                                                    <span className="text-[8px] opacity-70">{formatTime(time * 1000)}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-[10px] text-red-500 text-center font-bold bg-black/50 p-1 rounded border border-red-900/30">
                                        {!isUnlocked ? 'LOCKED BY RESEARCH' : 'REQUIRES STRUCTURE'}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                </div>
            </div>

            <div>
                <div className="flex justify-between items-end border-b border-red-900/50 pb-2 mb-4">
                    <div>
                        <h2 className="font-gothic text-xl text-red-500">War Hordes</h2>
                        <div className="text-[10px] text-gray-500 font-mono">Slots: {gameState.army.length} / 10</div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="text-xs text-red-400 uppercase tracking-widest">Total Strength</div>
                        <div className="text-2xl font-gothic text-white flex items-center gap-2"><GiSwordsEmblem /> {formatResource(armyPower)}</div>
                    </div>
                </div>
                {gameState.army.length === 0 && <div className="text-gray-600 text-sm text-center py-10 italic">No armies raised. The silence is deafening.</div>}
                <div className="grid grid-cols-1 gap-4 pb-20">
                    {gameState.army.map((stack, i) => {
                    const def = UNIT_DEFINITIONS[stack.defId];
                    if (!def) return null;
                    const stats = calculateStackStats(stack, gameState.army);
                    const hpPercent = getStackHealthPercentage(stack);
                    const isDiminished = stack.count > 1000;
                    const isHero = def.special === UnitSpecial.LEADER;
                    
                    const upgradeDef = Object.values(UNIT_DEFINITIONS).find(u => u.upgradedFrom === stack.defId);
                    const canEvolve = upgradeDef && (!upgradeDef.requiredTech || gameState.researchedTechs.includes(upgradeDef.requiredTech));
                    
                    let evolveCostString = '';
                    let canAffordEvolution = false;
                    if (upgradeDef && upgradeDef.upgradeCost) {
                        const costEntries = Object.entries(upgradeDef.upgradeCost);
                        evolveCostString = costEntries.map(([k,v]) => `${formatResource(v! * stack.count)} ${k}`).join(', ');
                        canAffordEvolution = costEntries.every(([k, v]) => (gameState.resources[k as ResourceType] || 0) >= v! * stack.count);
                    }

                    return (
                        <div key={stack.uid} className="bg-gradient-to-r from-void-900 to-black p-1 rounded border border-void-700 relative overflow-hidden group">
                            <div className="flex items-stretch gap-3 p-2 relative z-10">
                                <div className="w-20 h-20 flex-none bg-black/40 rounded border border-void-800 relative overflow-hidden group-hover:border-void-600 transition-colors">
                                    <img src={def.image} alt={def.name} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-center text-xs font-mono font-bold text-white border-t border-void-800">{formatResource(stack.count)}</div>
                                    <div className="absolute top-0 right-0 bg-black/60 text-[9px] px-1 rounded-bl text-gray-400">{def.tier}</div>
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-gray-200">{def.name}</h3>
                                        <div className="flex gap-1">
                                            {stats.activeSynergies.map(syn => (
                                                <div key={syn} title={syn} className="w-4 h-4 rounded-full bg-blue-900/50 border border-blue-500 flex items-center justify-center text-[10px] cursor-help">✨</div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 text-xs bg-black/20 p-1 rounded my-1">
                                        <div className="text-center"><div className="text-[9px] text-gray-500 uppercase">Dmg</div><div className={`font-bold ${isDiminished ? 'text-yellow-500' : 'text-red-400'}`}>{formatResource(stats.effectiveDamage)}</div></div>
                                        <div className="text-center"><div className="text-[9px] text-gray-500 uppercase">HP</div><div className="font-bold text-green-400">{formatResource(stats.effectiveHp)}</div></div>
                                        <div className="text-center"><div className="text-[9px] text-gray-500 uppercase">Spd</div><div className="font-bold text-blue-400">{stats.effectiveSpeed.toFixed(0)}</div></div>
                                        <div className="text-center"><div className="text-[9px] text-gray-500 uppercase">Def</div><div className="font-bold text-gray-300">{stats.defense.toFixed(0)}</div></div>
                                    </div>
                                    {isHero && (
                                        <div className="flex justify-between items-center text-[10px] bg-void-950/50 p-1 rounded border border-void-800">
                                            <span className="text-purple-400 font-bold">Equipment</span>
                                            <button onClick={() => setEquipModalHeroId(stack.uid)} className="flex items-center gap-1 bg-void-800 hover:bg-purple-900 px-2 py-0.5 rounded border border-void-600 text-gray-300">
                                                <GiAbdominalArmor /> Equip
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {upgradeDef && (
                                <div className="border-t border-void-800 p-2 flex justify-between items-center bg-black/30">
                                    <div className="text-[10px] text-purple-400">Evolution Available: {upgradeDef.name}</div>
                                    <button onClick={() => handleUpgradeStack(stack.uid)} disabled={!canAffordEvolution || !canEvolve} className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-2 border ${canAffordEvolution && canEvolve ? 'bg-purple-900 text-white border-purple-600 hover:bg-purple-800' : 'bg-void-950 text-gray-600 border-void-800 cursor-not-allowed'}`}>
                                        <GiUpgrade /> {canEvolve ? 'Evolve' : 'Locked'} ({evolveCostString})
                                    </button>
                                </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-void-800"><div className="h-full bg-green-600 transition-all duration-500" style={{ width: `${hpPercent}%` }}></div></div>
                        </div>
                    );
                    })}
                </div>
            </div>

            {/* HERO EQUIPMENT MODAL */}
            {equipModalHeroId && (
                <div className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-4">
                    <div className="bg-void-900 w-full max-w-sm border border-void-700 rounded-lg p-4 shadow-2xl">
                        <div className="flex justify-between mb-4">
                            <h3 className="font-gothic text-xl text-purple-500">Hero Inventory</h3>
                            <button onClick={() => setEquipModalHeroId(null)} className="text-gray-500">✕</button>
                        </div>
                        
                        {gameState.inventory.length === 0 ? (
                            <div className="text-center text-gray-500 italic py-8">Your treasury is empty. Conquer enemies to find loot.</div>
                        ) : (
                            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                                {gameState.inventory.map(item => {
                                    const def = ITEM_DEFINITIONS[item.defId];
                                    if (!def) return null;
                                    return (
                                        <div key={item.id} className="bg-black/40 border border-void-800 p-2 rounded flex justify-between items-center">
                                            <div>
                                                <div className="text-sm font-bold text-gray-200">{def.name}</div>
                                                <div className="text-[10px] text-gray-500">{def.description}</div>
                                                <div className="text-[10px] text-purple-400 mt-1">
                                                    {Object.entries(def.stats).map(([k,v]) => `+${v} ${k}`).join(', ')}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleEquip(equipModalHeroId, item.id)}
                                                className="bg-void-800 hover:bg-purple-900 border border-void-600 px-3 py-1 rounded text-xs"
                                            >
                                                Equip
                                            </button>
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
};
