
import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { ResourceType } from '../types';
import { RES_ICONS, RES_COLORS } from '../lib/icons';
import { formatResource } from '../lib/resourceUtils';

export const ResourceDisplay = () => {
  const resources = useGameStore(s => s.resources);
  const details = useGameStore(s => s.ratesDetails);
  // Added GOLD to important resources
  const important = [ResourceType.BLOOD, ResourceType.GOLD, ResourceType.SLAVES, ResourceType.SOULS, ResourceType.INFLUENCE];
  
  const [tooltip, setTooltip] = useState<{res: ResourceType, rect: DOMRect} | null>(null);

  const handleEnter = (res: ResourceType, e: React.MouseEvent) => {
      setTooltip({ res, rect: e.currentTarget.getBoundingClientRect() });
  };
  
  const handleLeave = () => {
      setTooltip(null);
  };

  const renderTooltip = () => {
      if (!tooltip) return null;
      const { res, rect } = tooltip;
      const detail = details[res] || { net: 0, production: [], consumption: [] };
      const val = resources[res] || 0;
      const name = res.charAt(0) + res.slice(1).toLowerCase().replace(/_/g, ' ');

      // Position: Centered horizontally relative to target, positioned below
      const left = rect.left + (rect.width / 2);
      const top = rect.bottom + 8; // 8px buffer

      return (
        <div 
            className="fixed z-[9999] bg-void-950 border border-void-700 p-2 rounded shadow-xl whitespace-nowrap min-w-[150px] text-center pointer-events-none"
            style={{ 
                top: top, 
                left: left, 
                transform: 'translateX(-50%)' 
            }}
        >
            <div className="text-xs font-bold text-gray-200 mb-1 border-b border-void-800 pb-1">{name}</div>
            
            <div className="text-[10px] text-gray-400 mb-2">
                Stock: <span className="text-white font-mono">{Math.floor(val).toLocaleString()}</span>
            </div>

            {/* Breakdown */}
            {(detail.production.length > 0 || detail.consumption.length > 0) ? (
                <div className="text-[9px] space-y-0.5 text-left mb-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {detail.production.map((p, i) => (
                        <div key={`p-${i}`} className="flex justify-between gap-4 text-green-400">
                            <span>{p.name}</span>
                            <span className="font-mono">+{p.rate.toFixed(1)}/s</span>
                        </div>
                    ))}
                    {detail.consumption.map((c, i) => (
                        <div key={`c-${i}`} className="flex justify-between gap-4 text-red-400">
                            <span>{c.name}</span>
                            <span className="font-mono">-{c.rate.toFixed(1)}/s</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-[9px] text-gray-600 italic mb-2">No active production flow</div>
            )}

            <div className="border-t border-void-800 pt-1 flex justify-between font-bold text-[10px]">
                <span className="text-gray-400">Net Rate</span>
                <span className={detail.net >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {detail.net > 0 ? '+' : ''}{detail.net.toFixed(2)}/s
                </span>
            </div>
        </div>
      );
  };

  return (
    <div className="bg-void-900/90 border-b border-void-800 backdrop-blur-md relative z-50">
       {/* Primary Resources Grid - Expanded to 5 columns */}
       <div className="grid grid-cols-5 gap-1 p-2 border-b border-void-800">
          {important.map(res => {
            const Icon = RES_ICONS[res];
            const val = resources[res] || 0;
            const rate = details[res]?.net || 0;
            const name = res.charAt(0) + res.slice(1).toLowerCase().replace('_', ' ');

            return (
              <div 
                key={res} 
                className="flex flex-col items-center justify-center p-1 relative cursor-help"
                onMouseEnter={(e) => handleEnter(res, e)}
                onMouseLeave={handleLeave}
              >
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">
                    {name}
                </div>
                <div className="flex items-center gap-1">
                   <Icon className={`${RES_COLORS[res]} text-sm`} />
                   <span className="font-bold text-sm text-gray-200">{formatResource(val)}</span>
                </div>
                <span className={`text-[10px] ${rate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {rate > 0 ? '+' : ''}{rate.toFixed(1)}/s
                </span>
              </div>
            )
          })}
       </div>

       {/* Secondary Resources Scroll */}
       <div className="flex overflow-x-auto gap-3 p-2 no-scrollbar">
          {Object.values(ResourceType).filter(r => !important.includes(r)).map(res => {
             const Icon = RES_ICONS[res];
             const val = resources[res] || 0;
             const rate = details[res]?.net || 0;
             // Only hide if 0 and no rate
             if (val < 1 && Math.abs(rate) < 0.01) return null;
             
             return (
               <div 
                 key={res} 
                 className="flex-shrink-0 flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded border border-void-700 min-w-[80px] cursor-help"
                 onMouseEnter={(e) => handleEnter(res, e)}
                 onMouseLeave={handleLeave}
               >
                  <Icon className={`${RES_COLORS[res]} text-base`} />
                  <div className="flex flex-col leading-none">
                     <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">{res.replace(/_/g, ' ')}</span>
                     <div className="flex items-baseline gap-1">
                        <span className="text-sm text-gray-200 font-bold">{formatResource(val)}</span>
                        {Math.abs(rate) > 0.01 && <span className={`text-[9px] ${rate > 0 ? 'text-green-500' : 'text-red-500'}`}>{rate > 0 ? '+' : ''}{rate.toFixed(1)}</span>}
                     </div>
                  </div>
               </div>
             )
          })}
       </div>
       
       {renderTooltip()}
    </div>
  );
};
