"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Submission, Assignment, UserProfile } from '@/types';
import { DualCanvas } from '@/components/layout/DualCanvas';
import { ThinkingSidebar } from '@/components/layout/ThinkingSidebar';
import { SynthesisDashboard } from '@/components/features/SynthesisDashboard';
import { ArrowLeft } from 'lucide-react';

export default function ReviewSubmissionPage() {
    const { submissionId } = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { role, loading: roleLoading } = useUserRole();

    const [submission, setSubmission] = useState<Submission | null>(null);
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [student, setStudent] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!submissionId || !user) return;

            try {
                // 1. Fetch Submission
                const subRef = doc(db, "submissions", submissionId as string);
                const subSnap = await getDoc(subRef);

                if (!subSnap.exists()) {
                    alert("Submission not found");
                    router.back();
                    return;
                }
                const subData = { id: subSnap.id, ...subSnap.data() } as Submission;
                setSubmission(subData);

                // 2. Fetch Assignment
                const assignRef = doc(db, "assignments", subData.assignmentId);
                const assignSnap = await getDoc(assignRef);
                if (assignSnap.exists()) {
                    setAssignment({ id: assignSnap.id, ...assignSnap.data() } as Assignment);
                }

                // 3. Fetch Student
                const studentRef = doc(db, "users", subData.studentId);
                const studentSnap = await getDoc(studentRef);
                if (studentSnap.exists()) {
                    setStudent({ uid: studentSnap.id, ...studentSnap.data() } as UserProfile);
                }

            } catch (error) {
                console.error("Error fetching review data:", error);
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
    }, [submissionId, user, role, authLoading, roleLoading, router]);

    if (loading || authLoading || roleLoading) {
        return <div className="p-8 text-center text-stone-400">Loading Submission...</div>;
    }

    if (!submission || !assignment) return <div>Error loading data.</div>;

    return (
        <div className="bg-[#FDFBF7] h-screen flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 z-50 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="font-serif font-bold text-lg text-gray-900 line-clamp-1">{assignment.title}</h1>
                        <p className="text-xs text-gray-400 font-mono">
                            Reviewing: <span className="text-gray-800 font-bold">{student?.displayName || 'Unknown Student'}</span>
                        </p>
                    </div>
                </div>
                <div className="px-4 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200 flex items-center gap-2">
                    Status: Completed
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-hidden relative">
                <DualCanvas
                    isBlurred={false}
                    sidebar={
                        <ThinkingSidebar
                            kwlData={submission.airlockData}
                            annotations={submission.annotations}
                        />
                    }
                >
                    <div className="pb-32">
                        {/* Text Content */}
                        <div className="max-w-3xl mx-auto mb-16 px-4 md:px-0">
                            <article
                                className="prose prose-stone prose-lg max-w-none font-serif leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: assignment.content }}
                            />
                        </div>

                        {/* Synthesis Review Section */}
                        <div className="border-t-4 border-stone-200 pt-12 bg-stone-50/50 -mx-4 md:-mx-12 px-4 md:px-12">
                            <div className="max-w-3xl mx-auto">
                                <h2 className="font-bold text-2xl mb-8 text-stone-400 uppercase tracking-widest text-center">Student Synthesis</h2>
                                <div className="pointer-events-none opacity-90 scale-95 origin-top">
                                    <SynthesisDashboard
                                        initialData={submission.synthesis}
                                        airlockCuriosity={submission.airlockData?.curiosity}
                                        readOnly={true}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </DualCanvas>
            </div>
        </div>
    );
}
