
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, HelpCircle, Book, User } from 'lucide-react';
import { AnnotationData } from '@/types';

interface TextAnnotatorProps {
    children: React.ReactNode;
    onAnnotate: (annotation: AnnotationData) => void;
}

export function TextAnnotator({ children, onAnnotate }: TextAnnotatorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selection, setSelection] = useState<{
        text: string;
        rect: DOMRect;
    } | null>(null);
    const [showPopup, setShowPopup] = useState(false);
    const [note, setNote] = useState('');
    const [selectedTag, setSelectedTag] = useState<AnnotationData['tag']>('Right There');

    useEffect(() => {
        const handleMouseUp = () => {
            const selectionObj = window.getSelection();
            if (!selectionObj || selectionObj.isCollapsed) {
                // Only clear if we aren't clicking inside our own popup
                // For simplicity in this demo, we might need a better check, 
                // but let's assume if the selection is empty we clear.
                // Actually, preventing clearing when clicking the popup is crucial.
                // We'll handle that by checking event target in a click handler usually, 
                // but here we just check if text is selected.
                return;
            }

            const text = selectionObj.toString().trim();
            if (text.length > 0 && containerRef.current?.contains(selectionObj.anchorNode)) {
                const range = selectionObj.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                // Adjust rect to be relative to viewport or container? 
                // Fixed positioning relative to viewport is easiest for the popup.
                setSelection({ text, rect });
                setShowPopup(true);
            }
        };

        // We listen on the document to catch clicks outside to close, 
        // but the container for selections. 
        // For now, let's attach mouseup to the container.
        const container = containerRef.current;
        if (container) {
            container.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            container?.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const handleSave = () => {
        if (selection) {
            onAnnotate({
                id: Date.now().toString(),
                text: selection.text,
                note,
                tag: selectedTag,
            });
            setShowPopup(false);
            setNote('');
            setSelection(null);
            window.getSelection()?.removeAllRanges();
        }
    };

    const handleCancel = () => {
        setShowPopup(false);
        setNote('');
        setSelection(null);
        window.getSelection()?.removeAllRanges();
    };

    return (
        <div ref={containerRef} className="relative">
            {children}

            {showPopup && selection && (
                <div
                    className="fixed z-50 bg-white shadow-xl rounded-lg border border-stone-200 p-4 w-72 animate-in fade-in zoom-in-95 duration-200"
                    style={{
                        top: selection.rect.bottom + 10 + window.scrollY, // Simplified positioning
                        left: selection.rect.left + (selection.rect.width / 2) - 144, // Center horizontally
                    }}
                >
                    <h3 className="text-sm font-bold text-stone-700 mb-2 font-sans flex items-center gap-2">
                        <MessageSquare size={14} />
                        Double-Entry Journal
                    </h3>

                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="What do you think? (Connect, Question, Predict)"
                        className="w-full h-20 p-2 text-sm bg-stone-50 border border-stone-200 rounded mb-3 focus:ring-1 focus:ring-stone-400 outline-none font-serif resize-none"
                        autoFocus
                    />

                    <div className="mb-3">
                        <span className="text-xs font-bold text-stone-500 uppercase tracking-wide block mb-1">QAR Tagging</span>
                        <div className="flex flex-wrap gap-1">
                            {[
                                { label: 'Right There', icon: Book, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                                { label: 'Think & Search', icon: HelpCircle, color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
                                { label: 'Author & You', icon: User, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' }
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

                    {/* tail arrow */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-stone-200 rotate-45"></div>
                </div>
            )}
        </div>
    );
}
