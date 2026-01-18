import React, { useMemo } from 'react';
import { AnnotationData } from '@/types';

interface HeatmapOverlayProps {
    content: string;
    annotations: AnnotationData[];
    onPhraseClick?: (phrase: string, annotations: AnnotationData[]) => void;
}

export function HeatmapOverlay({ content, annotations, onPhraseClick }: HeatmapOverlayProps) {
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
            // Calculate "Heat": 1 = 30% (visible), 5+ = 100% opacity of a red/orange color
            const intensity = Math.min(Math.max(count * 0.2, 0.3), 1);
            const color = `rgba(255, 100, 100, ${intensity})`; // Red heatmap

            const cleanPhrase = phrase.trim();
            if (!cleanPhrase) return;

            // Flexible Regex Construction:
            // 1. Split into pure alphanumeric tokens to handle any punctuation/formatting variance
            // e.g. "don't" -> ["don", "t"], "Hello, world" -> ["Hello", "world"]
            const tokens = cleanPhrase.match(/[a-zA-Z0-9]+/g);

            if (!tokens || tokens.length === 0) {
                // Fallback for symbols-only annotations if strictly necessary
                return;
            }

            // 2. The "Separator Pattern" matches the "glue" between words.
            // It allows:
            // - Whitespace/Punctuation (non-alphanumeric, non-tag chars)
            // - HTML Tags (<...>)
            // - HTML Entities (&...;)
            // We match *zero or more* of these groups to allow words to touch or be far apart.
            const separatorPattern = '(?:[^a-zA-Z0-9<>&]+|<[^>]+>|&[a-zA-Z0-9#]+;)*';

            // 3. Join tokens with the separator, forcing word boundaries on tokens to avoid partial matches
            // e.g. \bThe\b ... \bEnd\b
            const pattern = tokens.map(t => `\\b${t}\\b`).join(separatorPattern);

            const regex = new RegExp(pattern, 'g');

            // Encode phrase for data attribute to be safe
            const safePhrase = encodeURIComponent(phrase);

            html = html.replace(regex, (match) =>
                `<span 
                    data-phrase="${safePhrase}" 
                    style="background-color: ${color}; border-bottom: 2px solid rgba(255,0,0,${intensity}); cursor: pointer;" 
                    title="${count} students commented here. Click to view."
                    class="heatmap-highlight hover:brightness-90 transition-all"
                >${match}</span>`
            );
        });

        return html;
    }, [content, annotations]);

    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
        const target = e.target as HTMLElement;
        // Check if we clicked a heatmap span
        const phraseEncoded = target.getAttribute('data-phrase');
        if (phraseEncoded) {
            const phrase = decodeURIComponent(phraseEncoded);
            // Find all annotations matching this phrase
            const matches = annotations.filter(a => a.text.trim() === phrase);
            onPhraseClick?.(phrase, matches);
        }
    };

    return (
        <article
            className="prose prose-stone prose-lg max-w-none font-serif leading-relaxed select-text"
            dangerouslySetInnerHTML={{ __html: processContent }}
            onClick={handleClick}
        />
    );
}

// Utility to escape regex characters
function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
