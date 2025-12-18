import { useState, useEffect, useCallback, useRef } from 'react';

interface TextReaderState {
    isReading: boolean;
    highlightRect: DOMRect | null;
    cancel: () => void;
    speak: (contentElement: HTMLElement, langCode?: string) => void;
}

export function useTextReader(): TextReaderState {
    const [isReading, setIsReading] = useState(false);
    const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            synthRef.current = window.speechSynthesis;
        }
        return () => {
            synthRef.current?.cancel();
        };
    }, []);

    const cancel = useCallback(() => {
        synthRef.current?.cancel();
        setIsReading(false);
        setHighlightRect(null);
    }, []);

    const speak = useCallback((contentElement: HTMLElement, langCode: string = 'en') => {
        if (!synthRef.current) return;

        // 1. Cancel any existing speech
        synthRef.current.cancel();
        setIsReading(true);

        // 2. Extract plain text and map text nodes
        const textNodes: Text[] = [];
        const walker = document.createTreeWalker(contentElement, NodeFilter.SHOW_TEXT);
        let currentNode = walker.nextNode();
        while (currentNode) {
            if (currentNode.textContent?.trim()) {
                textNodes.push(currentNode as Text);
            }
            currentNode = walker.nextNode();
        }

        const fullText = textNodes.map(n => n.textContent).join(' ');

        // 3. Create Utterance
        const utterance = new SpeechSynthesisUtterance(fullText);
        utteranceRef.current = utterance;

        // Select voice matching langCode
        const voices = synthRef.current.getVoices();

        // Prioritize "Microsoft" voices (or local voices) because they reliably fire "boundary" events 
        // needed for highlighting. "Google" voices often silently fail to fire these events.
        const voice =
            voices.find(v => v.lang.startsWith(langCode) && v.name.includes("Microsoft")) ||
            voices.find(v => v.lang.startsWith(langCode)) ||
            voices.find(v => v.lang.startsWith('en') && v.name.includes("Microsoft")) ||
            voices.find(v => v.lang.startsWith('en')) ||
            voices[0];

        if (voice) utterance.voice = voice;

        // 4. Handle "Boundary" events to paint the highlight
        utterance.onboundary = (event) => {
            if (event.name !== 'word') return;

            const charIndex = event.charIndex;

            // Find which text node corresponds to this character index
            let runningLength = 0;
            let targetNode: Text | null = null;
            let startOffset = 0;

            for (let i = 0; i < textNodes.length; i++) {
                const node = textNodes[i];
                const nodeLength = node.textContent?.length || 0;

                // Account for the space added during join(' ')
                // If it's not the last node, we added 1 char (space)
                const segmentLength = nodeLength + (i < textNodes.length - 1 ? 1 : 0);

                if (runningLength + segmentLength > charIndex) {
                    targetNode = node;
                    startOffset = charIndex - runningLength;
                    // If startOffset lands exactly on the added space (index == nodeLength), clamp it
                    if (startOffset >= nodeLength) {
                        startOffset = nodeLength;
                    }
                    break;
                }
                runningLength += segmentLength;
            }

            if (targetNode) {
                try {
                    // Create a range to measure the word's position
                    const range = document.createRange();
                    // Find the next space or end of node to define word end
                    const textContent = targetNode.textContent || "";
                    let endOffset = textContent.indexOf(' ', startOffset);
                    if (endOffset === -1) endOffset = textContent.length;

                    range.setStart(targetNode, startOffset);
                    range.setEnd(targetNode, endOffset);

                    const rect = range.getBoundingClientRect();
                    setHighlightRect(rect);
                } catch (e) {
                    console.warn("Highlight syncing skipped for current word");
                }
            }
        };

        utterance.onend = () => {
            setIsReading(false);
            setHighlightRect(null);
        };

        synthRef.current.speak(utterance);
    }, []);

    return { isReading, highlightRect, cancel, speak };
}
