import React, { useMemo } from 'react';
import { AnnotationData } from '@/types';

interface HeatmapOverlayProps {
    content: string;
    annotations: AnnotationData[];
}

export function HeatmapOverlay({ content, annotations }: HeatmapOverlayProps) {
    // This is a simplified "Heatmap" that actually just highlights annotated text.
    // For a real gradient heatmap, we'd need complex text-range counting.
    // MVP: Wrap found text occurrences in a highlight span with opacity based on frequency.

    const processContent = useMemo(() => {
        if (!annotations || annotations.length === 0) return content;

        // 1. Identify all text segments and count frequency
        const counts: Record<string, number> = {};
        annotations.forEach(a => {
            const cleanText = a.text.trim();
            counts[cleanText] = (counts[cleanText] || 0) + 1;
        });

        // 2. Sort by length descending to replace longest matches first (prevent nesting issues mostly)
        const sortedPhrases = Object.keys(counts).sort((a, b) => b.length - a.length);

        // 3. Replace text with styled spans
        // WARNING: This is a fragile "Find and Replace" strategy. 
        // Real production apps use offset-based highlighting, but that requires storing offsets.
        // For this MVP, string matching is acceptable but has pitfalls (e.g. repeated words).

        let html = content;

        // We use a placeholder approach to avoid replacing sticking inside already replaced tags
        // But for MVP let's trust simple replacement for distinct phrases.
        sortedPhrases.forEach(phrase => {
            const count = counts[phrase];
            // Calculate "Heat": 1 = 20%, 5+ = 100% opacity of a red/orange color
            const intensity = Math.min(count * 0.2, 1);
            const color = `rgba(255, 100, 100, ${intensity})`; // Red heatmap

            const regex = new RegExp(escapeRegExp(phrase), 'g');
            html = html.replace(regex, (match) =>
                `<span style="background-color: ${color}; border-bottom: 2px solid rgba(255,0,0,${intensity}); cursor: help;" title="${count} annotations">${match}</span>`
            );
        });

        return html;
    }, [content, annotations]);

    return (
        <article
            className="prose prose-stone prose-lg max-w-none font-serif leading-relaxed"
            dangerouslySetInnerHTML={{ __html: processContent }}
        />
    );
}

// Utility to escape regex characters
function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
