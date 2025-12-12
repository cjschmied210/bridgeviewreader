"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Class as ClassType, UserProfile, Submission } from '@/types';
import { ArrowLeft, User, CheckCircle, Clock } from 'lucide-react';

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
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-gray-900">{classData.name}</h1>
                        <p className="text-gray-500 text-sm flex items-center gap-2">
                            Class ID: <code className="bg-gray-100 px-2 rounded">{classData.id}</code>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Col: Roster */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1 h-fit">
                        <h2 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                            <User size={20} className="text-gray-400" />
                            Students ({students.length})
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
                                        {/* Simple completion stat? */}
                                        <div className="text-xs font-mono font-bold text-gray-400 group-hover:text-blue-500">
                                            {/* Could count submissions matched to assignments here */}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Col: Progress / Details */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2 min-h-[400px]">
                        {!selectedStudent ? (
                            <div className="animate-in fade-in slide-in-from-right-4">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Class Assignments</h2>
                                <div className="space-y-4">
                                    {assignedTasks.length === 0 ? (
                                        <p className="text-gray-400 italic">No assignments distributed to this class yet.</p>
                                    ) : (
                                        assignedTasks.map((task, idx) => (
                                            <div key={task.assignmentId} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center bg-gray-50 hover:bg-white transition shadow-sm">
                                                <div>
                                                    <h4 className="font-bold text-gray-800 text-lg">Assignment Task {idx + 1}</h4>
                                                    <p className="text-xs text-gray-400 font-mono mt-1">ID: {task.assignmentId}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => router.push(`/dashboard/class/${id}/heatmap/${task.assignmentId}`)}
                                                        className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-sm hover:bg-indigo-100 transition flex items-center gap-2"
                                                    >
                                                        <Clock size={16} /> {/* Should be Activity or similar, Clock works for now */}
                                                        Class Heatmap
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="mt-12 p-8 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400">
                                    <User size={32} className="mb-2 opacity-50" />
                                    <p>Select a student from the roster to view individual progress.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-right-4">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">{selectedStudent.displayName}</h2>
                                        <p className="text-sm text-gray-500">Student Progress</p>
                                    </div>
                                    <div className="flex gap-4 text-sm text-gray-600">
                                        <div className="text-center">
                                            <div className="font-bold text-lg">{assignedTasks.length}</div>
                                            <div className="text-xs uppercase tracking-wide">Assigned</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-lg text-green-600">{studentSubmissions.length}</div>
                                            <div className="text-xs uppercase tracking-wide">Completed</div>
                                        </div>
                                    </div>
                                </div>

                                <section>
                                    <h3 className="text-sm font-bold uppercase text-gray-400 mb-4 tracking-widest">Assignments</h3>
                                    <div className="space-y-4">
                                        {assignedTasks.length === 0 ? (
                                            <p className="text-gray-400 italic text-sm">No assignments active for this class.</p>
                                        ) : (
                                            assignedTasks.map((task, idx) => {
                                                const submission = studentSubmissions.find(s => s.assignmentId === task.assignmentId);
                                                // Fetch assignment title? We generally only have ID here in Class object. 
                                                // Ideally we'd map this. For MVP, we might display ID or fetch titles.
                                                // Let's assume we can't easily fetch all titles efficiently right now without a bulk query.
                                                // Display ID for now or "Assignment #{idx+1}"

                                                return (
                                                    <div key={task.assignmentId} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center bg-gray-50">
                                                        <div>
                                                            <h4 className="font-bold text-gray-800 text-sm">Assignment Task {idx + 1}</h4>
                                                            <p className="text-xs text-gray-400 font-mono mt-1">{task.assignmentId}</p>
                                                        </div>

                                                        {submission ? (
                                                            <div className="flex items-center gap-4">
                                                                <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                                                                    <CheckCircle size={12} /> Completed
                                                                </span>

                                                                {/* Access Work Button - Future Feature */}
                                                                <button
                                                                    className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded font-bold hover:bg-gray-100 transition"
                                                                    onClick={() => router.push(`/dashboard/review/${submission.id}`)}
                                                                >
                                                                    Review Work
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded border border-orange-200">
                                                                <Clock size={12} /> Pending
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
