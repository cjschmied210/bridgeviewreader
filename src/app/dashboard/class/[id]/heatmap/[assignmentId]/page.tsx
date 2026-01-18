"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Assignment, Submission, AnnotationData, ReciprocalRole, ClassStreamPost } from '@/types';
import { HeatmapOverlay } from '@/components/features/HeatmapOverlay';
import { DualCanvas } from '@/components/layout/DualCanvas';
import { ThinkingSidebar } from '@/components/layout/ThinkingSidebar';
import { ArrowLeft, Filter, Users, HelpCircle, Search, PenTool, Lightbulb } from 'lucide-react';
import { onSnapshot, orderBy, updateDoc, arrayRemove, arrayUnion, deleteDoc, serverTimestamp } from 'firebase/firestore';

export default function ClassHeatmapPage() {
    const { id: classId, assignmentId } = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { role, loading: roleLoading } = useUserRole();

    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [allAnnotations, setAllAnnotations] = useState<(AnnotationData & { studentName?: string, studentId?: string, studentRole?: ReciprocalRole })[]>([]);
    const [loading, setLoading] = useState(true);
    const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
    const [streamPosts, setStreamPosts] = useState<ClassStreamPost[]>([]);

    // Interactive State
    const [selectedTag, setSelectedTag] = useState<string>('All');
    const [selectedRole, setSelectedRole] = useState<string>('All');
    const [activeModal, setActiveModal] = useState<{ phrase: string, annotations: (AnnotationData & { studentName?: string, studentRole?: ReciprocalRole })[] } | null>(null);

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

                // 4. Flatten and Enrich annotations & Calculate Role Counts
                let aggregated: (AnnotationData & { studentName?: string, studentId?: string, studentRole?: ReciprocalRole })[] = [];
                const counts: Record<string, number> = { Questioner: 0, Clarifier: 0, Summarizer: 0, Predictor: 0, None: 0 };

                querySnapshot.forEach(doc => {
                    const sub = doc.data() as Submission;
                    const role = sub.airlockData?.role || 'None';
                    // Increment unique student count per role? Or just raw count (simple for now)
                    // Let's count students per role.
                    if (counts[role] !== undefined) counts[role]++;
                    else counts['None']++; // Determine how to handle "None" if strictly typed, but "None" is fallback

                    if (sub.annotations) {
                        const enriched = sub.annotations.map(a => ({
                            ...a,
                            studentId: sub.studentId,
                            studentName: studentNames[sub.studentId] || "Unknown Student",
                            studentRole: sub.airlockData?.role
                        }));
                        aggregated = [...aggregated, ...enriched];
                    }
                });

                // Recalculate unique users per role correctly
                const uniqueRoles: Record<string, Set<string>> = { Questioner: new Set(), Clarifier: new Set(), Summarizer: new Set(), Predictor: new Set(), None: new Set() };
                querySnapshot.forEach(doc => {
                    const sub = doc.data() as Submission;
                    const r = sub.airlockData?.role || 'None';
                    if (uniqueRoles[r]) uniqueRoles[r].add(sub.studentId);
                    else uniqueRoles['None'].add(sub.studentId); // Catch all
                });

                const finalCounts: Record<string, number> = {
                    Questioner: uniqueRoles.Questioner.size,
                    Clarifier: uniqueRoles.Clarifier.size,
                    Summarizer: uniqueRoles.Summarizer.size,
                    Predictor: uniqueRoles.Predictor.size,
                    None: uniqueRoles.None.size
                };

                setRoleCounts(finalCounts);

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

    // Stream Subscription
    useEffect(() => {
        if (!classId || !assignment || !user) return;

        const q = query(
            collection(db, "class_stream"),
            where("assignmentId", "==", assignment.id),
            where("classId", "==", classId),
            orderBy("timestamp", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassStreamPost));
            setStreamPosts(posts);
        });

        return () => unsubscribe();
    }, [classId, assignment, user]);

    // Stream Handlers
    const handleLikePost = async (postId: string) => {
        if (!user) return;
        const post = streamPosts.find(p => p.id === postId);
        if (!post) return;

        const isLiked = post.likes?.includes(user.uid);
        const postRef = doc(db, "class_stream", postId);

        try {
            await updateDoc(postRef, {
                likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
            });
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) return;
        try {
            await deleteDoc(doc(db, "class_stream", postId));
        } catch (e) {
            console.error(e);
            alert("Failed to delete.");
        }
    }

    // Teacher Replies?
    const handleReplyPost = async (postId: string, content: string) => {
        if (!user) return;
        try {
            const reply = {
                id: Date.now().toString(),
                authorId: user.uid,
                authorName: user.displayName || 'Teacher', // Explicitly Teacher
                content: content,
                timestamp: { seconds: Math.floor(Date.now() / 1000) }
            };
            await updateDoc(doc(db, "class_stream", postId), {
                replies: arrayUnion(reply)
            });
        } catch (e) {
            console.error(e);
            alert("Could not reply.");
        }
    }

    // Computed Logic
    const filteredAnnotations = allAnnotations.filter(a => {
        const tagMatch = selectedTag === 'All' || a.tag === selectedTag;
        const roleMatch = selectedRole === 'All' || a.studentRole === selectedRole;
        return tagMatch && roleMatch;
    });

    const handlePhraseClick = (phrase: string, matches: AnnotationData[]) => {
        // We need to map the matches back to our enriched annotations to get names
        // Since 'matches' from HeatmapOverlay are just the raw objects, we can match by ID if they are preserved, 
        // or just filter our enriched list by the phrase.
        const enrichedMatches = allAnnotations.filter(a => {
            const phraseMatch = a.text.trim() === phrase;
            const tagMatch = selectedTag === 'All' || a.tag === selectedTag;
            const roleMatch = selectedRole === 'All' || a.studentRole === selectedRole;
            return phraseMatch && tagMatch && roleMatch;
        });
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

                {/* Role Filter */}
                <div className="flex items-center gap-2 border-r border-gray-200 pr-4 mr-2">
                    <Filter size={16} className="text-stone-400" />
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="bg-transparent text-sm font-bold text-stone-700 outline-none cursor-pointer"
                    >
                        <option value="All">All Roles</option>
                        <option value="Questioner">Questioners</option>
                        <option value="Clarifier">Clarifiers</option>
                        <option value="Summarizer">Summarizers</option>
                        <option value="Predictor">Predictors</option>
                    </select>
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
                        <ThinkingSidebar
                            isFocused={false}
                            kwlData={null}
                            annotations={[]}
                            role={undefined} // Teacher doesn't have a role
                            classStream={streamPosts}
                            onLikePost={handleLikePost}

                            // Teacher Props
                            isTeacher={true}
                            currentUserId={user?.uid}
                            onDeletePost={handleDeletePost}
                            onReplyPost={handleReplyPost}
                            onEditPost={async (postId, content) => {
                                // Teacher editing student posts? Maybe not for now, or use same logic as student
                                // For now, let's just allow it if needed, reusing logic
                                try {
                                    await updateDoc(doc(db, "class_stream", postId), { content });
                                } catch (e) { console.error(e); }
                            }}

                            // Custom Content
                            customToolsTabLabel="Analysis Tools"
                            customToolsContent={
                                <div className="p-4 text-stone-500 text-sm">
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

                                    <div className="mt-8 pt-6 border-t border-stone-200">
                                        <h3 className="font-bold text-stone-800 mb-4 uppercase tracking-widest text-xs flex items-center gap-2">
                                            <Users size={14} />
                                            Class Roles
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="flex items-center gap-2 text-orange-700"><HelpCircle size={14} /> Questioners</span>
                                                <span className="font-bold bg-stone-100 px-2 rounded-full">{roleCounts.Questioner || 0}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="flex items-center gap-2 text-blue-700"><Search size={14} /> Clarifiers</span>
                                                <span className="font-bold bg-stone-100 px-2 rounded-full">{roleCounts.Clarifier || 0}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="flex items-center gap-2 text-green-700"><PenTool size={14} /> Summarizers</span>
                                                <span className="font-bold bg-stone-100 px-2 rounded-full">{roleCounts.Summarizer || 0}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="flex items-center gap-2 text-purple-700"><Lightbulb size={14} /> Predictors</span>
                                                <span className="font-bold bg-stone-100 px-2 rounded-full">{roleCounts.Predictor || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            }
                        />
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
                                            <span className="font-bold text-sm text-stone-800 flex items-center gap-2">
                                                {ann.studentName}
                                                {ann.studentRole && (
                                                    <span className={`text-[9px] px-1.5 rounded uppercase tracking-wider font-normal border
                                                        ${ann.studentRole === 'Questioner' ? 'bg-orange-50 text-orange-600 border-orange-100' : ''}
                                                        ${ann.studentRole === 'Clarifier' ? 'bg-blue-50 text-blue-600 border-blue-100' : ''}
                                                        ${ann.studentRole === 'Summarizer' ? 'bg-green-50 text-green-600 border-green-100' : ''}
                                                        ${ann.studentRole === 'Predictor' ? 'bg-purple-50 text-purple-600 border-purple-100' : ''}
                                                    `}>
                                                        {ann.studentRole}
                                                    </span>
                                                )}
                                            </span>
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
