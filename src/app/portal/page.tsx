
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { BookOpen, Clock, ArrowRight, UserPlus } from 'lucide-react';
import { Class as ClassType, Assignment } from '@/types';

interface StudentAssignment extends Assignment {
    status?: 'Pending' | 'In Progress' | 'Completed';
    classId: string;
    className: string;
}

export default function StudentPortal() {
    const { user, loading: authLoading } = useAuth();
    const { role, loading: roleLoading } = useUserRole();
    const router = useRouter();

    const [enrolledClasses, setEnrolledClasses] = useState<ClassType[]>([]);
    const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
    const [joinCode, setJoinCode] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    // Auth & Role Check
    useEffect(() => {
        if (!authLoading && !roleLoading) {
            if (!user) {
                router.push('/');
            } else if (role !== 'student') {
                // If teacher tries to access, maybe redirect to dashboard or allow
                // Ideally strict separation, but for demo maybe lenient?
                // Let's redirect to dashboard if teacher.
                if (role === 'teacher') router.push('/dashboard');
            }
        }
    }, [user, role, authLoading, roleLoading, router]);

    // Data Fetching
    useEffect(() => {
        async function fetchData() {
            if (!user) return;
            try {
                // 1. Fetch classes where studentIds array-contains user.uid
                const q = query(collection(db, "classes"), where("studentIds", "array-contains", user.uid));
                const snapshot = await getDocs(q);

                const classesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassType));
                setEnrolledClasses(classesData);

                // 2. Aggregate assigned assignments from enrolled classes
                const assignedItems: { assignmentId: string; classId: string; className: string; status: 'Active' | 'Archived' | undefined }[] = [];

                classesData.forEach(cls => {
                    if (cls.assignments && Array.isArray(cls.assignments)) {
                        cls.assignments.forEach(a => {
                            assignedItems.push({
                                assignmentId: a.assignmentId,
                                classId: cls.id,
                                className: cls.name,
                                status: a.status
                            });
                        });
                    }
                });

                if (assignedItems.length === 0) {
                    setAssignments([]);
                    return;
                }

                // 3. Fetch details for each assigned item
                // Optimization: Deduplicate assignmentIds if needed, but for now we render per class-assignment pair
                // We'll fetch all unique assignment docs
                const uniqueIds = Array.from(new Set(assignedItems.map(a => a.assignmentId)));

                // Firestore 'in' query supports up to 10 items. For scalability we might need to batch or fetch individually.
                // For MVP, let's fetch individually to be safe with > 10 items or just fetch all if list is small.
                // Let's use Promise.all with individual gets for simplicity and correctness.

                const assignmentDocsPromises = uniqueIds.map(id => getDoc(doc(db, "assignments", id)));
                const assignmentDocs = await Promise.all(assignmentDocsPromises);

                const assignmentMap = new Map();
                assignmentDocs.forEach(d => {
                    if (d.exists()) {
                        assignmentMap.set(d.id, d.data());
                    }
                });

                // 3a. Fetch Submissions for this student
                // We want to see if they've submitted any of these assignments.
                // Optimally we'd query submissions where studentId == user.uid && assignmentId in uniqueIds
                // But 'in' queries are limited. Since we probably don't have thousands, let's just fetch all submissions for this student.
                const submissionsMap = new Map();
                try {
                    const submissionsQ = query(collection(db, "submissions"), where("studentId", "==", user.uid));
                    const submissionsSnap = await getDocs(submissionsQ);
                    submissionsSnap.forEach(doc => {
                        const sub = doc.data();
                        // We map by assignmentId, assuming 1 submission per assignment for now.
                        // If multiple, we take the last one or just mark as done.
                        submissionsMap.set(sub.assignmentId, true);
                    });
                } catch (e) {
                    console.error("Error fetching submissions", e);
                }

                // 4. Construct final list
                const finalAssignments: StudentAssignment[] = assignedItems.map(item => {
                    const data = assignmentMap.get(item.assignmentId);
                    if (!data) return null;

                    // Check if submitted
                    const isSubmitted = submissionsMap.has(item.assignmentId);
                    const studentStatus = isSubmitted ? 'Completed' : 'Pending';

                    return {
                        id: item.assignmentId,
                        ...data,
                        classId: item.classId,
                        className: item.className,
                        status: studentStatus
                    };
                }).filter(a => a !== null) as StudentAssignment[];

                setAssignments(finalAssignments);

            } catch (error) {
                console.error("Error fetching portal data:", error);
            } finally {
                setLoadingData(false);
            }
        }

        if (user) fetchData();
    }, [user]);

    const handleJoinClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !joinCode.trim()) return;

        try {
            // Check if class exists with this ID (simple join code = doc ID for now)
            const classRef = doc(db, "classes", joinCode.trim());
            const classSnap = await getDoc(classRef);

            if (classSnap.exists()) {
                await updateDoc(classRef, {
                    studentIds: arrayUnion(user.uid)
                });
                alert("Successfully joined class!");
                setJoinCode("");
                setIsJoining(false);
                // Refresh data (hacky reload or re-fetch)
                window.location.reload();
            } else {
                alert("Class not found. Please check the ID.");
            }
        } catch (error) {
            console.error("Error joining class:", error);
            alert("Failed to join class.");
        }
    };

    if (authLoading || roleLoading || loadingData) {
        return <div className="p-8 text-center font-serif text-stone-400">Loading Portal...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12">
            <div className="max-w-5xl mx-auto">
                <header className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-4xl font-serif font-bold text-stone-900 mb-2">Student Portal</h1>
                        <p className="text-stone-500 font-sans">Welcome back, {user?.displayName || 'Scholar'}.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setIsJoining(true)}
                            className="px-4 py-2 bg-white border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 transition flex items-center gap-2 text-sm font-bold"
                        >
                            <UserPlus size={16} />
                            Join Class
                        </button>
                    </div>
                </header>

                {isJoining && (
                    <div className="mb-8 p-6 bg-white border border-blue-100 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2">
                        <h3 className="font-bold text-lg mb-2">Join a New Class</h3>
                        <form onSubmit={handleJoinClass} className="flex gap-4">
                            <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                placeholder="Enter Class ID..."
                                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
                                Join
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsJoining(false)}
                                className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content: Assignments */}
                    <div className="lg:col-span-2 space-y-8">
                        <section>
                            <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
                                <BookOpen size={20} className="text-stone-400" />
                                Active Assignments
                            </h2>

                            <div className="space-y-4">
                                {assignments.length === 0 ? (
                                    <p className="text-stone-500 italic p-4 bg-white rounded-lg border border-dashed border-stone-200 text-center">
                                        No active assignments.
                                    </p>
                                ) : (
                                    assignments.map((assign) => (
                                        <div
                                            key={assign.id}
                                            onClick={() => router.push(`/assignment/${assign.id}`)}
                                            className="group bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer relative overflow-hidden"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                    {assign.className}
                                                </span>
                                                {assign.status === 'Completed' ? (
                                                    <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                                                        Completed
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-bold text-stone-400 flex items-center gap-1">
                                                        <Clock size={12} />
                                                        Due Soon
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="text-lg font-serif font-bold text-stone-900 group-hover:text-blue-700 transition-colors mb-2">
                                                {assign.title}
                                            </h3>

                                            <p className="text-sm text-stone-500 line-clamp-2 mb-4">
                                                {assign.description || "No description provided."}
                                            </p>

                                            <div className="flex justify-end">
                                                <span className="text-sm font-bold text-stone-400 group-hover:text-stone-800 transition-colors flex items-center gap-1">
                                                    Open Assignment <ArrowRight size={16} />
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar: Classes & Stats */}
                    <div className="space-y-8">
                        <section className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                            <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                                <BookOpen size={20} className="text-stone-400" />
                                My Classes
                            </h2>
                            <ul className="space-y-3">
                                {enrolledClasses.length === 0 ? (
                                    <li className="text-stone-500 text-sm italic">Not enrolled in any classes yet.</li>
                                ) : (
                                    enrolledClasses.map(cls => (
                                        <li key={cls.id} className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                                            <div className="font-bold text-stone-800 text-sm">{cls.name}</div>
                                            <div className="text-xs text-stone-500 font-mono mt-1">ID: {cls.id}</div>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </section>

                        <section className="bg-stone-900 p-6 rounded-xl text-stone-100 shadow-lg">
                            <h2 className="text-lg font-bold mb-4 font-serif">Growth Tracker</h2>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wide opacity-70 mb-1">
                                        <span>Words Read</span>
                                        <span>12.5k</span>
                                    </div>
                                    <div className="h-1 bg-stone-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[65%]"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wide opacity-70 mb-1">
                                        <span>Annotations</span>
                                        <span>42</span>
                                    </div>
                                    <div className="h-1 bg-stone-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 w-[30%]"></div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

            </div>
        </div>
    );
}
