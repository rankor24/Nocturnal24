
import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { GiSecretBook } from '../../lib/icons';

interface LogModalProps {
    onClose: () => void;
}

export const LogModal = ({ onClose }: LogModalProps) => {
    const logs = useGameStore(s => s.logs);

    return (
        <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#0f0f10] w-full max-w-4xl h-[80vh] border border-void-700 rounded-lg flex flex-col shadow-2xl font-mono text-xs overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-3 border-b border-void-700 bg-void-900">
                    <h3 className="text-red-500 font-bold uppercase tracking-wider flex items-center gap-2">
                        <GiSecretBook /> Forbidden Knowledge
                    </h3>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="text-gray-500 hover:text-white px-2 text-xl">✕</button>
                    </div>
                </div>
                
                {/* Log List */}
                <div className="flex-1 overflow-auto p-4 space-y-4">
                    {logs.length === 0 && <div className="text-gray-600 italic text-center mt-10">The grimoire is empty...</div>}
                    {logs.map(log => (
                        <div key={log.id} className="border-l-2 border-void-700 pl-3 py-1 hover:border-red-900 transition-colors">
                            <div className="flex gap-2 mb-1">
                                <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                <span className={`font-bold uppercase ${
                                    log.type === 'Request' ? 'text-blue-400' : 
                                    log.type === 'Error' ? 'text-red-500' : 'text-green-400'
                                }`}>{log.type}</span>
                                <span className="text-gray-300">:: {log.action}</span>
                            </div>
                            <div className="bg-black/50 p-2 rounded overflow-x-auto text-gray-400 whitespace-pre-wrap font-mono max-h-40 scrollbar-thin scrollbar-thumb-void-700">
                                {JSON.stringify(log.data, null, 2)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
