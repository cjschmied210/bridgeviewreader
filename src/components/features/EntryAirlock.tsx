
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
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // Scavenger Hunt is step 3, Role Selection is step 4
    const [selectedRole, setSelectedRole] = useState<AirlockData['role']>();
    const [primingWords, setPrimingWords] = useState(['', '', '']);
    const [knowledge, setKnowledge] = useState('');
    const [curiosity, setCuriosity] = useState('');

    // Scavenger Hunt State
    const [cluesFound, setCluesFound] = useState(0);
    const [foundClueIds, setFoundClueIds] = useState<Set<string>>(new Set());

    const handleNext = () => {
        if (step === 1) setStep(2);
        else if (step === 2) setStep(3);
        else if (step === 3) setStep(4);
        else {
            onComplete({
                primingWords,

                knowledge,
                curiosity,
                role: selectedRole
            });
        }
    };


    const handleClueClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        // Check if the clicked element is a heading or image
        if (/^H[1-6]$/.test(target.tagName) || target.tagName === 'IMG') {
            const id = target.innerText || (target as HTMLImageElement).src || target.tagName + Math.random();

            if (!foundClueIds.has(id)) {
                // Determine if this is a valid "clue" (heading or image)
                // We add a visual indicator class to the target
                target.style.color = '#059669'; // Emerald 600
                target.style.position = 'relative';

                // Add a checkmark if not present
                if (!target.querySelector('.clue-found-badge')) {
                    const badge = document.createElement('span');
                    badge.className = 'clue-found-badge';
                    badge.innerHTML = '✓';
                    badge.style.marginLeft = '8px';
                    badge.style.display = 'inline-block';
                    badge.style.color = '#059669';
                    target.appendChild(badge);
                }

                const newSet = new Set(foundClueIds);
                newSet.add(id);
                setFoundClueIds(newSet);
                setCluesFound(prev => Math.min(prev + 1, 3));
            }
        }
    };

    // Helper to get step title
    const getStepTitle = () => {
        switch (step) {
            case 1: return 'Visual Priming';
            case 2: return 'Activate Schema';
            case 3: return 'Scavenger Hunt';
            case 4: return 'Role Selection';
        }
    };

    const getStepIcon = () => {
        switch (step) {
            case 1: return <ImageIcon size={20} />;
            case 2: return <Brain size={20} />;
            case 3: return <Search size={20} />;
            case 4: return <User size={20} />;
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
                        Step {step} / 4
                    </div>
                </div>

                {/* content */}
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="aspect-video bg-stone-200 rounded-lg flex items-center justify-center overflow-hidden relative group">
                                <Image
                                    src={assignment.imageUrl || `https://loremflickr.com/1600/900/${encodeURIComponent(assignment.themeImageKeyword)}`}
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
                            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 mb-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                                <div className="flex gap-3">
                                    <div className="p-2 bg-amber-100 rounded-full text-amber-700 h-fit">
                                        <Search size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-amber-900 text-sm">Scavenger Hunt</h3>
                                        <p className="text-amber-800 text-sm">
                                            Find and click 3 headings or images to preview the text structure.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-amber-200 shadow-sm">
                                    <span className={`font-bold ${cluesFound >= 3 ? 'text-green-600' : 'text-amber-600'}`}>
                                        {cluesFound} / 3
                                    </span>
                                    <span className="text-xs text-stone-500 uppercase font-bold">Found</span>
                                </div>
                            </div>

                            <div
                                className="prose prose-stone max-w-none scavenger-hunt-container p-6 bg-white rounded-lg shadow-inner border border-stone-100"
                                onClick={handleClueClick}
                            >
                                <style jsx global>{`
                                    .scavenger-hunt-container p,
                                    .scavenger-hunt-container ul,
                                    .scavenger-hunt-container ol,
                                    .scavenger-hunt-container blockquote {
                                        filter: blur(5px);
                                        opacity: 0.5;
                                        pointer-events: none;
                                        user-select: none;
                                    }
                                    .scavenger-hunt-container h1,
                                    .scavenger-hunt-container h2,
                                    .scavenger-hunt-container h3,
                                    .scavenger-hunt-container h4,
                                    .scavenger-hunt-container img {
                                        filter: none;
                                        cursor: pointer;
                                        transition: all 0.2s ease;
                                        position: relative;
                                    }
                                    .scavenger-hunt-container h1:hover,
                                    .scavenger-hunt-container h2:hover,
                                    .scavenger-hunt-container h3:hover,
                                    .scavenger-hunt-container img:hover {
                                        transform: scale(1.01);
                                        background-color: rgba(253, 251, 247, 0.5);
                                        outline: 2px dashed #d97706;
                                        outline-offset: 4px;
                                        border-radius: 4px;
                                    }
                                `}</style>
                                <div dangerouslySetInnerHTML={{ __html: assignment.content }} />
                            </div>
                        </div>
                    )}

                    {step === 4 && (
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
                        disabled={step === 3 && cluesFound < 3}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all font-medium  ${step === 3 && cluesFound < 3
                            ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                            : 'bg-stone-800 text-[#FDFBF7] hover:bg-stone-700 hover:pr-8 hover:pl-4'
                            }`}
                    >
                        {step === 4 ? 'Enter Text' : 'Next Step'}
                        <ArrowRight size={18} />
                    </button>
                </div>

            </div>
        </div>
    );
}
