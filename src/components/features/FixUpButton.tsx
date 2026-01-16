
import React, { useState } from 'react';
import { LifeBuoy, RefreshCcw, Search, ArrowRight, X } from 'lucide-react';

export function FixUpButton() {
    const [isOpen, setIsOpen] = useState(false);

    const strategies = [
        { icon: RefreshCcw, label: "Re-read previous sentence", color: "text-blue-600 bg-blue-50 hover:bg-blue-100" },
        { icon: Search, label: "Look up unknown word", color: "text-purple-600 bg-purple-50 hover:bg-purple-100" },
        { icon: ArrowRight, label: "Read ahead for context", color: "text-orange-600 bg-orange-50 hover:bg-orange-100" }
    ];

    return (
        <div className="fixed bottom-8 right-8 z-40 lg:absolute lg:bottom-8 lg:right-8">
            {isOpen && (
                <div className="absolute bottom-14 right-0 mb-2 w-64 bg-white rounded-lg shadow-xl border border-stone-200 p-4 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-2">
                        <h3 className="font-sans font-bold text-sm text-stone-700">Fix-Up Strategies</h3>
                        <button onClick={() => setIsOpen(false)} className="text-stone-400 hover:text-stone-600">
                            <X size={14} />
                        </button>
                    </div>
                    <div className="space-y-2">
                        {strategies.map((strat, idx) => (
                            <button
                                key={idx}
                                className={`w-full flex items-center gap-3 p-2 rounded-md transition-colors text-left ${strat.color}`}
                                onClick={() => {
                                    // In a real app, this might trigger specific actions or logging
                                    setIsOpen(false);
                                }}
                            >
                                <strat.icon size={16} className="shrink-0" />
                                <span className="text-xs font-semibold font-sans">{strat.label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="mt-3 text-[10px] text-stone-400 font-serif italic text-center">
                        Select a strategy to get unstuck.
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-300 font-bold text-sm border ${isOpen
                        ? 'bg-stone-800 text-white border-stone-800 rotate-0'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300 hover:shadow-xl'
                    }`}
            >
                <LifeBuoy size={18} className={isOpen ? "animate-spin-slow" : ""} />
                {isOpen ? "Close Help" : "I'm Stuck"}
            </button>
        </div>
    );
}
