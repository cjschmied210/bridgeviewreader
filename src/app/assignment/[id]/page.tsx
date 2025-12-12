
"use client";

import { useState, useEffect } from "react";
import { DualCanvas } from "@/components/layout/DualCanvas";
import { ThinkingSidebar } from "@/components/layout/ThinkingSidebar";
import { EntryAirlock } from "@/components/features/EntryAirlock";
import { TextAnnotator } from "@/components/features/TextAnnotator";
import { FixUpButton } from "@/components/features/FixUpButton";
import { SynthesisDashboard } from "@/components/features/SynthesisDashboard";
import { SpeedBump } from "@/components/features/SpeedBump";
import { Assignment } from "@/types";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Class as ClassType, AirlockData, AnnotationData, SynthesisData, SpeedBumpData } from "@/types";
import { Loader2 } from "lucide-react";

export default function AssignmentPage() {
    const { user, loading: authLoading } = useAuth();
    const { role, loading: roleLoading } = useUserRole();
    const { id } = useParams();
    const router = useRouter();

    const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
    const [classId, setClassId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [phase, setPhase] = useState<'AIRLOCK' | 'READING' | 'SYNTHESIS' | 'COMPLETE'>('AIRLOCK');
    const [kwlData, setKwlData] = useState<AirlockData | null>(null);
    const [annotations, setAnnotations] = useState<AnnotationData[]>([]);
    const [speedBumpReflections, setSpeedBumpReflections] = useState<SpeedBumpData[]>([]);

    const handleAirlockComplete = (data: AirlockData) => {
        setKwlData(data);
        setPhase('READING');
    };

    const handleSpeedBumpUnlock = (index: number, reflection: string) => {
        setSpeedBumpReflections(prev => [
            ...prev,
            { checkpointId: index.toString(), reflection }
        ]);
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

            } catch (err) {
                console.error("Failed to fetch assignment:", err);
                setError("An error occurred while loading the assignment.");
            } finally {
                setLoading(false);
            }
        }

        fetchAssignmentAndValidate();
    }, [id, user, role, authLoading, roleLoading, router]);

    const handleAnnotate = (annotation: AnnotationData) => {
        setAnnotations([...annotations, annotation]);
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

            // 2. Save to Firestore
            await addDoc(collection(db, "submissions"), submissionPayload);

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

    return (
        <>
            {phase === 'AIRLOCK' && <EntryAirlock assignment={currentAssignment} onComplete={handleAirlockComplete} />}

            <DualCanvas
                sidebar={<ThinkingSidebar kwlData={kwlData} annotations={annotations} />}
                isBlurred={phase === 'AIRLOCK' || phase === 'SYNTHESIS'}
            >
                <div className={`transition-opacity duration-500 ${phase === 'SYNTHESIS' ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                    <TextAnnotator onAnnotate={handleAnnotate}>
                        {(() => {
                            const parts = currentAssignment.content.split('<hr>');
                            return (
                                <article className="space-y-8">
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
                        })()}
                        {phase === 'READING' && <FixUpButton />}

                        <div className="mt-12 mb-20 flex justify-center">
                            <button
                                onClick={handleFinishReading}
                                className="px-8 py-3 bg-stone-800 text-white font-bold rounded-full hover:bg-stone-700 transition-colors shadow-lg hover:shadow-xl"
                            >
                                Finish Reading & Synthesize
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
                    />
                </div>
            )}
        </>
    );
}
