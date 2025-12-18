
import React, { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface SpeedBumpProps {
    children: React.ReactNode;
    onUnlock?: (reflection: string) => void;
}

export function SpeedBump({ children, onUnlock }: SpeedBumpProps) {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [reflection, setReflection] = useState('');

    const handleUnlock = () => {
        if (reflection.length > 10) {
            setIsUnlocked(true);
            if (onUnlock) onUnlock(reflection);
        }
    };

    return (
        <div className="my-8 border-y-2 border-stone-100 py-8 relative group">
            {!isUnlocked && (
                <div className="absolute inset-0 z-30 backdrop-blur-[2px] bg-white/60 flex flex-col items-center justify-center p-6 text-center transition-all">
                    <div className="bg-white p-6 rounded-xl shadow-xl border border-stone-200 max-w-md w-full">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-600 mb-4 mx-auto">
                            <AlertCircle size={24} />
                        </div>
                        <h3 className="font-serif font-bold text-lg text-stone-800 mb-2">Wait! Check In.</h3>
                        <p className="text-sm text-stone-600 mb-4 font-sans">
                            Before continuing, summarize the main idea of the section you just read.
                        </p>
                        <textarea
                            value={reflection}
                            onChange={(e) => setReflection(e.target.value)}
                            placeholder="The main point was..."
                            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg text-sm font-serif mb-4 focus:ring-2 focus:ring-amber-200 outline-none"
                            rows={3}
                        />
                        <button
                            onClick={handleUnlock}
                            disabled={reflection.length <= 10}
                            className="w-full py-2 bg-stone-800 text-white rounded-lg font-bold text-sm disabled:opacity-50 hover:bg-stone-700 transition-colors"
                        >
                            Unlock Next Section
                        </button>
                    </div>
                </div>
            )}

            <div className={`transition-all duration-700 ${isUnlocked ? 'opacity-100' : 'opacity-20 blur-sm select-none'}`}>
                {children}
            </div>

            {isUnlocked && (
                <div className="absolute top-0 right-0 -mt-3 mr-4 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1 shadow-sm">
                    <CheckCircle size={12} />
                    Check-in Complete
                </div>
            )}
        </div>
    );
}
