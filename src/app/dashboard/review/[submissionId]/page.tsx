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
import { ArrowLeft, Save, CheckCircle, Percent } from 'lucide-react';
import { updateDoc } from 'firebase/firestore';

export default function ReviewSubmissionPage() {
    const { submissionId } = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { role, loading: roleLoading } = useUserRole();

    const [submission, setSubmission] = useState<Submission | null>(null);
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [student, setStudent] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Feedback State
    const [grade, setGrade] = useState('');
    const [feedback, setFeedback] = useState('');
    const [saving, setSaving] = useState(false);

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
                if (subData.grade) setGrade(subData.grade);
                if (subData.feedback) setFeedback(subData.feedback);

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

    const handleSaveFeedback = async () => {
        if (!submissionId) return;
        setSaving(true);
        try {
            const ref = doc(db, "submissions", submissionId as string);
            await updateDoc(ref, {
                grade: grade,
                feedback: feedback
            });
            // alert("Feedback saved!"); // Optional: Toast preferred
        } catch (e) {
            console.error(e);
            alert("Error saving feedback");
        } finally {
            setSaving(false);
        }
    };

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
                <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    <div className="px-4 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200 flex items-center gap-2">
                        Status: Completed
                    </div>
                </div>
            </div>

            {/* 3-Column Layout */}
            <div className="flex flex-1 overflow-hidden">

                {/* 1. Student Work (Center/Left) - Wide */}
                <div className="flex-1 overflow-y-auto bg-white p-8 md:p-12 relative">
                    <div className="max-w-3xl mx-auto mb-32">
                        <article
                            className="prose prose-stone prose-lg max-w-none font-serif leading-relaxed mb-16"
                            dangerouslySetInnerHTML={{ __html: assignment.content }}
                        />

                        <div className="border-t-4 border-stone-200 pt-12 bg-stone-50/50 -mx-4 md:-mx-12 px-4 md:px-12 rounded-xl">
                            <div className="max-w-2xl mx-auto">
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
                </div>

                {/* 2. Thinking Sidebar (Middle) - Fixed Width */}
                <div className="w-80 border-l border-stone-200 bg-stone-50/50 overflow-y-auto h-full hidden md:block">
                    <div className="p-4 bg-stone-100/50 border-b border-stone-200 sticky top-0 z-10 backdrop-blur-sm">
                        <h3 className="font-bold text-stone-600 text-sm uppercase tracking-wide">Thinking Trace</h3>
                    </div>
                    <div className="p-4">
                        <ThinkingSidebar
                            kwlData={submission.airlockData}
                            annotations={submission.annotations}
                        />
                    </div>
                </div>

                {/* 3. Teacher Feedback Rail (Right) - Fixed Width */}
                <div className="w-80 border-l border-stone-200 bg-white shadow-xl z-20 flex flex-col h-full">
                    <div className="p-6 bg-stone-900 text-white shrink-0">
                        <h3 className="font-serif font-bold text-lg">Grading & Feedback</h3>
                        <p className="text-xs text-stone-400 mt-1">Provide assessment for {student?.displayName?.split(' ')[0]}</p>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto space-y-8">
                        {/* Grade Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-2">
                                <Percent size={14} />
                                Grade / Score
                            </label>
                            <input
                                type="text"
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                                placeholder="e.g. 95/100 or A"
                                className="w-full text-2xl font-bold font-serif p-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-stone-300 text-stone-800"
                            />
                        </div>

                        {/* Qualitative Feedback */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Qualitative Feedback</label>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Write your feedback here..."
                                className="w-full h-64 p-4 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm leading-relaxed text-stone-700 resize-none font-sans"
                            />
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-800 leading-relaxed">
                            <p className="font-bold mb-1">Tip:</p>
                            Reference specific parts of their thinking trace or synthesis in your feedback to show you are reading closely.
                        </div>
                    </div>

                    <div className="p-6 border-t border-stone-100 bg-stone-50">
                        <button
                            onClick={handleSaveFeedback}
                            disabled={saving}
                            className="w-full py-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <span>Saving...</span>
                            ) : (
                                <>
                                    <Save size={18} />
                                    <span>Save Feedback</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
