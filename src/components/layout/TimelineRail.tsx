
import React, { useEffect, useState } from 'react';

interface Marker {
    id: string;
    position: number; // Percentage (0-100)
    type: 'chapter' | 'annotation' | 'clue';
    label?: string;
}

interface TimelineRailProps {
    containerRef: React.RefObject<HTMLDivElement | null>;
}

export function TimelineRail({ containerRef }: TimelineRailProps) {
    const [progress, setProgress] = useState(0);
    // Mock markers for now
    const markers: Marker[] = [
        { id: '1', position: 10, type: 'chapter', label: 'Intro' },
        { id: '2', position: 45, type: 'annotation', label: 'Note 1' },
        { id: '3', position: 80, type: 'annotation', label: 'Note 2' },
    ];

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const scrollRange = scrollHeight - clientHeight;
            const currentProgress = (scrollTop / scrollRange) * 100;
            setProgress(currentProgress);
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [containerRef]);

    return (
        <div className="absolute right-4 top-8 bottom-8 w-1.5 bg-stone-200/50 rounded-full z-10 hidden sm:block">
            {/* Progress Indicator */}
            <div
                className="absolute top-0 left-0 w-full bg-stone-400/80 rounded-full transition-all duration-150 ease-out"
                style={{ height: `${progress}%` }}
            />

            {/* Markers */}
            {markers.map((marker) => (
                <div
                    key={marker.id}
                    className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-stone-50 transition-transform hover:scale-150 cursor-pointer
            ${marker.type === 'chapter' ? 'bg-stone-800 w-4 h-4' : ''}
            ${marker.type === 'annotation' ? 'bg-yellow-400' : ''}
            ${marker.type === 'clue' ? 'bg-blue-400' : ''}
          `}
                    style={{ top: `${marker.position}%` }}
                    title={marker.label}
                />
            ))}
        </div>
    );
}
