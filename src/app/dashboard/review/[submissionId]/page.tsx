"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Submission, Assignment } from '@/types';
import { ArrowLeft, CheckCircle, MessageSquare, Save, X, BookOpen, Quote, Rocket, Brain, Flag } from 'lucide-react';

export default function ReviewSubmissionPage() {
    const { submissionId } = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { role } = useUserRole();

    const [submission, setSubmission] = useState<Submission | null>(null);
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [loading, setLoading] = useState(true);

    // Grading State
    const [teacherComment, setTeacherComment] = useState("");
    const [gradeStatus, setGradeStatus] = useState<'Pending' | 'In Progress' | 'Completed' | 'Revise'>('Pending');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function fetchData() {
            if (!submissionId) return;
            try {
                // Fetch Submission
                const subRef = doc(db, "submissions", submissionId as string);
                const subSnap = await getDoc(subRef);

                if (!subSnap.exists()) {
                    alert("Submission not found");
                    router.push('/dashboard');
                    return;
                }

                const subData = { id: subSnap.id, ...subSnap.data() } as Submission;
                setSubmission(subData);
                setTeacherComment(subData.teacherComment || "");
                setGradeStatus(subData.status || 'Pending');

                // Fetch Assignment Context
                const assignRef = doc(db, "assignments", subData.assignmentId);
                const assignSnap = await getDoc(assignRef);
                if (assignSnap.exists()) {
                    setAssignment({ id: assignSnap.id, ...assignSnap.data() } as Assignment);
                }

            } catch (error) {
                console.error("Error fetching submission:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [submissionId]);

    const handleSaveGrade = async () => {
        if (!submissionId) return;
        setIsSaving(true);
        try {
            const subRef = doc(db, "submissions", submissionId as string);
            await updateDoc(subRef, {
                teacherComment,
                status: gradeStatus,
                gradedAt: new Date().toISOString(),
                teacherId: user?.uid,
                hasPendingRevision: false
            });
            alert("Feedback saved successfully!");
            router.back();
        } catch (error) {
            console.error("Error saving grade:", error);
            alert("Failed to save feedback.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading || authLoading) return <div className="p-12 text-center text-stone-400">Loading Submission...</div>;
    if (role !== 'teacher') return <div className="p-12 text-center text-red-400">Unauthorized</div>;
    if (!submission) return null;

    return (
        <div className="min-h-screen bg-[#FDFBF7] font-serif">
            {/* Header / Toolbar */}
            <header className="fixed top-0 inset-x-0 h-16 bg-white border-b border-stone-200 z-50 flex items-center justify-between px-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-stone-100 rounded-full text-stone-500 transition">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="font-bold text-lg text-stone-900 leading-none">{assignment?.title || 'Unknown Assignment'}</h1>
                        <p className="text-xs text-stone-500 font-sans mt-1">Reviewing: <span className="font-bold text-stone-800">{submission.studentId}</span></p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-stone-100 rounded-lg p-1">
                        {(['Pending', 'Revise', 'Completed'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setGradeStatus(s)}
                                className={`px-3 py-1.5 text-xs font-bold font-sans rounded-md transition-all ${gradeStatus === s
                                    ? s === 'Completed' ? 'bg-green-100 text-green-700 shadow-sm'
                                        : s === 'Revise' ? 'bg-orange-100 text-orange-700 shadow-sm'
                                            : 'bg-white text-stone-900 shadow-sm'
                                    : 'text-stone-500 hover:text-stone-700'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleSaveGrade}
                        disabled={isSaving}
                        className="px-4 py-2 bg-stone-900 text-white rounded-lg font-sans font-bold text-sm hover:bg-stone-800 transition flex items-center gap-2"
                    >
                        {isSaving ? 'Saving...' : <><Save size={16} /> Save Feedback</>}
                    </button>
                </div>
            </header>

            <main className="pt-24 pb-12 px-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left: Student Work (Journey View) */}
                <div className="lg:col-span-2 space-y-12">

                    {/* Phase 1: Airlock (Entry) */}
                    <section className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                        <div className="bg-stone-50 border-b border-stone-100 p-4 flex items-center gap-3">
                            <div className="bg-orange-100 p-2 rounded-lg text-orange-700">
                                <Rocket size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-stone-900">Phase 1: Entry Airlock</h2>
                                <p className="text-xs text-stone-500">Pre-reading cognitive activation</p>
                            </div>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* KWL - Knowledge */}
                            <div>
                                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">What I Know (Prior Knowledge)</h3>
                                <p className="text-stone-800 bg-stone-50 p-4 rounded-lg border border-stone-100 min-h-[100px]">
                                    {submission.airlockData?.knowledge || <span className="text-stone-400 italic">No entry provided.</span>}
                                </p>
                            </div>
                            {/* KWL - Curiosity */}
                            <div>
                                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">What I Want to Know</h3>
                                <p className="text-stone-800 bg-stone-50 p-4 rounded-lg border border-stone-100 min-h-[100px]">
                                    {submission.airlockData?.curiosity || <span className="text-stone-400 italic">No entry provided.</span>}
                                </p>
                            </div>
                            {/* Priming Words */}
                            <div className="md:col-span-2">
                                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Primed Vocabulary</h3>
                                <div className="flex flex-wrap gap-2">
                                    {submission.airlockData?.primingWords?.map((word, i) => (
                                        <span key={i} className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-sm font-medium border border-stone-200">
                                            {word}
                                        </span>
                                    )) || <span className="text-stone-400 italic text-sm">No vocabulary selected.</span>}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Phase 2: Reading (Process) */}
                    <section className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                        <div className="bg-stone-50 border-b border-stone-100 p-4 flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
                                <Brain size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-stone-900">Phase 2: Deep Reading Process</h2>
                                <p className="text-xs text-stone-500">Annotations & Speed Bumps</p>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Speed Bumps */}
                            <div>
                                <h3 className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-4 pb-2 border-b border-stone-100">
                                    <Flag size={16} className="text-red-500" />
                                    Speed Bump Reflections
                                </h3>
                                <div className="space-y-4">
                                    {submission.speedBumpReflections?.length ? (
                                        submission.speedBumpReflections.map((bump, idx) => (
                                            <div key={idx} className="bg-red-50 p-4 rounded-lg border border-red-100">
                                                <div className="text-xs font-bold text-red-800 uppercase mb-1">Checkpoint #{bump.checkpointId || idx + 1}</div>
                                                <p className="text-stone-800">{bump.reflection}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-stone-400 italic text-sm">No speed bumps encountered.</p>
                                    )}
                                </div>
                            </div>

                            {/* Annotations */}
                            <div>
                                <h3 className="flex items-center gap-2 text-sm font-bold text-stone-700 mb-4 pb-2 border-b border-stone-100">
                                    <Quote size={16} className="text-blue-500" />
                                    Annotations ({submission.annotations?.length || 0})
                                </h3>
                                <div className="space-y-4">
                                    {submission.annotations?.map((note, idx) => {
                                        const isNew = submission.gradedAt && note.createdAt && note.createdAt > new Date(submission.gradedAt).getTime();
                                        return (
                                            <div key={idx} className={`p-4 rounded-lg border transition ${isNew ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200 shadow-sm' : 'bg-stone-50 border-stone-100 hover:border-blue-200'}`}>
                                                {isNew && (
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">New Revision</span>
                                                    </div>
                                                )}
                                                <div className="text-sm italic text-stone-500 mb-2 border-l-2 border-stone-300 pl-3">
                                                    "{note.text}"
                                                </div>
                                                <div className="text-stone-800 font-medium">
                                                    {note.note}
                                                </div>
                                                <div className="mt-2 flex gap-2">
                                                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${(note.tag === 'How/Why Question' || note.tag === "I'm confused") ? 'bg-orange-100 text-orange-700' :
                                                        (note.tag === 'Self-Connection' || note.tag === 'World-Connection') ? 'bg-green-100 text-green-700' :
                                                            'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {note.tag}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Phase 3: Synthesis (Output) */}
                    <section className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                        <div className="bg-stone-50 border-b border-stone-100 p-4 flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-lg text-green-700">
                                <BookOpen size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-stone-900">Phase 3: Synthesis Output</h2>
                                <p className="text-xs text-stone-500">Final Reflection & Takeaways</p>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            {submission.synthesis ? (
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-2">The Gist</h3>
                                        <p className="text-lg leading-relaxed text-stone-800 bg-stone-50 p-4 rounded-lg border border-stone-100 italic">
                                            "{submission.synthesis.gist}"
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">I Used to Think...</h3>
                                            <p className="text-base text-stone-700">{submission.synthesis.reflection1}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">But Now I Know...</h3>
                                            <p className="text-base text-stone-700">{submission.synthesis.learned}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-stone-400 italic">No synthesis submitted.</p>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right: Feedback Panel */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-stone-200 sticky top-24">
                        <h2 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
                            <MessageSquare size={20} className="text-blue-500" />
                            Teacher Feedback
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Comments</label>
                                <textarea
                                    value={teacherComment}
                                    onChange={(e) => setTeacherComment(e.target.value)}
                                    placeholder="Write your feedback here..."
                                    className="w-full h-48 p-4 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all font-sans text-sm resize-none"
                                />
                            </div>

                            <div className="pt-4 border-t border-stone-100">
                                <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Quick Actions</label>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setTeacherComment(prev => prev + "Excellent synthesis of the core ideas. ")}
                                        className="w-full text-left px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 rounded bg-white border border-stone-100 transition"
                                    >
                                        + "Excellent synthesis..."
                                    </button>
                                    <button
                                        onClick={() => setTeacherComment(prev => prev + "Please expand on *why* this changed your thinking. ")}
                                        className="w-full text-left px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 rounded bg-white border border-stone-100 transition"
                                    >
                                        + "Expand on 'Why'..."
                                    </button>
                                </div>
                            </div>

                            <div className="pt-6">
                                <button
                                    onClick={handleSaveGrade}
                                    className="w-full py-3 bg-stone-900 text-white font-bold rounded-lg hover:bg-stone-800 transition shadow-lg shadow-stone-200 flex justify-center items-center gap-2"
                                >
                                    <CheckCircle size={18} />
                                    Complete Grading
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
