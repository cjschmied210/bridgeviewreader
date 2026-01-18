
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { DualCanvas } from "@/components/layout/DualCanvas";
import { ThinkingSidebar } from "@/components/layout/ThinkingSidebar";
import { EntryAirlock } from "@/components/features/EntryAirlock";
import { TextAnnotator } from "@/components/features/TextAnnotator";
import { FixUpButton } from "@/components/features/FixUpButton";
import { SynthesisDashboard } from "@/components/features/SynthesisDashboard";
import { SpeedBump } from "@/components/features/SpeedBump";
import { Assignment, Submission } from "@/types";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, onSnapshot, orderBy } from "firebase/firestore";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useTextReader } from "@/hooks/useTextReader";
import { Class as ClassType, AirlockData, AnnotationData, SynthesisData, SpeedBumpData, ReciprocalRole, ClassStreamPost } from "@/types";

import { Loader2, Languages, Volume2, VolumeX, SlidersHorizontal } from "lucide-react";
import { useProgression } from "@/hooks/useProgression";

export default function AssignmentPage() {
    const { user, loading: authLoading } = useAuth();
    const { awardXP } = useProgression();


    const { role, loading: roleLoading } = useUserRole();
    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const requestedPhase = searchParams.get('phase');

    const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
    const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null);
    const [classId, setClassId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [phase, setPhase] = useState<'AIRLOCK' | 'READING' | 'SYNTHESIS' | 'COMPLETE'>('AIRLOCK');
    const [kwlData, setKwlData] = useState<AirlockData | null>(null);
    const [reciprocalRole, setReciprocalRole] = useState<ReciprocalRole | undefined>();
    const [annotations, setAnnotations] = useState<AnnotationData[]>([]);
    const [speedBumpReflections, setSpeedBumpReflections] = useState<SpeedBumpData[]>([]);
    const [streamPosts, setStreamPosts] = useState<ClassStreamPost[]>([]);

    const [focusedAnnotationId, setFocusedAnnotationId] = useState<string | null>(null);
    const [isRevisionMode, setIsRevisionMode] = useState(false);

    // ELL Support State
    const [isSpanish, setIsSpanish] = useState(false);
    const [spanishContent, setSpanishContent] = useState<string | null>(null);
    const [translating, setTranslating] = useState(false);
    const [isSimplified, setIsSimplified] = useState(false);

    const contentRef = useRef<HTMLElement>(null);
    const { isReading, highlightRect, speak, cancel } = useTextReader();

    // Simplified ELL Support: Toggle between content and contentEs
    // We no longer need to fetch translation if it's already in the assignment data

    const toggleReadAloud = () => {
        if (isReading) {
            cancel();
        } else {
            if (contentRef.current) {
                speak(contentRef.current, isSpanish ? 'es' : 'en');
            }
        }
    };

    const assignmentContent = useMemo(() => {
        if (!currentAssignment) return null;

        // Use pre-loaded Spanish content if available, otherwise fallback to English
        // Priority: Spanish -> Simplified -> Standard
        let contentToRender = currentAssignment.content;
        if (isSpanish && currentAssignment.contentEs) {
            contentToRender = currentAssignment.contentEs;
        } else if (isSimplified && currentAssignment.contentSimple && !isSpanish) {
            contentToRender = currentAssignment.contentSimple;
        }
        const parts = contentToRender.split('<hr>');
        return (
            <article ref={contentRef} className="space-y-8">
                {/* First part is always visible */}
                <div dangerouslySetInnerHTML={{ __html: parts[0] }} />

                {/* Subsequent parts are wrapped in SpeedBumps */}
                {parts.slice(1).map((part, index) => (
                    <SpeedBump key={index}>
                        <div dangerouslySetInnerHTML={{ __html: part }} />
                    </SpeedBump>
                ))}
            </article>
        );
    }, [currentAssignment, isSpanish, isSimplified]); // Added dependency
    const handleAirlockComplete = (data: AirlockData) => {
        setKwlData(data);
        if (data.role) setReciprocalRole(data.role);
        setPhase('READING');
    };

    const handleSpeedBumpUnlock = (index: number, reflection: string) => {
        setSpeedBumpReflections(prev => [
            ...prev,
            { checkpointId: index.toString(), reflection }
        ]);
    };

    const handleAnnotationClick = (id: string) => {
        setFocusedAnnotationId(id);
    };
    // Auth & Assignment Validation
    useEffect(() => {
        async function fetchAssignmentAndValidate() {
            if (authLoading || roleLoading) return;

            if (!user) {
                router.push('/');
                return;
            }

            if (!id) return;

            setLoading(true);
            setError(null);

            try {
                // 1. Fetch the assignment itself
                const docRef = doc(db, 'assignments', id as string);
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists()) {
                    setError("Assignment not found.");
                    setLoading(false);
                    return;
                }

                // 2. Validate Access
                let hasAccess = false;

                if (role === 'teacher') {
                    // Teachers have global access for now (or at least to their own classes' assignments, but global is easier for MVP)
                    hasAccess = true;
                } else if (role === 'student') {
                    // Check if student is in a class that has this assignment
                    const q = query(collection(db, "classes"), where("studentIds", "array-contains", user.uid));
                    const classesSnap = await getDocs(q);

                    for (const clsDoc of classesSnap.docs) {
                        const clsData = clsDoc.data() as ClassType;
                        if (clsData.assignments?.some(a => a.assignmentId === id)) {
                            hasAccess = true;
                            setClassId(clsDoc.id);
                            break;
                        }
                    }
                }

                if (!hasAccess) {
                    setError("You do not have access to this assignment. Please check your Portal.");
                    setLoading(false);
                    return;
                }

                setCurrentAssignment({ id: docSnap.id, ...docSnap.data() } as Assignment);

                // 3. Check for existing submission
                const subQ = query(
                    collection(db, "submissions"),
                    where("assignmentId", "==", id),
                    where("studentId", "==", user.uid)
                );
                const subSnap = await getDocs(subQ);
                if (!subSnap.empty) {
                    const subData = { id: subSnap.docs[0].id, ...subSnap.docs[0].data() } as Submission;
                    setExistingSubmission(subData);

                    // Hydrate State from Submission
                    if (subData.annotations) setAnnotations(subData.annotations);
                    if (subData.airlockData) setKwlData(subData.airlockData);
                    if (subData.speedBumpReflections) setSpeedBumpReflections(subData.speedBumpReflections);
                    if (subData.airlockData?.role) setReciprocalRole(subData.airlockData.role);
                }

            } catch (err) {
                console.error("Failed to fetch assignment:", err);
                setError("An error occurred while loading the assignment.");
            } finally {
                setLoading(false);
            }
        }

        fetchAssignmentAndValidate();
    }, [id, user, role, authLoading, roleLoading, router]); // Keep dependencies minimal for fetch

    // Handle Phase Navigation via URL
    useEffect(() => {
        if (!existingSubmission) return;

        if (requestedPhase === 'AIRLOCK') {
            setPhase('AIRLOCK');
        } else if (requestedPhase === 'READING') {
            setPhase('READING');
        } else if (requestedPhase === 'SYNTHESIS') {
            setPhase('SYNTHESIS');
        } else {
            // If no phase is specified but we have a submission, default to READING
            // This happens on initial load or if navigating to the base assignment URL
            setPhase('READING');
        }
    }, [requestedPhase, existingSubmission]);

    // Construct Stream Subscription
    useEffect(() => {
        if (!classId || !currentAssignment) return;

        const q = query(
            collection(db, "class_stream"),
            where("assignmentId", "==", currentAssignment.id),
            where("classId", "==", classId),
            orderBy("timestamp", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassStreamPost));
            setStreamPosts(posts);
        });

        return () => unsubscribe();
    }, [classId, currentAssignment]);

    const handlePostStream = async (content: string, tool: ClassStreamPost['activeTool']) => {
        if (!user || !currentAssignment || !classId || !reciprocalRole) return;

        try {
            await addDoc(collection(db, "class_stream"), {
                assignmentId: currentAssignment.id,
                classId: classId,
                studentId: user.uid,
                studentName: user.displayName || 'Anonymous',
                role: reciprocalRole,
                activeTool: tool,
                content: content,
                timestamp: serverTimestamp(),
                likes: []
            });

            // Award XP for posting
            awardXP(tool, 10);

        } catch (error) {
            console.error("Error posting to stream:", error);
            alert("Failed to post to class stream.");
        }
    };

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
        if (!user) return;
        if (!confirm("Are you sure you want to delete this post?")) return;

        try {
            const { deleteDoc } = await import("firebase/firestore");
            await deleteDoc(doc(db, "class_stream", postId));
        } catch (e) {
            console.error(e);
            alert("Failed to delete.");
        }
    };

    const handleEditPost = async (postId: string, newContent: string) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, "class_stream", postId), {
                content: newContent,
                // isEdited: true 
            });
        } catch (e) {
            console.error(e);
            alert("Could not update post.");
        }
    }

    const handleReplyPost = async (postId: string, content: string) => {
        if (!user) return;
        try {
            const reply = {
                id: Date.now().toString(),
                authorId: user.uid,
                authorName: user.displayName || 'Anonymous',
                content: content,
                timestamp: { seconds: Math.floor(Date.now() / 1000) } // Mock Timestamp for now
            };

            await updateDoc(doc(db, "class_stream", postId), {
                replies: arrayUnion(reply)
            });
            // awardXP('Collaborator', 5); // Invalid skill type, skipping for now
        } catch (e) {
            console.error(e);
            alert("Could not reply.");
        }
    }

    const handleAnnotate = (annotation: AnnotationData) => {
        setAnnotations([...annotations, annotation]);
        awardXP('DeepReader', 5);
    };

    const handleFinishReading = () => {
        setPhase('SYNTHESIS');
    };

    const handleSynthesisComplete = async (synthesisData: SynthesisData) => {
        if (!user || !currentAssignment || !kwlData) return;

        try {
            // Find classId
            // Optimization: We re-fetch or pass it down. 
            // For now, let's re-query effectively or default to 'unknown' if we can't find it quickly, 
            // but we really should store it from validation step.
            // Let's optimize by just finding the class again or storing it in state.
            // We'll do a quick lookup again, or since we validated access, we know they have ONE class with this assignment.
            // (Assuming 1:1 for MVP simplicty, although m:n is possible).

            // To be robust: fetch class ID again or store it in state during validation. 
            // Let's modify validation to store classId.

            // Actually, let's just save. The portal can filter by user ID.

            // 1. Construct Submission
            const submissionPayload = {
                assignmentId: currentAssignment.id,
                studentId: user.uid,
                classId: classId || 'unknown',
                airlockData: kwlData,
                annotations: annotations,
                speedBumpReflections: speedBumpReflections,
                synthesis: synthesisData,
                submittedAt: serverTimestamp(),
                status: 'Completed'
            };

            // 2. Save/Update Firestore
            if (existingSubmission) {
                // UPDATE existing submission
                const subRef = doc(db, "submissions", existingSubmission.id);
                await updateDoc(subRef, {
                    ...submissionPayload,
                    hasPendingRevision: true,
                    revisionCount: (existingSubmission.revisionCount || 0) + 1,
                    lastRevisedAt: serverTimestamp() // Add a specific field for revision time if needed
                });
            } else {
                // CREATE new submission
                await addDoc(collection(db, "submissions"), submissionPayload);
            }

            setPhase('COMPLETE');
        } catch (e) {
            console.error("Error saving submission:", e);
            alert("Failed to submit assignment. Please try again.");
        }
    };

    if (phase === 'COMPLETE') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#FDFBF7]">
                <div className="text-center">
                    <h1 className="font-serif text-4xl font-bold mb-4">Assignment Completed</h1>
                    <p className="text-stone-600">Great job scafolding your cognition!</p>
                    <button onClick={() => router.push('/portal')} className="mt-8 text-sm underline text-stone-400">Return to Portal</button>
                </div>
            </div>
        )
    }

    if (loading || authLoading || roleLoading) {
        return <div className="flex h-screen items-center justify-center bg-[#FDFBF7] text-stone-400 font-serif gap-2"><Loader2 className="animate-spin" /> Loading Scaffolding Engine...</div>;
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#FDFBF7] text-stone-600 font-serif flex-col gap-4">
                <p className="text-xl">{error}</p>
                <button onClick={() => router.push('/portal')} className="underline">Return to Portal</button>
            </div>
        );
    }

    if (!currentAssignment) return null;

    // --- VIEW: FEEDBACK / RESULTS MODE ---
    // If status is Completed, show the Grade Report UNLESS we are in Revision Mode
    if ((existingSubmission?.status === 'Completed' || existingSubmission?.status === 'Pending') && !isRevisionMode) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] p-8 font-serif">
                <div className="max-w-4xl mx-auto space-y-8">
                    <header className="flex items-center justify-between border-b-2 border-stone-200 pb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-stone-900">{currentAssignment.title}</h1>
                            <p className="text-stone-500">Submission Report</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsRevisionMode(true)}
                                className="px-4 py-2 text-sm font-bold bg-stone-900 text-white hover:bg-stone-800 rounded-lg transition flex items-center gap-2"
                            >
                                <SlidersHorizontal size={16} /> Review & Revise
                            </button>
                            <button onClick={() => router.push('/portal')} className="px-4 py-2 text-sm font-bold bg-stone-100 hover:bg-stone-200 rounded-lg transition">
                                Back to Portal
                            </button>
                        </div>
                    </header>

                    {/* Status Banner */}
                    <div className={`p-6 rounded-xl border-2 flex items-center gap-4 ${existingSubmission!.status === 'Completed'
                        ? 'bg-green-50 border-green-100 text-green-800'
                        : 'bg-orange-50 border-orange-100 text-orange-800'
                        }`}>
                        {existingSubmission!.status === 'Completed' ? (
                            <>
                                <div className="p-2 bg-white rounded-full"><SlidersHorizontal size={24} className="text-green-600" /></div>
                                <div>
                                    <h3 className="font-bold text-lg">Graded & Reviewed</h3>
                                    <p className="text-sm opacity-90">Your work has been reviewed by the teacher.</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-2 bg-white rounded-full"><Loader2 size={24} className="animate-spin text-orange-600" /></div>
                                <div>
                                    <h3 className="font-bold text-lg">Submission Pending Review</h3>
                                    <p className="text-sm opacity-90">Your teacher hasn't graded this yet. Check back later!</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Teacher Feedback Section (Only if Completed) */}
                    {
                        existingSubmission!.status === 'Completed' && existingSubmission!.teacherComment && (
                            <section className="bg-white p-8 rounded-xl shadow-sm border border-stone-200 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                                <h3 className="font-bold text-stone-900 text-xl mb-4 flex items-center gap-2">
                                    Teacher Feedback
                                </h3>
                                <p className="text-lg leading-relaxed text-stone-700 font-sans">
                                    {existingSubmission!.teacherComment}
                                </p>
                            </section>
                        )
                    }

                    {/* Student Work Reflection */}
                    <section className="bg-white p-8 rounded-xl shadow-sm border border-stone-100 opacity-80">
                        <h3 className="font-bold text-stone-400 uppercase tracking-widest text-sm mb-6">Your Synthesis</h3>
                        <div className="space-y-6">
                            <div>
                                <span className="text-xs font-bold text-stone-400 uppercase">The Gist</span>
                                <p className="text-xl font-bold text-stone-800 italic">"{existingSubmission!.synthesis.gist}"</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs font-bold text-stone-400 uppercase">I Used to Think...</span>
                                    <p className="text-stone-700">{existingSubmission!.synthesis.reflection1}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-stone-400 uppercase">But Now I Know...</span>
                                    <p className="text-stone-700">{existingSubmission!.synthesis.learned}</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* Revision Banner */}
            {existingSubmission?.status === 'Revise' && (
                <div className="bg-orange-600 text-white px-6 py-3 font-bold text-center sticky top-0 z-50 shadow-md flex items-center justify-center gap-2">
                    <SlidersHorizontal size={18} />
                    <span>Teacher Request: Please Revise & Resubmit.</span>
                    {existingSubmission.teacherComment && (
                        <span className="font-normal opacity-90 text-sm ml-2">"{existingSubmission.teacherComment}"</span>
                    )}
                </div>
            )}

            {phase === 'AIRLOCK' && <EntryAirlock assignment={currentAssignment} onComplete={handleAirlockComplete} />}

            <DualCanvas
                sidebar={
                    <ThinkingSidebar
                        isSpanish={isSpanish}
                        kwlData={kwlData}
                        annotations={annotations}
                        onAnnotationClick={handleAnnotationClick}
                        role={reciprocalRole}
                        classStream={streamPosts}
                        onPostStream={handlePostStream}
                        onLikePost={handleLikePost}
                        // New Props
                        currentUserId={user?.uid}
                        isTeacher={role === 'teacher'}
                        onDeletePost={handleDeletePost}
                        onEditPost={handleEditPost}
                        onReplyPost={handleReplyPost}
                    />
                }
                isBlurred={phase === 'AIRLOCK' || phase === 'SYNTHESIS'}
            >
                <div className={`transition-opacity duration-500 ${phase === 'SYNTHESIS' ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>

                    {/* Access Tools Control Bar */}
                    {phase === 'READING' && (
                        <div className="flex justify-end gap-2 mb-4 sticky top-0 z-40 bg-[#FDFBF7]/80 backdrop-blur-sm p-2 rounded-xl">
                            <button
                                onClick={() => setIsSpanish(!isSpanish)}
                                disabled={!currentAssignment.contentEs} // Disable if no Spanish content
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold ${isSpanish ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'} ${!currentAssignment.contentEs ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={!currentAssignment.contentEs ? "No Spanish translation available" : "Toggle English/Spanish"}
                            >
                                <Languages size={14} />
                                {isSpanish ? 'Español' : 'English'}
                            </button>

                            <button
                                onClick={() => setIsSimplified(!isSimplified)}
                                disabled={isSpanish || !currentAssignment.contentSimple}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold 
                                    ${isSimplified ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'} 
                                    ${(isSpanish || !currentAssignment.contentSimple) ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                                title={isSpanish ? "Not available in Spanish mode" : (!currentAssignment.contentSimple ? "No simplified version available" : "Toggle Text Complexity")}
                            >
                                <SlidersHorizontal size={14} />
                                {isSimplified ? 'Simplified' : 'Simplify'}
                            </button>

                            <button
                                onClick={toggleReadAloud}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold ${isReading ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}
                            >
                                {isReading ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                {isReading ? (isSpanish ? 'Detener Lectura' : 'Stop Reading') : (isSpanish ? 'Leer en Voz Alta' : 'Read Aloud')}
                            </button>
                        </div>
                    )}

                    {/* Karaoke Highlight Overlay */}
                    {isReading && highlightRect && createPortal(
                        <div
                            className="fixed z-30 bg-amber-300/30 border-b-2 border-amber-400 pointer-events-none transition-all duration-75 ease-linear rounded-sm mix-blend-multiply"
                            style={{
                                top: highlightRect.top,
                                left: highlightRect.left,
                                width: highlightRect.width,
                                height: highlightRect.height,
                            }}
                        />,
                        document.body
                    )}

                    <TextAnnotator onAnnotate={handleAnnotate} focusedAnnotationId={focusedAnnotationId} userRole={reciprocalRole} annotations={annotations}>
                        {assignmentContent}
                        {phase === 'READING' && <FixUpButton />}

                        <div className="mt-12 mb-20 flex justify-center">
                            <button
                                onClick={handleFinishReading}
                                className="px-8 py-3 bg-stone-800 text-white font-bold rounded-full hover:bg-stone-700 transition-colors shadow-lg hover:shadow-xl"
                            >
                                {isRevisionMode ? "Review Updates & Resubmit" : "Finish Reading & Synthesize"}
                            </button>
                        </div>
                    </TextAnnotator>
                </div>
            </DualCanvas>

            {phase === 'SYNTHESIS' && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/10 backdrop-blur-sm">
                    <SynthesisDashboard
                        onComplete={handleSynthesisComplete}
                        airlockCuriosity={kwlData?.curiosity}
                        userRole={reciprocalRole}
                        initialData={existingSubmission?.synthesis}
                    />
                </div>
            )}
        </>
    );
}
