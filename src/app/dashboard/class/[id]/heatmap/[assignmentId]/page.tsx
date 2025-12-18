"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Assignment, Submission, AnnotationData } from '@/types';
import { HeatmapOverlay } from '@/components/features/HeatmapOverlay';
import { DualCanvas } from '@/components/layout/DualCanvas';
import { ArrowLeft } from 'lucide-react';

export default function ClassHeatmapPage() {
    const { id: classId, assignmentId } = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { role, loading: roleLoading } = useUserRole();

    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [allAnnotations, setAllAnnotations] = useState<(AnnotationData & { studentName?: string, studentId?: string })[]>([]);
    const [loading, setLoading] = useState(true);

    // Interactive State
    const [selectedTag, setSelectedTag] = useState<string>('All');
    const [activeModal, setActiveModal] = useState<{ phrase: string, annotations: (AnnotationData & { studentName?: string })[] } | null>(null);

    useEffect(() => {
        async function fetchData() {
            if (!classId || !assignmentId || !user) return;

            try {
                // 1. Fetch Assignment Content
                const assignRef = doc(db, "assignments", assignmentId as string);
                const assignSnap = await getDoc(assignRef);
                if (!assignSnap.exists()) {
                    alert("Assignment not found");
                    return;
                }
                setAssignment({ id: assignSnap.id, ...assignSnap.data() } as Assignment);

                // 2. Fetch ALL submissions for this assignment + class
                const q = query(
                    collection(db, "submissions"),
                    where("classId", "==", classId),
                    where("assignmentId", "==", assignmentId)
                );
                const querySnapshot = await getDocs(q);

                // 3. Resolve Student Names
                // Get all unique student IDs from submissions
                const studentIds = new Set<string>();
                querySnapshot.docs.forEach(d => {
                    const data = d.data();
                    if (data.studentId) studentIds.add(data.studentId);
                });

                // Fetch user profiles for these students
                const studentNames: Record<string, string> = {};
                if (studentIds.size > 0) {
                    // Firestore 'in' query limit is 10. For MVP we'll do individual fetches if > 10 or batches. 
                    // Let's just do Promise.all for simplicity in MVP (assuming class size < 30).
                    const promises = Array.from(studentIds).map(uid => getDoc(doc(db, "users", uid)));
                    const userSnaps = await Promise.all(promises);
                    userSnaps.forEach(snap => {
                        if (snap.exists()) {
                            const uData = snap.data();
                            studentNames[snap.id] = uData.displayName || "Unknown Student";
                        }
                    });
                }

                // 4. Flatten and Enrich annotations
                let aggregated: (AnnotationData & { studentName?: string, studentId?: string })[] = [];
                querySnapshot.forEach(doc => {
                    const sub = doc.data() as Submission;
                    if (sub.annotations) {
                        const enriched = sub.annotations.map(a => ({
                            ...a,
                            studentId: sub.studentId,
                            studentName: studentNames[sub.studentId] || "Unknown Student"
                        }));
                        aggregated = [...aggregated, ...enriched];
                    }
                });

                setAllAnnotations(aggregated);

            } catch (error) {
                console.error("Error fetching heatmap data:", error);
            } finally {
                setLoading(false);
            }
        }

        if (!authLoading && !roleLoading) {
            if (role !== 'teacher') {
                router.push('/');
                return;
            }
            fetchData();
        }
    }, [classId, assignmentId, user, role, authLoading, roleLoading, router]);

    // Computed Logic
    const filteredAnnotations = selectedTag === 'All'
        ? allAnnotations
        : allAnnotations.filter(a => a.tag === selectedTag);

    const handlePhraseClick = (phrase: string, matches: AnnotationData[]) => {
        // We need to map the matches back to our enriched annotations to get names
        // Since 'matches' from HeatmapOverlay are just the raw objects, we can match by ID if they are preserved, 
        // or just filter our enriched list by the phrase.
        const enrichedMatches = allAnnotations.filter(a => a.text.trim() === phrase && (selectedTag === 'All' || a.tag === selectedTag));
        setActiveModal({ phrase, annotations: enrichedMatches });
    };

    if (loading) return <div className="p-8 text-center text-stone-400">Loading Heatmap...</div>;
    if (!assignment) return <div>Data not found.</div>;

    const tags = ["All", "I'm confused", "How/Why Question", "Self-Connection", "World-Connection"];

    return (
        <div className="bg-[#FDFBF7] min-h-screen flex flex-col font-sans">
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between shadow-sm sticky top-0 z-40 gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="font-serif font-bold text-lg text-gray-900 line-clamp-1">{assignment.title}</h1>
                        <p className="text-xs text-blue-600 font-bold uppercase tracking-wide">
                            Class Heatmap • {filteredAnnotations.length} Highlights
                        </p>
                    </div>
                </div>

                {/* Tag Filter */}
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    {tags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => setSelectedTag(tag)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border
                                ${selectedTag === tag
                                    ? 'bg-stone-800 text-white border-stone-800'
                                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                                }
                            `}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto relative">
                <DualCanvas
                    isBlurred={!!activeModal}
                    sidebar={
                        <div className="p-6 text-stone-500 text-sm">
                            <h3 className="font-bold text-stone-800 mb-4 uppercase tracking-widest text-xs">Analysis Tools</h3>
                            <p className="mb-4">Use the filters above to isolate specific types of student thinking.</p>

                            <div className="mt-4 flex flex-col gap-2">
                                <div className="text-xs font-bold uppercase tracking-wide mb-1">Density Legend</div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-red-500/30 border-b-2 border-red-500/30"></div>
                                    <span>Low (1-2 Students)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-red-500/60 border-b-2 border-red-500/60"></div>
                                    <span>Medium (3-4 Students)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-red-500 border-b-2 border-red-500"></div>
                                    <span>High (5+ Students)</span>
                                </div>
                            </div>
                        </div>
                    }
                >
                    <div className="max-w-3xl mx-auto py-12 px-4">
                        <HeatmapOverlay
                            content={assignment.content}
                            annotations={filteredAnnotations}
                            onPhraseClick={handlePhraseClick}
                        />
                    </div>
                </DualCanvas>

                {/* Interaction Modal */}
                {activeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setActiveModal(null)}>
                        <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" />
                        <div
                            className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-4 border-b border-stone-100 flex justify-between items-start bg-stone-50 rounded-t-xl">
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500 mb-1">Passage Context</h3>
                                    <p className="font-serif text-stone-800 line-clamp-2 italic">"{activeModal.phrase}"</p>
                                </div>
                                <button onClick={() => setActiveModal(null)} className="text-stone-400 hover:text-stone-600">
                                    <ArrowLeft size={20} className="rotate-180" /> {/* Simulating 'Close' X if ArrowLeft is repurposed or check lucide imports */}
                                    {/* Actually let's just grab X from lucide in imports if possible, otherwise use text */}
                                </button>
                            </div>

                            <div className="p-4 overflow-y-auto custom-scrollbar space-y-4">
                                {activeModal.annotations.map((ann, idx) => (
                                    <div key={idx} className="bg-white border border-stone-100 p-4 rounded-lg shadow-sm hover:border-stone-300 transition-colors">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-sm text-stone-800">{ann.studentName}</span>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border
                                                ${ann.tag === "I'm confused" ? 'bg-orange-50 text-orange-600 border-orange-100' : ''}
                                                ${ann.tag === 'How/Why Question' ? 'bg-purple-50 text-purple-600 border-purple-100' : ''}
                                                ${ann.tag === 'Self-Connection' ? 'bg-blue-50 text-blue-600 border-blue-100' : ''}
                                                ${ann.tag === 'World-Connection' ? 'bg-green-50 text-green-600 border-green-100' : ''}
                                            `}>
                                                {ann.tag}
                                            </span>
                                        </div>
                                        <p className="text-stone-600 text-sm leading-relaxed">{ann.note}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="p-3 border-t border-stone-100 bg-stone-50 rounded-b-xl text-center">
                                <span className="text-xs text-stone-400">{activeModal.annotations.length} thoughts on this passage</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
