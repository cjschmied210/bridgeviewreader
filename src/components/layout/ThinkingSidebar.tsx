
import React from 'react';
import { BookOpen, PenTool, Lightbulb, HelpCircle } from 'lucide-react';
import { AnnotationData } from '@/types';

interface ThinkingSidebarProps {
    isFocused?: boolean;
    kwlData?: {
        knowledge: string;
        curiosity: string;
    } | null;
    annotations?: AnnotationData[];
}

export function ThinkingSidebar({ isFocused, kwlData, annotations = [] }: ThinkingSidebarProps) {
    return (
        <div className={`flex flex-col h-full transition-opacity duration-500 ${isFocused ? 'opacity-80 hover:opacity-100' : 'opacity-100'}`}>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs uppercase tracking-widest font-bold text-stone-500 font-sans">Thinking Tools</h2>
                <div className="flex gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                </div>
            </div>

            {/* Tools Navigation */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 border-b border-stone-200/50">
                <button className="p-2 rounded-md bg-stone-200/50 text-stone-700 hover:bg-stone-200 transition-colors">
                    <BookOpen size={18} />
                </button>
                <button className="p-2 rounded-md hover:bg-stone-200/50 text-stone-500 transition-colors">
                    <PenTool size={18} />
                </button>
                <button className="p-2 rounded-md hover:bg-stone-200/50 text-stone-500 transition-colors">
                    <Lightbulb size={18} />
                </button>
            </div>

            {/* Active Tool View */}
            <div className="flex-1 overflow-y-auto space-y-4">

                {/* K-W-L Data display if present */}
                {kwlData && (
                    <div className="bg-white/50 border border-stone-200/60 rounded-lg p-4 animate-in fade-in slide-in-from-right-4">
                        <div className="flex items-center gap-2 mb-3 text-stone-700">
                            <Lightbulb size={16} />
                            <h3 className="font-serif font-bold text-sm">Active Schema</h3>
                        </div>

                        <div className="mb-4">
                            <p className="text-xs text-stone-500 mb-1 uppercase tracking-wide font-sans">I Know:</p>
                            <p className="text-sm text-stone-800 font-serif italic border-l-2 border-stone-300 pl-3">
                                {kwlData.knowledge || "Nothing specified."}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-stone-500 mb-1 uppercase tracking-wide font-sans">I Wonder:</p>
                            <p className="text-sm text-stone-800 font-serif italic border-l-2 border-stone-300 pl-3">
                                {kwlData.curiosity || "Nothing specified."}
                            </p>
                        </div>
                    </div>
                )}

                {/* Annotations List */}
                {annotations.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wide font-sans mb-2">My Journal Entries</h3>
                        {annotations.map((ann) => (
                            <div key={ann.id} className="bg-white border border-stone-200 rounded-lg p-3 hover:shadow-md transition-shadow group">
                                <div className="flex items-start justify-between mb-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider
                                        ${ann.tag === 'Right There' ? 'bg-green-100 text-green-700' : ''}
                                        ${ann.tag === 'Think & Search' ? 'bg-yellow-100 text-yellow-700' : ''}
                                        ${ann.tag === 'Author & You' ? 'bg-blue-100 text-blue-700' : ''}
                                    `}>
                                        {ann.tag}
                                    </span>
                                </div>
                                <p className="text-sm font-serif text-stone-800 mb-2 leading-snug">{ann.note}</p>
                                <div className="text-xs text-stone-400 font-serif italic border-l-2 border-stone-200 pl-2 line-clamp-2 group-hover:line-clamp-none transition-all">
                                    &quot;{ann.text}&quot;
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Default State or "Quick input" for KWL if empty? */}
                {!kwlData && (
                    <div className="bg-white/50 border border-stone-200/60 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3 text-stone-700">
                            <Lightbulb size={16} />
                            <h3 className="font-serif font-bold text-sm">Active Schema</h3>
                        </div>
                        <p className="text-xs text-stone-500 mb-2">What do you already know about this topic?</p>
                        <div className="min-h-[80px] w-full bg-white border border-stone-200 rounded p-2 text-sm text-stone-400 font-serif flex items-center justify-center italic">
                            Complete the Airlock to populate this.
                        </div>
                    </div>
                )}

                {/* Strategy Tip */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2 text-blue-700">
                        <HelpCircle size={16} />
                        <h3 className="font-sans font-bold text-xs uppercase">Strategy Tip</h3>
                    </div>
                    <p className="text-xs text-blue-800 leading-relaxed font-sans">
                        Try to connect the author&apos;s argument to your own experience.
                    </p>
                </div>
            </div>
        </div>
    );
}
