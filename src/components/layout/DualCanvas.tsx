
"use client";

import React, { useState, useRef } from 'react';
import { TopNav } from './TopNav';
import { TimelineRail } from './TimelineRail';
import { EyeOff } from 'lucide-react';

interface DualCanvasProps {
    children: React.ReactNode;
    sidebar: React.ReactNode;
    isBlurred?: boolean;
}

export function DualCanvas({ children, sidebar, isBlurred = false }: DualCanvasProps) {
    const [isFocused, setIsFocused] = useState(false);
    const mainScrollRef = useRef<HTMLDivElement>(null);

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            <TopNav isFocused={isFocused} onToggleFocus={() => setIsFocused(!isFocused)} />

            {/* Focus Mode Exit Button (Floating when focused) */}
            <button
                onClick={() => setIsFocused(false)}
                className={`fixed top-4 right-8 z-50 p-2 bg-stone-800/10 hover:bg-stone-800/20 rounded-full text-stone-600 transition-all duration-500 ${isFocused ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0'}`}
                title="Exit Deep Work"
            >
                <EyeOff size={20} />
            </button>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Primary Text Area (Left) */}
                <main
                    ref={mainScrollRef}
                    className={`flex-1 overflow-y-auto p-8 sm:p-12 lg:p-16 max-w-4xl mx-auto scroll-smooth transition-all duration-700 relative text-rendering-optimizeLegibility no-scrollbar ${isFocused ? 'scale-105' : 'scale-100'} ${isBlurred ? 'blur-md pointer-events-none' : ''}`}
                >
                    <TimelineRail containerRef={mainScrollRef} />
                    <div className={`prose prose-lg prose-stone mx-auto transition-opacity duration-700 ${isFocused ? 'opacity-100' : 'opacity-100'}`}>
                        {children}
                    </div>
                </main>

                {/* Thinking Sidebar (Right) */}
                <aside className={`w-80 lg:w-96 border-l border-stone-200 bg-sidebar p-6 flex flex-col h-full overflow-y-auto shadow-inner transition-all duration-500 ${isFocused ? 'grayscale opacity-60 hover:grayscale-0 hover:opacity-100' : ''}`}>
                    {sidebar}
                </aside>
            </div>
        </div>
    );
}
