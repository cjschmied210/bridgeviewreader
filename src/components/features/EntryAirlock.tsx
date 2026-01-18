
import React, { useState } from 'react';
import { ArrowRight, Brain, Image as ImageIcon, Lightbulb, Search, User, PenTool, HelpCircle } from 'lucide-react';
import Image from 'next/image';

// import { Assignment } from '@/lib/assignments'; // Wrong import location
import { Assignment } from '@/types';
import { AirlockData } from '@/types';

interface EntryAirlockProps {
    assignment: Assignment;
    onComplete: (data: AirlockData) => void;
}

export function EntryAirlock({ assignment, onComplete }: EntryAirlockProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1); // Role Selection is now step 3
    const [selectedRole, setSelectedRole] = useState<AirlockData['role']>();
    const [primingWords, setPrimingWords] = useState(['', '', '']);
    const [knowledge, setKnowledge] = useState('');
    const [curiosity, setCuriosity] = useState('');

    const handleNext = () => {
        if (step === 1) setStep(2);
        else if (step === 2) setStep(3);
        else {
            onComplete({
                primingWords,
                knowledge,
                curiosity,
                role: selectedRole
            });
        }
    };

    // Helper to get step title
    const getStepTitle = () => {
        switch (step) {
            case 1: return 'Visual Priming';
            case 2: return 'Activate Schema';
            case 3: return 'Role Selection';
        }
    };

    const getStepIcon = () => {
        switch (step) {
            case 1: return <ImageIcon size={20} />;
            case 2: return <Brain size={20} />;
            case 3: return <User size={20} />;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/95 backdrop-blur-sm p-4">
            <div className="w-full max-w-3xl bg-[#FDFBF7] rounded-xl shadow-2xl overflow-hidden border border-stone-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-stone-100 p-6 border-b border-stone-200 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-stone-800 text-white flex items-center justify-center">
                            {getStepIcon()}
                        </div>
                        <div>
                            <h2 className="font-serif text-xl font-bold text-stone-800">
                                {getStepTitle()}
                            </h2>
                            <p className="text-stone-500 text-sm">
                                Entry Airlock: Phase {step} of 4
                            </p>
                        </div>
                    </div>
                    <div className="text-stone-400 text-xs font-mono uppercase tracking-widest">
                        Step {step} / 3
                    </div>
                </div>

                {/* content */}
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                {(() => {
                                    // 1. Determine Queries
                                    let queries = assignment.visualPrimingQueries;

                                    // Fallback Heuristic if no queries provided
                                    if (!queries || queries.length === 0) {
                                        // Simple heuristic: Use theme keyword + split title words
                                        queries = [
                                            assignment.themeImageKeyword,
                                            ...assignment.title.split(' ').filter(w => w.length > 4).slice(0, 3)
                                        ];
                                    }

                                    // Limit to 4 images for the grid
                                    const displayQueries = queries.slice(0, 4);

                                    return displayQueries.map((query, index) => (
                                        <div key={index} className="aspect-video bg-stone-200 rounded-lg flex items-center justify-center overflow-hidden relative group">
                                            <Image
                                                src={`https://loremflickr.com/800/600/${encodeURIComponent(query)}?random=${index}`}
                                                alt={`Visual priming: ${query}`}
                                                fill
                                                unoptimized
                                                className="absolute inset-0 object-cover transition-transform duration-700 group-hover:scale-110"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    target.parentElement?.classList.add('bg-stone-300');
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                                            <div className="absolute bottom-2 left-2 bg-black/40 px-2 py-1 rounded text-white text-xs backdrop-blur-md">
                                                {query}
                                            </div>
                                        </div>
                                    ));
                                })()}
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
                    )}

                    {step === 2 && (
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
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mb-6">
                                <p className="text-purple-800 text-sm flex gap-2">
                                    <User size={18} className="shrink-0" />
                                    Choose a "Reciprocal Teaching" role to guide your reading today.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    {
                                        id: 'Questioner',
                                        icon: <HelpCircle size={24} />,
                                        desc: 'Ask questions about confusing parts or main ideas.',
                                        color: 'bg-orange-100 text-orange-700 border-orange-200'
                                    },
                                    {
                                        id: 'Clarifier',
                                        icon: <Search size={24} />,
                                        desc: 'Look up words and clarify confusing concepts.',
                                        color: 'bg-blue-100 text-blue-700 border-blue-200'
                                    },
                                    {
                                        id: 'Summarizer',
                                        icon: <PenTool size={24} />,
                                        desc: 'Draft summaries of key sections for the group.',
                                        color: 'bg-green-100 text-green-700 border-green-200'
                                    },
                                    {
                                        id: 'Predictor',
                                        icon: <Lightbulb size={24} />,
                                        desc: 'Predict what will happen next based on clues.',
                                        color: 'bg-purple-100 text-purple-700 border-purple-200'
                                    }
                                ].map((role) => (
                                    <button
                                        key={role.id}
                                        onClick={() => setSelectedRole(role.id as any)}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${selectedRole === role.id
                                            ? 'border-stone-800 ring-1 ring-stone-800 bg-stone-50'
                                            : 'border-transparent bg-white hover:border-stone-200 shadow-sm'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${role.color}`}>
                                            {role.icon}
                                        </div>
                                        <h3 className="font-bold text-stone-800 mb-1">{role.id}</h3>
                                        <p className="text-xs text-stone-500 font-serif leading-relaxed">
                                            {role.desc}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-stone-50 p-6 border-t border-stone-200 flex justify-end shrink-0">
                    <button
                        onClick={handleNext}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all font-medium bg-stone-800 text-[#FDFBF7] hover:bg-stone-700 hover:pr-8 hover:pl-4`}
                    >
                        {step === 3 ? 'Enter Text' : 'Next Step'}
                        <ArrowRight size={18} />
                    </button>
                </div>

            </div>
        </div>
    );
}
