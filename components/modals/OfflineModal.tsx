
import React from 'react';

interface OfflineModalProps {
    report: string;
    onClose: () => void;
}

export const OfflineModal = ({ report, onClose }: OfflineModalProps) => {
    return (
        <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-void-900 border border-red-900 p-6 rounded-lg max-w-sm w-full text-center shadow-[0_0_30px_rgba(220,38,38,0.3)]">
            <h2 className="font-gothic text-2xl text-red-500 mb-4">The Long Night Ends</h2>
            <div className="text-gray-300 whitespace-pre-wrap mb-6 font-mono text-sm">{report}</div>
            <button 
                onClick={onClose}
                className="w-full bg-red-900 hover:bg-red-800 text-white py-2 rounded font-bold border border-red-700"
            >
                AWAKEN
            </button>
            </div>
        </div>
    );
};
