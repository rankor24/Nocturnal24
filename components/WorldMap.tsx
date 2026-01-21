
import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { ActiveBuilding, ScoutResult, BUILDING_DEFINITIONS, Territory, TerritoryTier, FactionId, FACTION_COLORS, ResourceType, TerritoryAction, TerrainType, UNIT_DEFINITIONS } from '../types';
import { useTerritoryStore, TIER_COST, TIER_COST_GOLD, getClaimCost } from '../store/territoryStore';
import { useGameStore } from '../store/gameStore';
import { useFactionStore } from '../store/factionStore';
import { useBattleStore, generateEnemyGarrison } from '../store/battleStore';
import { calculateArmyPower } from '../lib/armyUtils';
import { formatResource } from '../lib/resourceUtils';
import { GiCastle, GiUpgrade, GiSkullCrossedBones, GiRadarSweep, GiSwordsEmblem, GiManacles, GiSpy, GiPresent, GiPartyPopper, GiStoneWall, GiForest, GiVillage, GiSpikedWall, GiMagnifyingGlass } from '../lib/icons';

interface WorldMapProps {
  lat: number;
  lng: number;
  scoutResults: ScoutResult[];
  buildings: ActiveBuilding[];
  onSelectScout: (s: ScoutResult) => void;
  onSelectBuilding: (b: ActiveBuilding) => void;
  isScouting: boolean;
  onScout: () => void;
  isPlacementMode?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  notify: (msg: string) => void;
}

export const WorldMap = ({ 
  lat, 
  lng, 
  scoutResults, 
  buildings, 
  onSelectScout, 
  onSelectBuilding,
  isScouting,
  onScout,
  isPlacementMode = false,
  onMapClick,
  notify
}: WorldMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    markers: L.LayerGroup,
    territories: L.LayerGroup,
    corruption: L.LayerGroup
  } | null>(null);

  const territories = useTerritoryStore(s => s.territories);
  const { claimTerritory, upgradeTerritory, performTerritoryAction } = useTerritoryStore();
  const resources = useGameStore(s => s.resources);
  const factions = useFactionStore(s => s.factions);
  const initBattle = useBattleStore(s => s.initBattle);
  
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const [hasInitializedView, setHasInitializedView] = useState(false);

  // Garrison Preview
  const garrisonPreview = useMemo(() => {
      if (!selectedTerritory || selectedTerritory.defendingFaction === FactionId.PLAYER) return null;
      const army = generateEnemyGarrison(selectedTerritory.defendingFaction, selectedTerritory.controlTier);
      const power = calculateArmyPower(army);
      const totalUnits = army.reduce((a,b) => a+b.count, 0);
      return { army, power, totalUnits };
  }, [selectedTerritory]);

  useEffect(() => {
    if (selectedTerritory) {
        const updated = territories.find(t => t.id === selectedTerritory.id);
        if (updated && updated !== selectedTerritory) setSelectedTerritory(updated);
    }
  }, [territories, selectedTerritory]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    const centerLat = lat || 56.946;
    const centerLng = lng || 24.105;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 14,
      minZoom: 8, // Restricts zoom out to Country/Region level (Latvia view)
      maxZoom: 16, // Restricts zoom in to maintain strategy view and art aesthetics
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: true,
      markerZoomAnimation: true,
      renderer: L.canvas()
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
      maxZoom: 16,
      subdomains: 'abcd',
    }).addTo(map);

    layersRef.current = {
      corruption: L.layerGroup().addTo(map),
      territories: L.layerGroup().addTo(map),
      markers: L.layerGroup().addTo(map),
    };

    mapInstanceRef.current = map;
    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); 

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const handler = (e: L.LeafletMouseEvent) => {
      if (onMapClick && isPlacementMode) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      } else {
        setSelectedTerritory(null);
      }
    };
    map.on('click', handler);
    return () => { map.off('click', handler); }
  }, [onMapClick, isPlacementMode]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || hasInitializedView) return;
    if (lat && lng) {
        map.setView([lat, lng], 14);
        setHasInitializedView(true);
    }
  }, [lat, lng, hasInitializedView]);

  useEffect(() => {
    const layers = layersRef.current;
    const map = mapInstanceRef.current;
    if (!layers || !map) return;

    layers.markers.clearLayers();
    layers.territories.clearLayers();
    layers.corruption.clearLayers();

    const sortedTerritories = [...territories].sort((a, b) => {
        if (a.defendingFaction === FactionId.PLAYER) return 1;
        if (b.defendingFaction === FactionId.PLAYER) return -1;
        return 0;
    });

    sortedTerritories.forEach(t => {
      const isPlayer = t.defendingFaction === FactionId.PLAYER;
      const baseColor = FACTION_COLORS[t.defendingFaction] || '#6b7280';
      let fillOpacity = 0.2;
      if (isPlayer) {
          fillOpacity = 0.1 + (t.corruptionProgress / 500); 
      } else {
          fillOpacity = 0.15;
      }

      const circle = L.circle([t.lat, t.lng], {
        color: baseColor,
        fillColor: baseColor,
        fillOpacity: fillOpacity,
        weight: isPlayer ? 3 : 1,
        radius: t.radius,
        className: isPlayer ? 'player-territory-pulse' : 'transition-all duration-500'
      });

      circle.on('click', (e) => {
        if (isPlacementMode) return;
        L.DomEvent.stopPropagation(e);
        setSelectedTerritory(t);
      });

      circle.addTo(layers.territories);
      if (isPlayer) circle.bringToFront();

      if (!isPlayer && t.corruptionProgress > 0) {
          L.circle([t.lat, t.lng], {
             color: 'transparent',
             fillColor: '#ef4444',
             fillOpacity: t.corruptionProgress / 300,
             radius: t.radius,
             className: 'pointer-events-none'
         }).addTo(layers.corruption);
      }
    });

    buildings.forEach(b => {
      const def = BUILDING_DEFINITIONS[b.defId];
      let icon;
      if (def.image) {
          const size = 64; 
          icon = L.divIcon({
              className: 'bg-transparent flex justify-center items-end',
              html: `<img src="${def.image}" class="w-16 h-16 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] filter hover:brightness-110 transition-all" alt="${def.name}" />`,
              iconSize: [size, size],
              iconAnchor: [size / 2, size - 5]
          });
      } else {
          const iconHtml = `<div class="text-3xl drop-shadow-[0_0_10px_rgba(255,0,0,0.8)] filter">🏰</div>`;
          icon = L.divIcon({
            className: 'bg-transparent flex justify-center items-center',
            html: iconHtml,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });
      }
      const m = L.marker([b.lat, b.lng], { icon, zIndexOffset: 2000 });
      m.on('click', (e) => {
        if(isPlacementMode) return;
        L.DomEvent.stopPropagation(e);
        onSelectBuilding(b);
      });
      m.addTo(layers.markers);
    });

    sortedTerritories.forEach(t => {
        const hasBuilding = buildings.some(b => Math.abs(b.lat - t.lat) < 0.0001 && Math.abs(b.lng - t.lng) < 0.0001);
        if (hasBuilding) return;
        let emoji = '🏳️';
        if (t.defendingFaction === FactionId.CHURCH_INQUISITION) emoji = '⛪';
        else if (t.defendingFaction === FactionId.VAMPIRE_HUNTERS) emoji = '⚔️';
        else if (t.defendingFaction === FactionId.PEASANT_VILLAGES) emoji = '🛖';
        else if (t.defendingFaction.includes('HOUSE')) emoji = '🦇';
        const icon = L.divIcon({
            className: 'bg-transparent',
            html: `<div class="text-xl opacity-80 drop-shadow-md">${emoji}</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
        const m = L.marker([t.lat, t.lng], { icon });
        m.on('click', (e) => {
             if(isPlacementMode) return;
             L.DomEvent.stopPropagation(e);
             setSelectedTerritory(t);
        });
        m.addTo(layers.markers);
    });

    scoutResults.forEach(s => {
      if (territories.some(t => t.id === s.id)) return;
      const icon = L.divIcon({
        className: 'bg-transparent',
        html: `<div class="text-2xl text-red-500 opacity-70 hover:opacity-100 cursor-pointer animate-bounce">📍</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24]
      });
      const m = L.marker([s.lat, s.lng], { icon });
      m.on('click', (e) => {
          if(isPlacementMode) return;
          L.DomEvent.stopPropagation(e);
          onSelectScout(s);
      });
      m.addTo(layers.markers);
    });

  }, [lat, lng, scoutResults, buildings, isPlacementMode, territories]);

  const handleClaim = () => {
      if (!selectedTerritory) return;
      if (selectedTerritory.defense > 50) {
          initBattle(selectedTerritory.id, 'CONQUER');
          notify("Defenders engaging! Battle Started.");
      } else {
          const res = claimTerritory(selectedTerritory.id);
          useGameStore.getState().addLog({ type: 'Response', action: 'Claim', data: res.message });
          notify(res.message);
      }
  };

  const handleUpgrade = () => {
      if (!selectedTerritory) return;
      const res = upgradeTerritory(selectedTerritory.id);
      useGameStore.getState().addLog({ type: 'Response', action: 'Upgrade', data: res.message });
      notify(res.message);
  };

  const handleAction = (action: TerritoryAction) => {
      if (!selectedTerritory) return;
      if (action === TerritoryAction.RAID && selectedTerritory.defense > 50) {
          initBattle(selectedTerritory.id, 'RAID');
          notify("Garrison alerted! Battle Started.");
      } else {
          const res = performTerritoryAction(selectedTerritory.id, action);
          useGameStore.getState().addLog({ type: 'Response', action, data: res.message });
          notify(res.message);
      }
  };

  const canAffordAction = (action: TerritoryAction): boolean => {
      const r = resources;
      switch(action) {
          case TerritoryAction.FESTIVAL: return (r[ResourceType.GOLD] || 0) >= 200;
          case TerritoryAction.INFRASTRUCTURE: return (r[ResourceType.GOLD] || 0) >= 300;
          case TerritoryAction.RAID: return (r[ResourceType.BLOOD] || 0) >= 20;
          case TerritoryAction.ABDUCT: return (r[ResourceType.BLOOD] || 0) >= 30;
          case TerritoryAction.INFILTRATE: return (r[ResourceType.INFLUENCE] || 0) >= 30;
          case TerritoryAction.GIFT: return (r[ResourceType.OBSIDIAN] || 0) >= 20;
          default: return true;
      }
  };

  const getButtonState = () => {
      if (!selectedTerritory) return null;
      const inf = resources[ResourceType.INFLUENCE] || 0;
      const gold = resources[ResourceType.GOLD] || 0;

      if (selectedTerritory.defendingFaction !== FactionId.PLAYER) {
          const defendingFaction = factions[selectedTerritory.defendingFaction];
          const cost = getClaimCost(TerritoryTier.OUTPOST, selectedTerritory.corruptionProgress, defendingFaction?.relation || 0);
          const canAfford = inf >= cost;
          return { type: 'CLAIM', cost, costGold: 0, canAfford };
      } else {
          const nextTier = selectedTerritory.controlTier + 1;
          const isMax = selectedTerritory.controlTier >= TerritoryTier.DOMINION;
          const cost = TIER_COST[nextTier as TerritoryTier] || 0;
          const costGold = TIER_COST_GOLD[nextTier as TerritoryTier] || 0;
          const canAfford = inf >= cost && gold >= costGold;
          return { type: 'UPGRADE', cost, costGold, canAfford, isMax };
      }
  };

  const btnState = getButtonState();

  const getTerrainIcon = (t: TerrainType) => {
      switch(t) {
          case TerrainType.URBAN: return <GiSpikedWall className="text-yellow-600" />;
          case TerrainType.RURAL: return <GiVillage className="text-green-600" />;
          case TerrainType.WILDERNESS: return <GiForest className="text-emerald-800" />;
          case TerrainType.COASTAL: return <span className="text-blue-500">🌊</span>;
          default: return null;
      }
  };

  const getTerrainLabel = (t: TerrainType) => {
      switch(t) {
          case TerrainType.URBAN: return "Urban (Gold+)";
          case TerrainType.RURAL: return "Rural (Blood+)";
          case TerrainType.WILDERNESS: return "Wilds (Hunt+)";
          case TerrainType.COASTAL: return "Coastal (Trade+)";
          default: return "Unknown";
      }
  };

  return (
    <div className="relative w-full h-full bg-[#0a0a0a] overflow-hidden group">
      <style>{`
        @keyframes playerPulse {
           0% { stroke-opacity: 0.8; stroke-width: 2; fill-opacity: 0.1; }
           50% { stroke-opacity: 1; stroke-width: 4; fill-opacity: 0.15; }
           100% { stroke-opacity: 0.8; stroke-width: 2; fill-opacity: 0.1; }
        }
        .player-territory-pulse path {
           animation: playerPulse 4s infinite ease-in-out;
           stroke: #ef4444 !important;
        }
      `}</style>

      <div ref={mapContainerRef} className="w-full h-full z-[1] bg-black" />
      
      {selectedTerritory && btnState && (
         <div className="absolute bottom-0 left-0 right-0 z-[500] bg-void-900/95 border-t border-void-700 p-4 rounded-t-2xl shadow-2xl backdrop-blur-md animate-[slideUp_0.3s_ease-out] max-h-[60vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-2">
                <div>
                   <h2 className="text-xl font-gothic text-gray-200">{selectedTerritory.name}</h2>
                   <div className="flex flex-wrap gap-2 items-center mt-1">
                       <div className="text-xs text-gray-500 uppercase flex gap-1 items-center bg-black px-2 py-0.5 rounded border border-void-800">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: FACTION_COLORS[selectedTerritory.defendingFaction] }}></span>
                          <span>{selectedTerritory.defendingFaction.replace('HOUSE_', '').replace('_', ' ')}</span>
                       </div>
                       <div className="text-xs text-gray-400 flex gap-1 items-center bg-black px-2 py-0.5 rounded border border-void-800" title="Terrain Type">
                          {getTerrainIcon(selectedTerritory.terrain)}
                          <span>{getTerrainLabel(selectedTerritory.terrain)}</span>
                       </div>
                   </div>
                </div>
                <button onClick={() => setSelectedTerritory(null)} className="text-gray-500 text-xl">✕</button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Corruption</span>
                        <span>{selectedTerritory.corruptionProgress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-void-700">
                        <div 
                            className="h-full bg-red-600 transition-all duration-500" 
                            style={{ width: `${selectedTerritory.corruptionProgress}%` }}
                        />
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Defense</span>
                        <span>{selectedTerritory.defense}</span>
                    </div>
                    <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-void-700">
                        <div 
                            className="h-full bg-blue-600" 
                            style={{ width: `${Math.min(100, (selectedTerritory.defense / 500) * 100)}%` }}
                        />
                    </div>
                </div>
            </div>
            
            {/* ENEMY GARRISON INTEL */}
            {garrisonPreview && (
                <div className="mb-4 bg-red-950/20 rounded border border-red-900/30 p-2">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-1 text-red-400 text-xs font-bold uppercase tracking-wider">
                            <GiMagnifyingGlass /> Enemy Garrison
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                            Str: {formatResource(garrisonPreview.power)}
                        </div>
                    </div>
                    
                    <div className="max-h-24 overflow-y-auto custom-scrollbar space-y-1">
                        {garrisonPreview.army.map((stack) => {
                            const def = UNIT_DEFINITIONS[stack.defId];
                            if(!def) return null;
                            return (
                                <div key={stack.uid} className="flex justify-between items-center bg-black/40 px-2 py-1 rounded border border-void-800 text-xs">
                                    <div className="flex items-center gap-2">
                                        <img src={def.image} className="w-4 h-4 rounded object-cover" alt="" />
                                        <span className="text-gray-300">{def.name}</span>
                                    </div>
                                    <span className="text-red-400 font-bold">{formatResource(stack.count)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {selectedTerritory.defendingFaction !== FactionId.PLAYER ? (
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <button 
                        onClick={() => handleAction(TerritoryAction.RAID)}
                        disabled={!canAffordAction(TerritoryAction.RAID)}
                        className={`bg-void-950 p-2 rounded border border-void-700 flex items-center gap-2 group transition-transform ${!canAffordAction(TerritoryAction.RAID) ? 'opacity-50 cursor-not-allowed' : 'hover:border-red-600 active:scale-95'}`}
                    >
                        <div className="bg-red-900/20 p-1.5 rounded text-red-500"><GiSwordsEmblem /></div>
                        <div className="text-left">
                            <div className="text-xs font-bold text-gray-300">Raid</div>
                            <div className={`text-[9px] ${!canAffordAction(TerritoryAction.RAID) ? 'text-red-500 font-bold' : 'text-red-400'}`}>
                                {selectedTerritory.defense > 50 ? 'BATTLE RISK' : '-20 Blood'}
                            </div>
                        </div>
                    </button>
                    <button 
                        onClick={() => handleAction(TerritoryAction.ABDUCT)}
                        disabled={!canAffordAction(TerritoryAction.ABDUCT)}
                        className={`bg-void-950 p-2 rounded border border-void-700 flex items-center gap-2 group transition-transform ${!canAffordAction(TerritoryAction.ABDUCT) ? 'opacity-50 cursor-not-allowed' : 'hover:border-red-600 active:scale-95'}`}
                    >
                        <div className="bg-red-900/20 p-1.5 rounded text-red-500"><GiManacles /></div>
                        <div className="text-left">
                            <div className="text-xs font-bold text-gray-300">Abduct</div>
                            <div className={`text-[9px] ${!canAffordAction(TerritoryAction.ABDUCT) ? 'text-red-500 font-bold' : 'text-red-400'}`}>-30 Blood</div>
                        </div>
                    </button>
                    <button 
                        onClick={() => handleAction(TerritoryAction.INFILTRATE)}
                        disabled={!canAffordAction(TerritoryAction.INFILTRATE)}
                        className={`bg-void-950 p-2 rounded border border-void-700 flex items-center gap-2 group transition-transform ${!canAffordAction(TerritoryAction.INFILTRATE) ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-600 active:scale-95'}`}
                    >
                        <div className="bg-purple-900/20 p-1.5 rounded text-purple-500"><GiSpy /></div>
                        <div className="text-left">
                            <div className="text-xs font-bold text-gray-300">Infiltrate</div>
                            <div className={`text-[9px] ${!canAffordAction(TerritoryAction.INFILTRATE) ? 'text-red-500 font-bold' : 'text-yellow-500'}`}>-30 Inf</div>
                        </div>
                    </button>
                     <button 
                        onClick={() => handleAction(TerritoryAction.GIFT)}
                        disabled={!canAffordAction(TerritoryAction.GIFT)}
                        className={`bg-void-950 p-2 rounded border border-void-700 flex items-center gap-2 group transition-transform ${!canAffordAction(TerritoryAction.GIFT) ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-600 active:scale-95'}`}
                    >
                        <div className="bg-blue-900/20 p-1.5 rounded text-blue-500"><GiPresent /></div>
                        <div className="text-left">
                            <div className="text-xs font-bold text-gray-300">Dark Gift</div>
                            <div className={`text-[9px] ${!canAffordAction(TerritoryAction.GIFT) ? 'text-red-500 font-bold' : 'text-gray-500'}`}>-20 Obs</div>
                        </div>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <button 
                        onClick={() => handleAction(TerritoryAction.FESTIVAL)}
                        disabled={!canAffordAction(TerritoryAction.FESTIVAL)}
                        className={`bg-void-950 p-2 rounded border border-void-700 flex items-center gap-2 group transition-transform ${!canAffordAction(TerritoryAction.FESTIVAL) ? 'opacity-50 cursor-not-allowed' : 'hover:border-yellow-600 active:scale-95'}`}
                    >
                        <div className="bg-yellow-900/20 p-1.5 rounded text-yellow-500"><GiPartyPopper /></div>
                        <div className="text-left">
                            <div className="text-xs font-bold text-gray-300">Dark Carnival</div>
                            <div className={`text-[9px] ${!canAffordAction(TerritoryAction.FESTIVAL) ? 'text-red-500 font-bold' : 'text-yellow-400'}`}>-200 Gold (+Slaves)</div>
                        </div>
                    </button>
                    <button 
                        onClick={() => handleAction(TerritoryAction.INFRASTRUCTURE)}
                        disabled={!canAffordAction(TerritoryAction.INFRASTRUCTURE)}
                        className={`bg-void-950 p-2 rounded border border-void-700 flex items-center gap-2 group transition-transform ${!canAffordAction(TerritoryAction.INFRASTRUCTURE) ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-500 active:scale-95'}`}
                    >
                        <div className="bg-gray-800 p-1.5 rounded text-gray-400"><GiStoneWall /></div>
                        <div className="text-left">
                            <div className="text-xs font-bold text-gray-300">Fortify</div>
                            <div className={`text-[9px] ${!canAffordAction(TerritoryAction.INFRASTRUCTURE) ? 'text-red-500 font-bold' : 'text-yellow-400'}`}>-300 Gold (+Def)</div>
                        </div>
                    </button>
                </div>
            )}

            <div className="flex gap-2">
                {btnState.type === 'CLAIM' ? (
                    <button 
                        onClick={handleClaim}
                        disabled={!btnState.canAfford}
                        className={`flex-1 py-3 rounded font-bold border flex items-center justify-center gap-2 transition-all group ${
                            btnState.canAfford 
                            ? 'bg-red-900 hover:bg-red-800 text-white border-red-700 active:scale-95 shadow-[0_0_15px_rgba(220,38,38,0.4)]' 
                            : 'bg-void-900 text-gray-500 border-void-800 opacity-50 cursor-not-allowed'
                        }`}
                    >
                        <div className="flex flex-col items-center leading-none">
                            <div className="flex items-center gap-2 uppercase tracking-widest text-sm">
                                 <GiSkullCrossedBones /> {selectedTerritory.defense > 50 ? 'CONQUER' : 'CLAIM'}
                            </div>
                            <div className={`text-[10px] mt-1 font-mono ${btnState.canAfford ? 'text-yellow-500' : 'text-red-500'}`}>
                                 {btnState.canAfford ? 'Cost:' : 'Need:'} {btnState.cost} Influence
                                 {TIER_COST[TerritoryTier.OUTPOST] > btnState.cost && (
                                     <span className="text-green-400 ml-1">
                                         (-{Math.floor((TIER_COST[TerritoryTier.OUTPOST] - btnState.cost)/TIER_COST[TerritoryTier.OUTPOST]*100)}%)
                                     </span>
                                 )}
                            </div>
                        </div>
                    </button>
                ) : (
                    <button 
                        onClick={handleUpgrade}
                        disabled={btnState.isMax || !btnState.canAfford}
                        className={`flex-1 py-3 rounded font-bold border flex items-center justify-center gap-2 transition-all group ${
                            !btnState.isMax && btnState.canAfford 
                            ? 'bg-purple-900 hover:bg-purple-800 text-white border-purple-700 active:scale-95 shadow-[0_0_15px_rgba(147,51,234,0.4)]' 
                            : 'bg-void-900 text-gray-500 border-void-800 opacity-50 cursor-not-allowed'
                        }`}
                    >
                       {btnState.isMax ? (
                           <span>Maximum Dominion</span>
                       ) : (
                            <div className="flex flex-col items-center leading-none">
                                <div className="flex items-center gap-2 uppercase tracking-widest text-sm">
                                    <GiUpgrade /> Expand Dominion
                                </div>
                                <div className={`text-[10px] mt-1 font-mono ${btnState.canAfford ? 'text-purple-300' : 'text-red-500'}`}>
                                     {btnState.canAfford ? 'Cost:' : 'Need:'} {btnState.cost} Inf + {btnState.costGold} Gold
                                </div>
                            </div>
                       )}
                    </button>
                )}
            </div>
         </div>
      )}

      <div className="absolute top-4 left-4 z-[401] pointer-events-none">
        <h2 className="text-2xl font-gothic text-red-600 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-widest uppercase">
          {isPlacementMode ? "Select Lair Site" : "Dominion Map"}
        </h2>
        <div className="text-[10px] text-gray-400 font-mono mt-1">
           {isPlacementMode ? "TAP TO CLAIM RIGA" : "Latvia Region"}
        </div>
      </div>

      {!isPlacementMode && (
          <div className="absolute top-20 left-4 z-[400] bg-black/60 p-2 rounded border border-void-800 backdrop-blur-sm pointer-events-auto">
              <div className="text-[10px] text-gray-400 uppercase mb-1 border-b border-void-700">Factions</div>
              {Object.entries(FACTION_COLORS).map(([id, color]) => {
                  if (id === FactionId.PLAYER && territories.every(t => t.defendingFaction !== FactionId.PLAYER)) return null;
                  return (
                    <div key={id} className="flex items-center gap-2 mb-0.5">
                        <span className="w-2 h-2 rounded-full" style={{backgroundColor: color}}></span>
                        <span className="text-[9px] text-gray-300">{id.replace('HOUSE_', '').split('_')[0]}</span>
                    </div>
                  )
              })}
          </div>
      )}

      {!isPlacementMode && (
          <button 
            onClick={onScout} 
            disabled={isScouting} 
            className={`
            absolute bottom-8 right-6 z-[401] 
            w-16 h-16 rounded-full flex items-center justify-center 
            shadow-[0_0_25px_rgba(220,38,38,0.4)] 
            border-2 border-red-600/50 backdrop-blur-sm
            transition-all duration-300 active:scale-95 hover:border-red-500 hover:shadow-[0_0_35px_rgba(220,38,38,0.6)]
            ${isScouting ? 'bg-black/80 opacity-50' : 'bg-red-950/80 text-white'}
            `}
        >
            <div className={`text-3xl ${isScouting ? 'animate-spin opacity-50' : 'animate-pulse'}`}>
            <GiRadarSweep />
            </div>
        </button>
      )}
    </div>
  );
};
