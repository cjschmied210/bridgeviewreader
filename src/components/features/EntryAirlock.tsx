
import React, { useState } from 'react';
import { ArrowRight, Brain, Image as ImageIcon, Lightbulb } from 'lucide-react';
import Image from 'next/image';

import { Assignment } from '@/lib/assignments';
import { AirlockData } from '@/types';

interface EntryAirlockProps {
    assignment: Assignment;
    onComplete: (data: AirlockData) => void;
}

export function EntryAirlock({ assignment, onComplete }: EntryAirlockProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [primingWords, setPrimingWords] = useState(['', '', '']);
    const [knowledge, setKnowledge] = useState('');
    const [curiosity, setCuriosity] = useState('');

    const handleNext = () => {
        if (step === 1) setStep(2);
        else {
            onComplete({
                primingWords,
                knowledge,
                curiosity
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/95 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-[#FDFBF7] rounded-xl shadow-2xl overflow-hidden border border-stone-200">

                {/* Header */}
                <div className="bg-stone-100 p-6 border-b border-stone-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-stone-800 text-white flex items-center justify-center">
                            {step === 1 ? <ImageIcon size={20} /> : <Brain size={20} />}
                        </div>
                        <div>
                            <h2 className="font-serif text-xl font-bold text-stone-800">
                                {step === 1 ? 'Visual Priming' : 'Activate Schema'}
                            </h2>
                            <p className="text-stone-500 text-sm">
                                {step === 1 ? 'Entry Airlock: Phase 1 of 2' : 'Entry Airlock: Phase 2 of 2'}
                            </p>
                        </div>
                    </div>
                    <div className="text-stone-400 text-xs font-mono uppercase tracking-widest">
                        Step {step} / 2
                    </div>
                </div>

                {/* content */}
                <div className="p-8">
                    {step === 1 ? (
                        <div className="space-y-6">
                            <div className="aspect-video bg-stone-200 rounded-lg flex items-center justify-center overflow-hidden relative group">
                                <Image
                                    src={`https://source.unsplash.com/1600x900/?${encodeURIComponent(assignment.themeImageKeyword)}`}
                                    alt={`Visual priming for ${assignment.title}`}
                                    fill
                                    unoptimized // Since we are using an external source that redirects
                                    className="absolute inset-0 object-cover transition-transform duration-700 group-hover:scale-105"
                                    onError={(e) => {
                                        // Fallback logic not directly supported in Next Image onError the same way for style
                                        // But for a linter fix, replacing img is the goal.
                                        // Ideally we handle error state with state, but keeping it simple for now.    
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        target.parentElement?.classList.add('bg-stone-300');
                                    }}
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                                <p className="relative z-10 text-white/90 font-medium flex items-center gap-2 drop-shadow-md">
                                    <ImageIcon size={24} />
                                    <span>Visual Priming: {assignment.themeImageKeyword}</span>
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-stone-700 mb-3 font-sans">
                                    Identify 3 words that come to mind:
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {primingWords.map((word, idx) => (
                                        <input
                                            key={idx}
                                            type="text"
                                            value={word}
                                            onChange={(e) => {
                                                const newWords = [...primingWords];
                                                newWords[idx] = e.target.value;
                                                setPrimingWords(newWords);
                                            }}
                                            placeholder={`Word ${idx + 1}`}
                                            className="w-full p-3 bg-white border border-stone-200 rounded-md focus:ring-2 focus:ring-stone-400 focus:border-transparent outline-none transition-all font-serif"
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                                <p className="text-blue-800 text-sm flex gap-2">
                                    <Lightbulb size={18} className="shrink-0" />
                                    Before reading, take a moment to connect with what you already know.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-stone-700 mb-2 font-sans">
                                        What do you already KNOW about this topic?
                                    </label>
                                    <textarea
                                        value={knowledge}
                                        onChange={(e) => setKnowledge(e.target.value)}
                                        className="w-full p-4 bg-white border border-stone-200 rounded-md focus:ring-2 focus:ring-stone-400 outline-none min-h-[100px] font-serif"
                                        placeholder="I know that..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-stone-700 mb-2 font-sans">
                                        What do you WANT to know?
                                    </label>
                                    <textarea
                                        value={curiosity}
                                        onChange={(e) => setCuriosity(e.target.value)}
                                        className="w-full p-4 bg-white border border-stone-200 rounded-md focus:ring-2 focus:ring-stone-400 outline-none min-h-[100px] font-serif"
                                        placeholder="I wonder..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-stone-50 p-6 border-t border-stone-200 flex justify-end">
                    <button
                        onClick={handleNext}
                        className="flex items-center gap-2 px-6 py-3 bg-stone-800 text-[#FDFBF7] rounded-full hover:bg-stone-700 transition-all font-medium hover:pr-8 hover:pl-4"
                    >
                        {step === 1 ? 'Next Step' : 'Enter Text'}
                        <ArrowRight size={18} />
                    </button>
                </div>

            </div>
        </div>
    );
}
