
import React, { useEffect, useState, useRef } from 'react';

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
    const railRef = useRef<HTMLDivElement>(null);
    const [progress, setProgress] = useState(0);
    const isDragging = useRef(false);
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
            if (isDragging.current) return;
            const { scrollTop, scrollHeight, clientHeight } = container;
            const scrollRange = scrollHeight - clientHeight;
            const currentProgress = (scrollTop / scrollRange) * 100;
            setProgress(currentProgress);
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [containerRef]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent text selection
        e.stopPropagation();

        isDragging.current = true;
        const container = containerRef.current;
        const rail = railRef.current;

        if (!container || !rail) return;

        const handleMouseMove = (mvEvent: MouseEvent) => {
            const railRect = rail.getBoundingClientRect();
            const relativeY = mvEvent.clientY - railRect.top;
            const ratio = Math.max(0, Math.min(1, relativeY / railRect.height));

            const scrollRange = container.scrollHeight - container.clientHeight;
            container.scrollTop = ratio * scrollRange;

            // Update visual progress immediately
            setProgress(ratio * 100);
        };

        const handleMouseUp = () => {
            isDragging.current = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            // Re-enable pointer events if we disabled them anywhere
            document.body.style.userSelect = '';
        };

        document.body.style.userSelect = 'none'; // Force no selection
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        // Initial move to jump to click position if clicking rail
        // const railRect = rail.getBoundingClientRect();
        // const relativeY = e.clientY - railRect.top;
        // handleMouseMove(e.nativeEvent);
    };

    return (
        <div
            ref={railRef}
            className="absolute right-4 top-8 bottom-8 w-1.5 bg-stone-200/50 rounded-full z-10 hidden sm:block cursor-pointer hover:bg-stone-200 transition-colors"
            onMouseDown={handleMouseDown}
        >
            {/* Progress Bar (Visual only) */}
            <div
                className="absolute top-0 left-0 w-full bg-stone-300 rounded-full transition-all duration-75 ease-out pointer-events-none"
                style={{ height: `${progress}%` }}
            />

            {/* Draggable Thumb */}
            <div
                className="absolute left-1/2 w-4 h-4 bg-stone-900 rounded-full shadow-md cursor-grab active:cursor-grabbing hover:scale-125 transition-transform z-20"
                style={{
                    top: `${progress}%`,
                    transform: 'translate(-50%, -50%)'
                }}
            />

            {/* Markers */}
            {markers.map((marker) => (
                <div
                    key={marker.id}
                    className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full border border-stone-50 pointer-events-none
                        ${marker.type === 'chapter' ? 'bg-stone-400' : ''}
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
