"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Class as ClassType, UserProfile, Submission } from '@/types';
import { ArrowLeft, User, CheckCircle, Clock, SlidersHorizontal } from 'lucide-react';

export default function ClassDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { role, loading: roleLoading } = useUserRole();

    const [classData, setClassData] = useState<ClassType | null>(null);
    const [students, setStudents] = useState<UserProfile[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'assignments' | 'students'>('assignments');
    const [removing, setRemoving] = useState<string | null>(null);

    useEffect(() => {
        async function fetchClassData() {
            if (!id || !user) return;

            try {
                // 1. Fetch Class
                const classRef = doc(db, "classes", id as string);
                const classSnap = await getDoc(classRef);

                if (!classSnap.exists()) {
                    alert("Class not found");
                    router.push('/dashboard');
                    return;
                }

                const cls = { id: classSnap.id, ...classSnap.data() } as ClassType;

                // Security Check: Only the teacher of this class can view it
                if (cls.teacherId !== user.uid) {
                    alert("Unauthorized");
                    router.push('/dashboard');
                    return;
                }

                setClassData(cls);

                // 2. Fetch Students
                if (cls.studentIds && cls.studentIds.length > 0) {
                    // Fetch each student profile
                    // We assume modest class sizes. 
                    const studentPromises = cls.studentIds.map(uid => getDoc(doc(db, "users", uid)));
                    const studentSnaps = await Promise.all(studentPromises);
                    const fetchedStudents = studentSnaps
                        .filter(s => s.exists())
                        .map(s => s.data() as UserProfile);

                    setStudents(fetchedStudents);
                }

                // 3. Fetch Submissions for this class
                const subQ = query(collection(db, "submissions"), where("classId", "==", id));
                const subSnap = await getDocs(subQ);
                const subs = subSnap.docs.map(d => ({ id: d.id, ...d.data() } as Submission));
                setSubmissions(subs);

            } catch (error) {
                console.error("Error fetching class details:", error);
            } finally {
                setLoading(false);
            }
        }

        if (!authLoading && !roleLoading) {
            if (role !== 'teacher') {
                router.push('/');
                return;
            }
            fetchClassData();
        }
    }, [id, user, role, authLoading, roleLoading, router]);

    if (loading || authLoading || roleLoading) {
        return <div className="p-8 text-center text-stone-400">Loading Class Details...</div>;
    }

    if (!classData) return null;

    // Derived Data
    const assignedTasks = classData.assignments || [];
    const selectedStudent = students.find(s => s.uid === selectedStudentId);

    // Get submissions for selected student
    const studentSubmissions = selectedStudent
        ? submissions.filter(s => s.studentId === selectedStudent.uid)
        : [];

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-2 hover:bg-gray-200 rounded-full transition text-gray-500"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-serif font-bold text-gray-900">{classData.name}</h1>
                        <p className="text-gray-500 text-sm"> Manage your class roster and track assignment progress. </p>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-xs uppercase font-bold text-stone-500 tracking-wider mb-1">Class Join Code</span>
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-stone-200 shadow-sm">
                            <code className="text-xl font-bold font-mono tracking-widest text-indigo-600">{classData.id}</code>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(classData.id);
                                    alert("Join Code copied!");
                                }}
                                className="text-stone-400 hover:text-stone-800"
                                title="Copy Code"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-8 border-b border-gray-200 mb-8">
                    <button
                        onClick={() => setActiveTab('assignments')}
                        className={`pb-4 px-2 text-sm font-bold uppercase tracking-wide transition-colors relative ${activeTab === 'assignments' ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                        Assignments
                        {activeTab === 'assignments' && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-stone-900" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`pb-4 px-2 text-sm font-bold uppercase tracking-wide transition-colors relative ${activeTab === 'students' ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                        Students ({students.length})
                        {activeTab === 'students' && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-stone-900" />}
                    </button>
                </div>

                {activeTab === 'assignments' && (
                    <div className="grid grid-cols-1 gap-6">
                        {assignedTasks.length === 0 ? (
                            <div className="bg-white p-12 rounded-xl text-center border border-gray-100 shadow-sm">
                                <p className="text-gray-400 italic mb-4">No assignments distributed to this class yet.</p>
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="px-4 py-2 bg-stone-900 text-white rounded-lg font-bold text-sm hover:bg-stone-800 transition"
                                >
                                    Go to Library to Assign
                                </button>
                            </div>
                        ) : (
                            assignedTasks.map((task, idx) => {
                                // Calculate generic stats
                                const taskSubs = submissions.filter(s => s.assignmentId === task.assignmentId);
                                const completedCount = taskSubs.filter(s => s.status === 'Completed').length;

                                return (
                                    <div key={task.assignmentId} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
                                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="text-lg font-bold text-gray-900">Assignment Task {idx + 1}</h3>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${task.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                        {task.status || 'Active'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 font-mono mb-2">ID: {task.assignmentId}</p>
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Due Date'}</span>
                                                    <span className="text-gray-300">|</span>
                                                    <span className={`${completedCount === students.length && students.length > 0 ? 'text-green-600 font-bold' : ''}`}>
                                                        {completedCount} / {students.length} Submitted
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => router.push(`/dashboard/class/${id}/heatmap/${task.assignmentId}`)}
                                                    className="px-4 py-2 bg-white border border-stone-200 text-stone-700 rounded-lg text-sm font-bold hover:bg-stone-50 hover:border-stone-300 transition flex items-center gap-2"
                                                >
                                                    <Clock size={16} /> Heatmap
                                                </button>
                                                {/* Could link to a grading page here if we had one, for now linking to first sub or list? 
                                                    Actually maybe just stay here. The heatmap page is the main analytic. 
                                                    Ideally we'd have a 'Gradebook' view for this assignment. 
                                                    For now, let's keep it simple. */}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                )}

                {activeTab === 'students' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Col: Roster */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1 h-fit">
                            <h2 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                                <User size={20} className="text-gray-400" />
                                Roster
                            </h2>
                            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                {students.length === 0 ? (
                                    <p className="text-gray-400 text-sm italic">No students enrolled yet.</p>
                                ) : (
                                    students.map(student => (
                                        <button
                                            key={student.uid}
                                            onClick={() => setSelectedStudentId(student.uid)}
                                            className={`w-full text-left p-3 rounded-lg border transition flex items-center justify-between group ${selectedStudentId === student.uid
                                                ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                                                : 'bg-white border-gray-200 hover:border-blue-300'
                                                }`}
                                        >
                                            <div>
                                                <div className="font-bold text-gray-800 text-sm">{student.displayName}</div>
                                                <div className="text-xs text-gray-400">{student.email}</div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Right Col: Student Details */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2 min-h-[400px]">
                            {!selectedStudent ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-12 text-center border-2 border-dashed border-gray-100 rounded-xl">
                                    <User size={48} className="mb-4 opacity-20" />
                                    <p className="text-lg font-bold text-gray-300">Student Profile</p>
                                    <p className="text-sm">Select a student from the roster to view their individual progress.</p>
                                </div>
                            ) : (
                                <div className="animate-in fade-in slide-in-from-right-4">
                                    <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-100">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 font-serif">{selectedStudent.displayName}</h2>
                                            <p className="text-sm text-gray-500">{selectedStudent.email}</p>
                                            <p className="text-xs text-stone-400 uppercase font-bold mt-2">UID: {selectedStudent.uid}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex gap-4 text-sm text-gray-600 mb-2">
                                                <div className="text-center px-4 py-2 bg-stone-50 rounded-lg">
                                                    <div className="font-bold text-xl text-stone-900">{assignedTasks.length}</div>
                                                    <div className="text-[10px] uppercase tracking-wide text-stone-500">Assigned</div>
                                                </div>
                                                <div className="text-center px-4 py-2 bg-green-50 rounded-lg">
                                                    <div className="font-bold text-xl text-green-600">{studentSubmissions.length}</div>
                                                    <div className="text-[10px] uppercase tracking-wide text-green-600/70">Completed</div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={async () => {
                                                    if (confirm(`Are you sure you want to remove ${selectedStudent.displayName} from this class?`)) {
                                                        // In a real app we would call an API or update Firestore here
                                                        // await updateDoc(...)
                                                        alert("This feature (Remove Student) is ready for backend implementation.");
                                                    }
                                                }}
                                                className="text-xs text-red-400 hover:text-red-600 font-bold"
                                            >
                                                Remove from Class
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-widest">Submission History</h3>
                                    <div className="space-y-4">
                                        {assignedTasks.length === 0 ? (
                                            <p className="text-gray-400 italic text-sm">No assignments active for this class.</p>
                                        ) : (
                                            assignedTasks.map((task, idx) => {
                                                const submission = studentSubmissions.find(s => s.assignmentId === task.assignmentId);

                                                // --- METRICS CALCULATION ---
                                                let annotationCount = 0;
                                                let annotationLabel = 'None';
                                                let annotationColor = 'bg-gray-100 text-gray-500 border-gray-200';

                                                let synthesisWordCount = 0;

                                                if (submission) {
                                                    // Annotation Density
                                                    annotationCount = submission.annotations?.length || 0;
                                                    if (annotationCount > 0) {
                                                        if (annotationCount < 3) {
                                                            annotationLabel = 'Low Density';
                                                            annotationColor = 'bg-yellow-50 text-yellow-700 border-yellow-200';
                                                        } else if (annotationCount < 8) {
                                                            annotationLabel = 'Medium Density';
                                                            annotationColor = 'bg-blue-50 text-blue-700 border-blue-200';
                                                        } else {
                                                            annotationLabel = 'High Density';
                                                            annotationColor = 'bg-purple-50 text-purple-700 border-purple-200';
                                                        }
                                                    }

                                                    // Synthesis Effort (Word Count)
                                                    const countWords = (str: string) => str ? str.trim().split(/\\s+/).length : 0;

                                                    if (submission.synthesis) {
                                                        synthesisWordCount += countWords(submission.synthesis.gist);
                                                        synthesisWordCount += countWords(submission.synthesis.reflection1);
                                                        synthesisWordCount += countWords(submission.synthesis.learned);

                                                        submission.synthesis.reflection2?.forEach(s => synthesisWordCount += countWords(s));
                                                        submission.synthesis.reflection3?.forEach(s => synthesisWordCount += countWords(s));
                                                    }
                                                }

                                                return (
                                                    <div key={task.assignmentId} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div>
                                                                <h4 className="font-bold text-gray-800 text-sm">Assignment Task {idx + 1}</h4>
                                                                <p className="text-xs text-gray-400 font-mono mt-1">{task.assignmentId}</p>
                                                            </div>

                                                            {submission ? (
                                                                submission.hasPendingRevision ? (
                                                                    <span className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                                                                        <SlidersHorizontal size={12} /> Revised
                                                                    </span>
                                                                ) : (
                                                                    <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                                                                        <CheckCircle size={12} /> Completed
                                                                    </span>
                                                                )
                                                            ) : (
                                                                <span className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded border border-orange-200">
                                                                    <Clock size={12} /> Pending
                                                                </span>
                                                            )}
                                                        </div>

                                                        {submission ? (
                                                            <div className="grid grid-cols-2 gap-4 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                                {/* Metric 1: Annotation Density */}
                                                                <div>
                                                                    <div className="text-xs text-gray-500 mb-1 uppercase tracking-colider font-bold">Annotation Density</div>
                                                                    <div className={`text-xs font-bold px-2 py-1 rounded border w-fit ${annotationColor}`}>
                                                                        {annotationCount} Notes ({annotationLabel})
                                                                    </div>
                                                                </div>

                                                                {/* Metric 2: Synthesis Effort */}
                                                                <div>
                                                                    <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold">Synthesis Effort</div>
                                                                    <div className="flex items-baseline gap-1">
                                                                        <span className="text-lg font-bold text-gray-800">{synthesisWordCount}</span>
                                                                        <span className="text-xs text-gray-500">words written</span>
                                                                    </div>
                                                                </div>

                                                                {/* Action Footer */}
                                                                <div className="col-span-2 mt-2 pt-2 border-t border-gray-200 flex justify-end">
                                                                    <button
                                                                        className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded font-bold hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition flex items-center gap-2"
                                                                        onClick={() => router.push(`/dashboard/review/${submission.id}`)}
                                                                    >
                                                                        Review Deep Work
                                                                        <ArrowLeft size={12} className="rotate-180" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400 text-xs italic">
                                                                Waiting for student submission...
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
