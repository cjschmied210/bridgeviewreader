
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, HelpCircle, Book, User } from 'lucide-react';
import { AnnotationData, ReciprocalRole } from '@/types';

interface TextAnnotatorProps {
    children: React.ReactNode;
    onAnnotate: (annotation: AnnotationData) => void;
    focusedAnnotationId?: string | null;
    userRole?: ReciprocalRole;
}

export function TextAnnotator({ children, onAnnotate, focusedAnnotationId, userRole, annotations = [] }: TextAnnotatorProps & { annotations?: AnnotationData[] }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selection, setSelection] = useState<{
        text: string;
        rect: DOMRect;
    } | null>(null);
    const [showPopup, setShowPopup] = useState(false);
    const [note, setNote] = useState('');
    const [selectedTag, setSelectedTag] = useState<AnnotationData['tag']>("I'm confused");

    const [currentHighlight, setCurrentHighlight] = useState<HTMLElement | null>(null);

    // Handle focusing an annotation from outside (e.g. sidebar click)
    useEffect(() => {
        if (!focusedAnnotationId || !containerRef.current) return;

        const highlightEl = containerRef.current.querySelector(`[data-annotation-id="${focusedAnnotationId}"]`);
        if (highlightEl) {
            // 1. Scroll into view
            highlightEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // 2. Add permanent visual cue (active state)
            const activeClasses = ['!bg-yellow-400', 'ring-2', 'ring-yellow-600', 'ring-offset-1', 'z-10', 'relative'];
            highlightEl.classList.add(...activeClasses);

            return () => {
                highlightEl.classList.remove(...activeClasses);
            };
        }
    }, [focusedAnnotationId]);

    // Restore highlights
    // Restore highlights
    useEffect(() => {
        if (!containerRef.current || !annotations.length) return;

        const contentContainer = containerRef.current;

        annotations.forEach(ann => {
            if (contentContainer.querySelector(`[data-annotation-id="${ann.id}"]`)) return;

            // TreeWalker to find text nodes
            const walker = document.createTreeWalker(contentContainer, NodeFilter.SHOW_TEXT, null);
            let node;

            // Normalize helper
            const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();
            const cleanAnnText = normalize(ann.text);

            while (node = walker.nextNode()) {
                const val = node.nodeValue || '';

                // 1. Try Exact Match
                let startIdx = val.indexOf(ann.text);
                let matchLength = ann.text.length;

                // 2. Try Normalized Match (ignore extra spaces/newlines)
                if (startIdx === -1) {
                    const cleanVal = normalize(val);
                    const normIdx = cleanVal.indexOf(cleanAnnText);

                    if (normIdx !== -1) {
                        // Found in normalized string.
                        // Attempt to locate in raw string by finding unique slice?
                        // For SAFETY in this MVP, we will only highlight if we can find the 
                        // clean snippet in the raw text (tolerant of just 1 newline diff maybe?)

                        // Let's try finding the first 15 chars.
                        const snippet = cleanAnnText.substring(0, 15);
                        startIdx = val.indexOf(snippet); // Naive attempt

                        // If we found start, let's trust the length roughly...
                        // This is risky for 'start' vs 'starting', but length cap helps.
                    }
                }

                if (startIdx !== -1) {
                    const range = document.createRange();
                    try {
                        range.setStart(node, startIdx);
                        // Ensure end is safe
                        const endIdx = Math.min(startIdx + matchLength, val.length);
                        range.setEnd(node, endIdx);

                        // Double check we aren't wrapping empty space
                        if (range.toString().trim().length === 0) continue;

                        const span = document.createElement('span');
                        span.className = 'bg-yellow-200 cursor-pointer';
                        span.dataset.annotationId = ann.id;

                        range.surroundContents(span);

                        span.onclick = (e) => {
                            e.stopPropagation();
                        };
                    } catch (e) {
                        // split nodes are hard to restore without exact range path
                    }
                    break;
                }
            }
        });
    }, [annotations, children]);

    useEffect(() => {
        const handleMouseUp = () => {
            const selectionObj = window.getSelection();
            if (!selectionObj || selectionObj.isCollapsed) return;

            // If we are clicking inside the popup, don't clear anything
            if (showPopup) return;

            const text = selectionObj.toString().trim();
            if (text.length > 0 && containerRef.current?.contains(selectionObj.anchorNode)) {
                // 1. Get the range
                const range = selectionObj.getRangeAt(0);
                const rect = range.getBoundingClientRect();

                // 2. Create a highlight span
                const span = document.createElement('span');
                span.className = 'bg-yellow-200/50 decoration-clone'; // Temporary highlight style

                try {
                    // 3. Surround the contents
                    range.surroundContents(span);

                    // 4. Clear native selection so the user sees our span
                    selectionObj.removeAllRanges();

                    setCurrentHighlight(span);
                    setSelection({ text, rect });
                    setShowPopup(true);
                } catch (e) {
                    console.warn("Could not wrap selection (likely spans multiple blocks):", e);
                    // Fallback to old behavior if wrapping fails
                    setSelection({ text, rect });
                    setShowPopup(true);
                }
            }
        };
        const container = containerRef.current;
        if (container) {
            container.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            container?.removeEventListener('mouseup', handleMouseUp);
        };
    }, [showPopup]);

    const handleSave = () => {
        if (selection) {
            const annotationId = Date.now().toString();
            onAnnotate({
                id: annotationId,
                text: selection.text,
                note,
                tag: selectedTag,
                createdAt: Date.now(),
            });

            // Make highlight permanent
            if (currentHighlight) {
                // eslint-disable-next-line
                currentHighlight.className = 'bg-yellow-200 cursor-pointer';
                // eslint-disable-next-line
                currentHighlight.dataset.annotationId = annotationId;
            }

            setShowPopup(false);
            setNote('');
            setSelection(null);
            setCurrentHighlight(null);
        }
    };

    const handleCancel = () => {
        // Unwrap temp highlight if it exists
        if (currentHighlight) {
            const parent = currentHighlight.parentNode;
            if (parent) {
                while (currentHighlight.firstChild) {
                    parent.insertBefore(currentHighlight.firstChild, currentHighlight);
                }
                parent.removeChild(currentHighlight);
            }
        }

        setShowPopup(false);
        setNote('');
        setSelection(null);
        setCurrentHighlight(null);
        window.getSelection()?.removeAllRanges();
    };

    // Track position on scroll
    const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);

    useLayoutEffect(() => {
        if (!showPopup) return;

        // We need either a current highlight element OR a selection rect to position the popup
        if (!currentHighlight && !selection?.rect) return;

        const updatePosition = () => {
            let targetRect: { top: number; right: number; bottom: number; left: number };

            if (currentHighlight) {
                targetRect = currentHighlight.getBoundingClientRect();
            } else if (selection) {
                targetRect = selection.rect;
            } else {
                return;
            }

            // We want it in the right margin.
            const containerRect = containerRef.current?.getBoundingClientRect();
            // Calculate left position: prefer right of container, fall back to right of text + 20
            const leftPos = containerRect ? containerRect.right + 20 : targetRect.right + 20;

            setPopupPosition({
                top: targetRect.top, // Fixed positioning is relative to viewport
                left: leftPos
            });
        };

        // Initial update
        updatePosition();

        // Listen for scroll and resize
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);

        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [showPopup, currentHighlight, selection]);
    return (
        <div ref={containerRef} className="relative">
            {children}

            {showPopup && selection && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed z-50 bg-white shadow-xl rounded-lg border border-stone-200 p-4 w-72 animate-in fade-in zoom-in-95 duration-200"
                    style={{
                        top: popupPosition ? `${popupPosition.top}px` : '-9999px',
                        left: popupPosition ? `${popupPosition.left}px` : '0px',
                        visibility: popupPosition ? 'visible' : 'hidden'
                    }}
                >
                    <h3 className="text-sm font-bold text-stone-700 mb-2 font-sans flex items-center gap-2">
                        <MessageSquare size={14} />
                        Double-Entry Journal
                    </h3>

                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="What do you think? (Clarify, Question, Connect)"
                        className="w-full h-20 p-2 text-sm bg-stone-50 border border-stone-200 rounded mb-3 focus:ring-1 focus:ring-stone-400 outline-none font-serif resize-none"
                        autoFocus
                    />

                    <div className="mb-3">
                        {userRole && (
                            <div className="mb-3 p-2 bg-stone-100 rounded border border-stone-200">
                                <span className="text-xs font-bold text-stone-500 uppercase tracking-wide block mb-1">
                                    Role: {userRole}
                                </span>
                                {userRole === 'Questioner' && (
                                    <button
                                        onClick={() => {
                                            setNote("QUESTION: " + note);
                                            setSelectedTag("How/Why Question");
                                        }}
                                        className="w-full py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded hover:bg-orange-200 border border-orange-200"
                                    >
                                        Ask Question to Class
                                    </button>
                                )}
                                {userRole === 'Clarifier' && (
                                    <button
                                        onClick={() => {
                                            window.open(`https://www.google.com/search?q=define+${selection?.text}`, '_blank');
                                            setNote("CLARIFICATION: " + note);
                                        }}
                                        className="w-full py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded hover:bg-blue-200 border border-blue-200"
                                    >
                                        Lookup Definition
                                    </button>
                                )}
                                {userRole === 'Summarizer' && (
                                    <button
                                        onClick={() => setNote("SUMMARY: " + note)}
                                        className="w-full py-1 bg-green-100 text-green-700 text-xs font-bold rounded hover:bg-green-200 border border-green-200"
                                    >
                                        Draft Section Summary
                                    </button>
                                )}
                                {userRole === 'Predictor' && (
                                    <button
                                        onClick={() => setNote("PREDICTION: " + note)}
                                        className="w-full py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded hover:bg-purple-200 border border-purple-200"
                                    >
                                        Make Prediction
                                    </button>
                                )}
                            </div>
                        )}

                        <span className="text-xs font-bold text-stone-500 uppercase tracking-wide block mb-1">QAR Tagging</span>
                        <div className="flex flex-wrap gap-1">
                            {[
                                { label: "I'm confused", icon: HelpCircle, color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
                                { label: 'How/Why Question', icon: HelpCircle, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
                                { label: 'Self-Connection', icon: User, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
                                { label: 'World-Connection', icon: Book, color: 'bg-green-100 text-green-700 hover:bg-green-200' }
                            ].map((tag) => (
                                <button
                                    key={tag.label}
                                    onClick={() => setSelectedTag(tag.label as AnnotationData['tag'])}
                                    className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors border ${selectedTag === tag.label
                                        ? 'ring-2 ring-stone-400 border-transparent ' + tag.color
                                        : 'border-transparent opacity-60 hover:opacity-100 ' + tag.color
                                        }`}
                                >
                                    <tag.icon size={10} />
                                    {tag.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            onClick={handleCancel}
                            className="px-3 py-1 text-xs text-stone-500 hover:bg-stone-100 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!note.trim()}
                            className="px-3 py-1 text-xs bg-stone-800 text-white rounded hover:bg-stone-700 disabled:opacity-50"
                        >
                            Save Note
                        </button>
                    </div>

                    {/* tail arrow - moved to left side */}
                    <div className="absolute top-4 -left-2 w-4 h-4 bg-white border-b border-l border-stone-200 rotate-45"></div>
                </div>,
                document.body
            )}
        </div>
    );
}
