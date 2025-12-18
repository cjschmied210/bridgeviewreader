
import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { SynthesisData } from '@/types';

interface SynthesisDashboardProps {
    onComplete?: (data: SynthesisData) => void;
    airlockCuriosity?: string; // To re-surface "Want to know"
    initialData?: SynthesisData;
    readOnly?: boolean;
}

export function SynthesisDashboard({ onComplete, airlockCuriosity, initialData, readOnly = false }: SynthesisDashboardProps) {
    const [gist, setGist] = useState(initialData?.gist || '');
    const [reflection3, setReflection3] = useState(initialData?.reflection3 || ['', '', '']);
    const [reflection2, setReflection2] = useState(initialData?.reflection2 || ['', '']);
    const [reflection1, setReflection1] = useState(initialData?.reflection1 || '');
    const [learned, setLearned] = useState(initialData?.learned || '');

    const wordCount = gist.trim().split(/\s+/).filter(w => w.length > 0).length;
    const isGistValid = wordCount > 0 && wordCount <= 20;

    const canSubmit = isGistValid &&
        reflection3.every(s => s.trim()) &&
        reflection2.every(s => s.trim()) &&
        reflection1.trim() &&
        learned.trim();

    return (
        <div className="max-w-3xl mx-auto p-8 bg-white border border-stone-200 rounded-xl shadow-lg my-12 animate-in fade-in slide-in-from-bottom-8">
            <div className="text-center mb-10">
                <h2 className="font-serif text-3xl font-bold text-stone-800 mb-2">Synthesis Dashboard</h2>
                <p className="text-stone-500 font-sans">Consolidate your thinking before you leave.</p>
            </div>

            <div className="space-y-10">
                {/* Helper: K-W-L Reconciliation */}
                <section className="bg-blue-50/50 p-6 rounded-lg border border-blue-100">
                    <h3 className="font-serif font-bold text-lg text-stone-800 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-xs font-sans font-bold">1</span>
                        K-W-L Reconciliation
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide">You Wondered:</label>
                            <div className="p-3 bg-white border border-stone-200 rounded text-stone-700 italic text-sm min-h-[80px]">
                                {airlockCuriosity || "No curiosity recorded."}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide">What did you Learn?</label>
                            <textarea
                                value={learned}
                                onChange={(e) => setLearned(e.target.value)}
                                className="w-full p-3 bg-white border border-stone-200 rounded text-sm min-h-[80px] focus:ring-2 focus:ring-blue-100 outline-none font-serif disabled:bg-stone-50 disabled:text-stone-600"
                                placeholder="I learned that..."
                                disabled={readOnly}
                            />
                        </div>
                    </div>
                </section>

                {/* Feature: The GIST Generator */}
                <section>
                    <h3 className="font-serif font-bold text-lg text-stone-800 mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-sans font-bold">2</span>
                        The GIST Generator
                    </h3>
                    <p className="text-sm text-stone-500 mb-4 font-sans">Summarize the entire text in 20 words or less.</p>
                    <div className="relative">
                        <textarea
                            value={gist}
                            onChange={(e) => setGist(e.target.value)}
                            className={`w-full p-4 text-lg font-serif bg-stone-50 border rounded-lg focus:ring-2 outline-none transition-all ${wordCount > 20 ? 'border-red-300 focus:ring-red-100' : 'border-stone-200 focus:ring-stone-200'} disabled:opacity-70`}
                            rows={3}
                            placeholder="The main argument is..."
                            disabled={readOnly}
                        />
                        <div className={`absolute bottom-3 right-3 text-xs font-bold px-2 py-1 rounded transition-colors ${wordCount > 20 ? 'bg-red-100 text-red-600' : 'bg-stone-200 text-stone-600'
                            }`}>
                            {wordCount} / 20 words
                        </div>
                    </div>
                </section>

                {/* Feature: 3-2-1 Reflection */}
                <section>
                    <h3 className="font-serif font-bold text-lg text-stone-800 mb-6 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-sans font-bold">3</span>
                        3-2-1 Reflection
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-2 font-sans">3 Things you learned</label>
                            <div className="space-y-2">
                                {reflection3.map((val, idx) => (
                                    <input
                                        key={idx}
                                        value={val}
                                        onChange={(e) => {
                                            const newRef = [...reflection3];
                                            newRef[idx] = e.target.value;
                                            setReflection3(newRef);
                                        }}
                                        className="w-full p-2 bg-white border border-stone-200 rounded text-sm font-serif focus:ring-1 focus:ring-stone-300 outline-none disabled:bg-stone-50"
                                        placeholder={`Fact ${idx + 1}`}
                                        disabled={readOnly}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-2 font-sans">2 Interesting Details</label>
                            <div className="space-y-2">
                                {reflection2.map((val, idx) => (
                                    <input
                                        key={idx}
                                        value={val}
                                        onChange={(e) => {
                                            const newRef = [...reflection2];
                                            newRef[idx] = e.target.value;
                                            setReflection2(newRef);
                                        }}
                                        className="w-full p-2 bg-white border border-stone-200 rounded text-sm font-serif focus:ring-1 focus:ring-stone-300 outline-none disabled:bg-stone-50"
                                        placeholder={`Detail ${idx + 1}`}
                                        disabled={readOnly}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-stone-700 mb-2 font-sans">1 Question you still have</label>
                            <input
                                value={reflection1}
                                onChange={(e) => setReflection1(e.target.value)}
                                className="w-full p-2 bg-white border border-stone-200 rounded text-sm font-serif focus:ring-1 focus:ring-stone-300 outline-none disabled:bg-stone-50"
                                placeholder="I wonder..."
                                disabled={readOnly}
                            />
                        </div>
                    </div>
                </section>

                {!readOnly && (
                    <div className="flex justify-end pt-6 border-t border-stone-100">
                        <button
                            onClick={() => onComplete && onComplete({
                                gist,
                                reflection3,
                                reflection2,
                                reflection1,
                                learned
                            })}
                            disabled={!canSubmit}
                            className="flex items-center gap-2 px-8 py-4 bg-stone-900 text-white rounded-full font-bold hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:pr-10"
                        >
                            Complete Assignment
                            <CheckCircle size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
