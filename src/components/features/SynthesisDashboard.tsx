
import React, { useState } from 'react';
import { CheckCircle, HelpCircle, PenTool, Lightbulb, Search } from 'lucide-react';
import { SynthesisData, ReciprocalRole } from '@/types';

interface SynthesisDashboardProps {
    onComplete?: (data: SynthesisData) => void;
    airlockCuriosity?: string; // To re-surface "Want to know"
    initialData?: SynthesisData;
    readOnly?: boolean;
    userRole?: ReciprocalRole;
}

// ... imports
import { HexagonalCanvas } from './HexagonalCanvas';
import { HexagonTile, HexConnection } from '@/types';
// ... inside component
import { MessageSquare, ListOrdered, Users, Network } from 'lucide-react';

export function SynthesisDashboard({ onComplete, airlockCuriosity, initialData, readOnly = false, userRole }: SynthesisDashboardProps) {
    const [activeTab, setActiveTab] = useState<'text' | 'visual'>('text'); // New visual tab

    // ... existing text state
    const [gist, setGist] = useState(initialData?.gist || "");
    const [reflection3, setReflection3] = useState<string[]>(initialData?.reflection3 || ["", "", ""]);
    const [reflection2, setReflection2] = useState<string[]>(initialData?.reflection2 || ["", ""]);
    const [reflection1, setReflection1] = useState(initialData?.reflection1 || "");
    const [learned, setLearned] = useState(initialData?.learned || "");
    const [roleContent, setRoleContent] = useState(initialData?.roleContribution?.content || "");

    // Hex State
    const [hexTiles, setHexTiles] = useState<HexagonTile[]>(initialData?.hexTiles || [
        { id: '1', content: 'Central Theme', type: 'Theme', x: 200, y: 200 },
        { id: '2', content: 'Protagonist', type: 'Character', x: 50, y: 100 },
        { id: '3', content: 'Conflict', type: 'Term', x: 350, y: 100 }
    ]);
    const [hexConnections, setHexConnections] = useState<HexConnection[]>(initialData?.hexConnections || []);

    const wordCount = gist.trim().split(/\s+/).filter(w => w.length > 0).length;
    const isGistValid = wordCount > 0 && wordCount <= 20;

    const canSubmit = isGistValid && learned.length > 5 && reflection3.every(s => s.length > 0);

    const handleComplete = () => {
        if (onComplete) {
            onComplete({
                gist,
                reflection3,
                reflection2,
                reflection1,
                learned,
                roleContribution: userRole ? { role: userRole, content: roleContent } : undefined,
                hexTiles,
                hexConnections
            });
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden my-8 border border-stone-200 flex flex-col max-h-[90vh]">

            <header className="bg-stone-900 text-stone-100 p-6 flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
                        <PenTool className="text-amber-400" />
                        Synthesis Dashboard
                    </h2>
                    <p className="text-stone-400 text-sm">Consolidate your learning.</p>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-stone-800 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('text')}
                        className={`px-4 py-2 rounded text-sm font-bold transition ${activeTab === 'text' ? 'bg-stone-600 text-white' : 'text-stone-400 hover:text-white'}`}
                    >
                        Text Synthesis
                    </button>
                    <button
                        onClick={() => setActiveTab('visual')}
                        className={`px-4 py-2 rounded text-sm font-bold transition flex items-center gap-2 ${activeTab === 'visual' ? 'bg-stone-600 text-white' : 'text-stone-400 hover:text-white'}`}
                    >
                        <Network size={14} /> Hexagonal Thinking
                    </button>
                </div>
            </header>

            <div className="overflow-y-auto p-8 space-y-8 custom-scrollbar bg-[#FDFBF7]">

                {activeTab === 'text' && (
                    <>
                        {/* K-W-L Reconciliation */}
                        <section className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                            {/* ... existing KWL Reconciliation UI ... */}
                            <h3 className="font-bold text-lg text-stone-800 mb-4 flex items-center gap-2">
                                <Lightbulb className="text-yellow-500" />
                                1. Reconcile Your Curiosity
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 opacity-70">
                                    <div className="text-xs font-bold text-stone-500 uppercase mb-2">You Wondered:</div>
                                    <div className="font-serif italic text-stone-700">{airlockCuriosity || "No curiosity recorded."}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-stone-500 uppercase mb-2">What did you Learn?</div>
                                    <textarea
                                        value={learned}
                                        onChange={(e) => setLearned(e.target.value)}
                                        disabled={readOnly}
                                        className="w-full p-3 bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-serif"
                                        rows={3}
                                        placeholder="I learned that..."
                                    />
                                </div>
                            </div>
                        </section>

                        {/* GIST Generator */}
                        <section className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm animate-in fade-in slide-in-from-bottom-5">
                            {/* ... existing GIST UI ... */}
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg text-stone-800 flex items-center gap-2">
                                    <MessageSquare className="text-blue-500" />
                                    2. The GIST Summary
                                </h3>
                                <div className={`text-xs font-bold px-2 py-1 rounded ${wordCount <= 20 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {wordCount} / 20 words
                                </div>
                            </div>
                            <textarea
                                value={gist}
                                onChange={(e) => setGist(e.target.value)}
                                disabled={readOnly}
                                className="w-full text-lg p-4 bg-stone-50 border-2 border-stone-200 rounded-xl focus:border-stone-400 outline-none font-serif leading-relaxed text-stone-800 placeholder-stone-400 resize-none transition-colors"
                                placeholder="Summarize the entire text in 20 words or less..."
                                rows={3}
                            />
                        </section>

                        {/* 3-2-1 Reflection */}
                        <section className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm animate-in fade-in slide-in-from-bottom-6">
                            <h3 className="font-bold text-lg text-stone-800 mb-6 flex items-center gap-2">
                                <ListOrdered className="text-purple-500" />
                                3. 3-2-1 Reflection
                            </h3>
                            {/* ... existing 3-2-1 UI - Keeping it brief in replacement block ... */}
                            <div className="space-y-6">
                                {/* 3 Things */}
                                <div>
                                    <label className="text-sm font-bold text-stone-600 mb-2 block">3 Things you found out</label>
                                    <div className="space-y-2">
                                        {[0, 1, 2].map((i) => (
                                            <input
                                                key={i}
                                                value={reflection3[i]}
                                                onChange={(e) => {
                                                    const newRef = [...reflection3];
                                                    newRef[i] = e.target.value;
                                                    setReflection3(newRef);
                                                }}
                                                disabled={readOnly}
                                                className="w-full p-2 border border-stone-200 rounded text-sm focus:border-purple-400 outline-none"
                                                placeholder={`Fact ${i + 1}...`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                {/* 2 Interesting */}
                                <div>
                                    <label className="text-sm font-bold text-stone-600 mb-2 block">2 Interesting details</label>
                                    <div className="space-y-2">
                                        {[0, 1].map((i) => (
                                            <input
                                                key={i}
                                                value={reflection2[i]}
                                                onChange={(e) => {
                                                    const newRef = [...reflection2];
                                                    newRef[i] = e.target.value;
                                                    setReflection2(newRef);
                                                }}
                                                disabled={readOnly}
                                                className="w-full p-2 border border-stone-200 rounded text-sm focus:border-purple-400 outline-none"
                                                placeholder={`Detail ${i + 1}...`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                {/* 1 Question */}
                                <div>
                                    <label className="text-sm font-bold text-stone-600 mb-2 block">1 Question you still have</label>
                                    <input
                                        value={reflection1}
                                        onChange={(e) => setReflection1(e.target.value)}
                                        disabled={readOnly}
                                        className="w-full p-2 border border-stone-200 rounded text-sm focus:border-purple-400 outline-none"
                                        placeholder="I'm still wondering..."
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Reciprocal Role Contribution */}
                        {userRole && (
                            <section className="bg-blue-50 p-6 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-bottom-7">
                                <h3 className="font-bold text-lg text-blue-900 mb-2 flex items-center gap-2">
                                    <Users className="text-blue-500" />
                                    Role Contribution: {userRole}
                                </h3>
                                <p className="text-sm text-blue-700 mb-4">
                                    Final thoughts from your perspective as the {userRole}?
                                </p>
                                <textarea
                                    value={roleContent}
                                    onChange={(e) => setRoleContent(e.target.value)}
                                    disabled={readOnly}
                                    className="w-full p-3 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-300 outline-none font-serif text-sm"
                                    rows={3}
                                    placeholder={`As a ${userRole}, I noticed...`}
                                />
                            </section>
                        )}
                    </>
                )}

                {activeTab === 'visual' && (
                    <section className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm h-full animate-in fade-in">
                        <div className="mb-4">
                            <h3 className="font-bold text-lg text-stone-900">Hexagonal Thinking</h3>
                            <p className="text-sm text-stone-500">Drag tiles to organize concepts. Click two tiles to link them and explain the connection.</p>
                        </div>
                        <HexagonalCanvas
                            tiles={hexTiles}
                            connections={hexConnections}
                            onTilesChange={setHexTiles}
                            onConnectionsChange={setHexConnections}
                            readOnly={readOnly}
                        />
                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={() => setHexTiles([...hexTiles, { id: Date.now().toString(), content: 'New Idea', type: 'Term', x: 50, y: 50 }])}
                                disabled={readOnly}
                                className="text-xs bg-stone-100 hover:bg-stone-200 px-3 py-1 rounded font-bold"
                            >
                                + Add Tile
                            </button>
                        </div>
                    </section>
                )}

            </div>

            {/* Footer Actions */}
            {!readOnly && (
                <div className="p-6 bg-stone-50 border-t border-stone-200 flex justify-between items-center shrink-0">
                    <div className="text-xs text-stone-400 italic">
                        {activeTab === 'text' ? (canSubmit ? "Ready to submit." : "Complete all fields to finish.") : "Visuals are optional but recommended."}
                    </div>
                    <button
                        onClick={handleComplete}
                        disabled={!canSubmit}
                        className="px-8 py-3 bg-stone-900 text-white font-bold rounded-lg shadow-lg hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 flex items-center gap-2"
                    >
                        <CheckCircle size={18} />
                        Complete Assignment
                    </button>
                </div>
            )}
        </div>
    );
}
