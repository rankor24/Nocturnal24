



import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { useGameStore } from './store/gameStore';
import { useTerritoryStore } from './store/territoryStore';
import { GiCastle, GiBatWing, GiCrownCoin, GiRadarSweep, GiSecretBook, GiScrollUnfurled, GiSkullCrossedBones, GiSwordsEmblem } from './lib/icons';

// Components
import { ResourceDisplay } from './components/ResourceDisplay';
import { GameInitializer } from './components/GameInitializer';
import { LogModal } from './components/modals/LogModal';
import { OfflineModal } from './components/modals/OfflineModal';
import { BattleModal } from './components/modals/BattleModal';
import { LairTab } from './components/LairTab';
import { ArmyTab } from './components/ArmyTab';
import { CourtTab } from './components/CourtTab';
import { MapTab } from './components/MapTab';
import { ResearchTab } from './components/ResearchTab';
import { MercenaryTab } from './components/MercenaryTab';

const App = () => {
  const gameState = useGameStore();
  const [activeTab, setActiveTab] = useState('LAIR');
  const [notif, setNotif] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [offlineReport, setOfflineReport] = useState<string | null>(null);

  // Auto-init location if missing (fallback)
  useEffect(() => {
    if (!gameState.location) {
        const defLat = 56.946;
        const defLng = 24.105;
        gameState.setLocation(defLat, defLng);
    }
  }, []);

  const notify = useCallback((msg: string) => { 
      setNotif(msg); 
      setTimeout(() => setNotif(null), 3000); 
  }, []);

  const handleReset = () => {
      gameState.resetGame();
  };

  const hasMercenaryTech = gameState.researchedTechs.includes('mercenary_contracts');

  return (
    <div className="h-[100dvh] bg-black text-gray-200 font-sans pb-safe selection:bg-red-900 overflow-hidden flex flex-col">
      <GameInitializer onReport={setOfflineReport} />
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 flex-none">
        <div className="bg-black/95 p-2 flex justify-between items-center border-b border-red-900">
          <h1 className="font-gothic text-xl text-red-600 tracking-widest drop-shadow-red">NOCTURNAL</h1>
          <div className="flex flex-col items-end">
              <div className="text-xs font-bold text-gray-400">Vampire Lord</div>
              <div className="text-[10px] text-gray-600">Lv.{gameState.playerLevel}</div>
          </div>
        </div>
        <ResourceDisplay />
      </header>

      {/* GLOBAL ACTIONS */}
      <div className="fixed top-[70px] right-2 z-[1000] flex flex-col gap-2">
          <button 
            onClick={() => setShowLogs(true)}
            className="bg-black/80 text-gray-400 p-2 rounded-full border border-void-700 hover:text-white hover:border-red-500 transition-all shadow-lg"
            title="Grimoire (System Logs)"
          >
            <GiSecretBook className="text-xl" />
          </button>
          
          <button 
            onClick={() => setShowResetConfirm(true)}
            className="bg-black/80 text-red-500 p-2 rounded-full border border-red-900/50 hover:bg-red-950 hover:text-red-400 hover:border-red-500 transition-all shadow-lg"
            title="Reincarnate (Reset Game)"
          >
            <GiSkullCrossedBones className="text-xl" />
          </button>
      </div>

      {/* MODALS */}
      {offlineReport && <OfflineModal report={offlineReport} onClose={() => setOfflineReport(null)} />}
      {showLogs && <LogModal onClose={() => setShowLogs(false)} />}
      <BattleModal />
      
      {/* RESET CONFIRMATION */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-void-900 border border-red-900 p-6 rounded-lg max-w-sm w-full text-center shadow-[0_0_30px_rgba(220,38,38,0.3)]">
                <h2 className="font-gothic text-2xl text-red-500 mb-4">End This Dominion?</h2>
                <p className="text-gray-400 text-sm mb-6">
                    Are you sure you wish to abandon this timeline? All progress, territories, and armies will be lost forever.
                </p>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setShowResetConfirm(false)}
                        className="flex-1 bg-void-800 hover:bg-void-700 text-gray-300 py-2 rounded border border-void-600"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleReset}
                        className="flex-1 bg-red-900 hover:bg-red-800 text-white py-2 rounded font-bold border border-red-700 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                    >
                        RESET
                    </button>
                </div>
            </div>
        </div>
      )}
      
      {/* TOAST */}
      {notif && <div className="fixed top-36 left-1/2 -translate-x-1/2 bg-void-800 border border-red-500 px-4 py-2 rounded z-[1000] shadow-2xl text-center min-w-[200px] text-sm animate-pulse">{notif}</div>}
      
      {/* MAIN CONTENT */}
      <main className="flex-1 relative bg-[#050505] min-h-0">
        {activeTab === 'LAIR' && <LairTab notify={notify} setActiveTab={setActiveTab} />}
        {activeTab === 'ARMY' && <ArmyTab notify={notify} />}
        {activeTab === 'COURT' && <CourtTab notify={notify} />}
        {activeTab === 'MAP' && <MapTab notify={notify} setActiveTab={setActiveTab} />}
        {activeTab === 'TECH' && <ResearchTab notify={notify} />}
        {activeTab === 'MERC' && <MercenaryTab notify={notify} />}
      </main>

      {/* NAVIGATION */}
      <nav className="flex-none bg-black border-t border-void-800 flex justify-between px-2 py-2 pb-safe z-50 h-16 overflow-x-auto no-scrollbar">
        <button onClick={() => setActiveTab('LAIR')} className={`flex flex-col items-center justify-center min-w-[50px] ${activeTab === 'LAIR' ? 'text-red-500' : 'text-gray-600'}`}>
          <GiCastle className="text-2xl mb-1" />
          <span className="text-[10px]">Dominion</span>
        </button>
        <button onClick={() => setActiveTab('TECH')} className={`flex flex-col items-center justify-center min-w-[50px] ${activeTab === 'TECH' ? 'text-red-500' : 'text-gray-600'}`}>
          <GiScrollUnfurled className="text-2xl mb-1" />
          <span className="text-[10px]">Library</span>
        </button>
        <button onClick={() => setActiveTab('ARMY')} className={`flex flex-col items-center justify-center min-w-[50px] ${activeTab === 'ARMY' ? 'text-red-500' : 'text-gray-600'}`}>
          <GiBatWing className="text-2xl mb-1" />
          <span className="text-[10px]">Army</span>
        </button>
        
        {hasMercenaryTech && (
          <button onClick={() => setActiveTab('MERC')} className={`flex flex-col items-center justify-center min-w-[50px] ${activeTab === 'MERC' ? 'text-yellow-500' : 'text-gray-600'}`}>
            <GiSwordsEmblem className="text-2xl mb-1" />
            <span className="text-[10px]">Mercs</span>
          </button>
        )}

        <button onClick={() => setActiveTab('COURT')} className={`flex flex-col items-center justify-center min-w-[50px] ${activeTab === 'COURT' ? 'text-red-500' : 'text-gray-600'}`}>
          <GiCrownCoin className="text-2xl mb-1" />
          <span className="text-[10px]">Court</span>
        </button>
        <button onClick={() => setActiveTab('MAP')} className={`flex flex-col items-center justify-center min-w-[50px] ${activeTab === 'MAP' ? 'text-red-500' : 'text-gray-600'}`}>
          <GiRadarSweep className="text-2xl mb-1" />
          <span className="text-[10px]">Map</span>
        </button>
      </nav>
      
      <style>{`
        @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #000;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
