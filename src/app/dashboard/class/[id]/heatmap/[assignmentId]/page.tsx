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
    const [allAnnotations, setAllAnnotations] = useState<AnnotationData[]>([]);
    const [loading, setLoading] = useState(true);

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

                // 3. Flatten all annotations
                let aggregated: AnnotationData[] = [];
                querySnapshot.forEach(doc => {
                    const sub = doc.data() as Submission;
                    if (sub.annotations) {
                        aggregated = [...aggregated, ...sub.annotations];
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

    if (loading) return <div className="p-8 text-center text-stone-400">Loading Heatmap...</div>;
    if (!assignment) return <div>Data not found.</div>;

    return (
        <div className="bg-[#FDFBF7] min-h-screen flex flex-col">
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-50">
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
                            Class Heatmap • {allAnnotations.length} Total Annotations
                        </p>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto">
                <DualCanvas
                    isBlurred={false}
                    // Sidebar is empty or could show aggregate stats/top questions
                    sidebar={
                        <div className="p-6 text-stone-500 text-sm">
                            <h3 className="font-bold text-stone-800 mb-4 uppercase tracking-widest text-xs">Analytics</h3>
                            <p>This view visualizes reading activity intensity.</p>
                            <div className="mt-4 flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-red-500/20 border-b-2 border-red-500/20"></div>
                                    <span>Low Activity</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-red-500/90 border-b-2 border-red-500/90"></div>
                                    <span>High Activity</span>
                                </div>
                            </div>
                        </div>
                    }
                >
                    <div className="max-w-3xl mx-auto py-12 px-4">
                        <HeatmapOverlay content={assignment.content} annotations={allAnnotations} />
                    </div>
                </DualCanvas>
            </div>
        </div>
    );
}
