
import React from 'react';
import { BookOpen, PenTool, Lightbulb, HelpCircle } from 'lucide-react';
import { AnnotationData } from '@/types';

interface ThinkingSidebarProps {
    isFocused?: boolean;
    isSpanish?: boolean; // New prop
    kwlData?: {
        knowledge: string;
        curiosity: string;
    } | null;
    onAnnotationClick?: (id: string) => void;
    annotations?: AnnotationData[];
}

// Simple translation dictionary
const LABELS = {
    en: {
        thinkingTools: "Thinking Tools",
        activeSchema: "Active Schema",
        iKnow: "I Know:",
        iWonder: "I Wonder:",
        nothingSpecified: "Nothing specified.",
        journalEntries: "My Journal Entries",
        strategyTip: "Strategy Tip",
        tipContent: "Try to connect the author's argument to your own experience.",
        completeAirlock: "Complete the Airlock to populate this.",
        whatDoYouKnow: "What do you already know about this topic?"
    },
    es: {
        thinkingTools: "Herramientas de Pensamiento",
        activeSchema: "Esquema Activo",
        iKnow: "Yo Sé:",
        iWonder: "Me Pregunto:",
        nothingSpecified: "Nada especificado.",
        journalEntries: "Mis Entradas de Diario",
        strategyTip: "Consejo de Estrategia",
        tipContent: "Intenta conectar el argumento del autor con tu propia experiencia.",
        completeAirlock: "Completa el Airlock para llenar esto.",
        whatDoYouKnow: "¿Qué sabes ya sobre este tema?"
    }
}

export function ThinkingSidebar({ isFocused, kwlData, annotations = [], onAnnotationClick, isSpanish = false }: ThinkingSidebarProps) {
    const t = isSpanish ? LABELS.es : LABELS.en;

    return (
        <div className={`flex flex-col h-full transition-opacity duration-500 ${isFocused ? 'opacity-80 hover:opacity-100' : 'opacity-100'}`}>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs uppercase tracking-widest font-bold text-stone-500 font-sans">{t.thinkingTools}</h2>
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
                            <h3 className="font-serif font-bold text-sm">{t.activeSchema}</h3>
                        </div>

                        <div className="mb-4">
                            <p className="text-xs text-stone-500 mb-1 uppercase tracking-wide font-sans">{t.iKnow}</p>
                            <p className="text-sm text-stone-800 font-serif italic border-l-2 border-stone-300 pl-3">
                                {kwlData.knowledge || t.nothingSpecified}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-stone-500 mb-1 uppercase tracking-wide font-sans">{t.iWonder}</p>
                            <p className="text-sm text-stone-800 font-serif italic border-l-2 border-stone-300 pl-3">
                                {kwlData.curiosity || t.nothingSpecified}
                            </p>
                        </div>
                    </div>
                )}

                {/* Annotations List */}
                {annotations.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wide font-sans mb-2">{t.journalEntries}</h3>
                        {annotations.map((ann) => (
                            <div
                                key={ann.id}
                                onClick={() => onAnnotationClick?.(ann.id)}
                                className="bg-white border border-stone-200 rounded-lg p-3 hover:shadow-md transition-shadow group cursor-pointer hover:border-stone-400"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider
                                        ${ann.tag === "I'm confused" ? 'bg-orange-100 text-orange-700' : ''}
                                        ${ann.tag === 'How/Why Question' ? 'bg-purple-100 text-purple-700' : ''}
                                        ${ann.tag === 'Self-Connection' ? 'bg-blue-100 text-blue-700' : ''}
                                        ${ann.tag === 'World-Connection' ? 'bg-green-100 text-green-700' : ''}
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
                            <h3 className="font-serif font-bold text-sm">{t.activeSchema}</h3>
                        </div>
                        <p className="text-xs text-stone-500 mb-2">{t.whatDoYouKnow}</p>
                        <div className="min-h-[80px] w-full bg-white border border-stone-200 rounded p-2 text-sm text-stone-400 font-serif flex items-center justify-center italic">
                            {t.completeAirlock}
                        </div>
                    </div>
                )}

                {/* Strategy Tip */}
                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2 text-blue-700">
                        <HelpCircle size={16} />
                        <h3 className="font-sans font-bold text-xs uppercase">{t.strategyTip}</h3>
                    </div>
                    <p className="text-xs text-blue-800 leading-relaxed font-sans">
                        {t.tipContent}
                    </p>
                </div>
            </div>
        </div>
    );
}
