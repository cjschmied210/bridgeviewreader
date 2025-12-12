
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp, doc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Class, Assignment } from '@/types';
import { assignments as staticAssignments } from '@/lib/assignments';
import { Send, X, Copy } from 'lucide-react';

export default function TeacherDashboard() {
    const { user, loading: authLoading } = useAuth();
    const { role, loading: roleLoading } = useUserRole();
    const router = useRouter();

    const [classes, setClasses] = useState<Class[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isCreatingClass, setIsCreatingClass] = useState(false);
    const [newClassName, setNewClassName] = useState("");
    const [seeding, setSeeding] = useState(false);

    // Assignment Distribution State
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    // Auth Protection
    useEffect(() => {
        if (!authLoading && !roleLoading) {
            if (!user) {
                router.push('/');
            } else if (role !== 'teacher') {
                // Redirect or show access denied. For now, redirect home.
                // You might want to allow them to "become" a teacher for dev purposes
                // But strict requirement says "only accessible to users with the 'Teacher' role"
                console.log("User is not a teacher:", role);
                // router.push('/'); // Uncomment to enforce
            }
        }
    }, [user, role, authLoading, roleLoading, router]);

    const fetchClasses = useCallback(async () => {
        if (!user) return;
        try {
            const q = query(collection(db, "classes"), where("teacherId", "==", user.uid));
            const querySnapshot = await getDocs(q);
            const classesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Class));
            setClasses(classesData);
        } catch (error) {
            console.error("Error fetching classes:", error);
        }
    }, [user]);

    const fetchAssignments = useCallback(async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "assignments"));
            const assignmentsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Assignment));
            setAssignments(assignmentsData);
        } catch (error) {
            console.error("Error fetching assignments:", error);
        }
    }, []);

    // Fetch Data
    useEffect(() => {
        if (user && role === 'teacher') {
            fetchClasses();
            fetchAssignments();
        }
    }, [user, role, fetchClasses, fetchAssignments]);

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newClassName.trim()) return;

        try {
            await addDoc(collection(db, "classes"), {
                name: newClassName,
                teacherId: user.uid,
                studentIds: [],
                createdAt: serverTimestamp(),
            });
            setNewClassName("");
            setIsCreatingClass(false);
            fetchClasses();
        } catch (error) {
            console.error("Error creating class:", error);
        }
    };

    const handleSeedAssignments = async () => {
        setSeeding(true);
        try {
            const batchPromises = staticAssignments.map((assignment) => {
                // Use the ID from the static file to avoid duplicates if possible, or auto-gen
                const docRef = doc(db, "assignments", assignment.id);
                return setDoc(docRef, assignment);
            });
            await Promise.all(batchPromises);
            await fetchAssignments();
            alert("Assignments seeded successfully!");
        } catch (error) {
            console.error("Error seeding assignments:", error);
            alert("Error seeding assignments.");
        } finally {
            setSeeding(false);
        }
    };

    const handleAssignToClass = async (classId: string) => {
        if (!selectedAssignmentId) return;

        try {
            const classRef = doc(db, "classes", classId);
            await updateDoc(classRef, {
                assignments: arrayUnion({
                    assignmentId: selectedAssignmentId,
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default 1 week due
                    status: 'Active'
                })
            });
            alert("Assignment distributed successfully!");
            setSelectedAssignmentId(null);
            setIsAssignModalOpen(false);
            fetchClasses(); // Refresh to show assignment counts etc if we update UI
        } catch (error) {
            console.error("Error assigning to class:", error);
            alert("Failed to assign.");
        }
    };

    if (authLoading || roleLoading) return <div className="p-8">Loading...</div>;

    if (role !== 'teacher') {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
                <p>You must be a teacher to view this page.</p>
                {/* Dev Helper: Button to become teacher */}
                <p className="mt-4 text-sm text-gray-500">Dev Mode: You user ID is {user?.uid}. Make sure your user document in &apos;users&apos; collection has role: &apos;teacher&apos;.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-10">
                    <h1 className="text-4xl font-serif font-bold text-gray-900">Teacher Dashboard</h1>
                    <div className="flex gap-4">
                        <span className="px-4 py-2 bg-white rounded-full text-sm font-medium border border-gray-200">
                            {user?.email}
                        </span>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Class Management Section */}
                    <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">My Classes</h2>
                            <button
                                onClick={() => setIsCreatingClass(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                            >
                                <span>+ New Class</span>
                            </button>
                        </div>

                        {isCreatingClass && (
                            <form onSubmit={handleCreateClass} className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Class Name</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newClassName}
                                        onChange={(e) => setNewClassName(e.target.value)}
                                        placeholder="e.g., AP Lang Period 1"
                                        className="flex-1 px-4 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Create
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingClass(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="space-y-4">
                            {classes.length === 0 ? (
                                <p className="text-gray-500 italic">No classes found. Create one to get started.</p>
                            ) : (
                                classes.map((cls) => (
                                    <div
                                        key={cls.id}
                                        onClick={() => router.push(`/dashboard/class/${cls.id}`)}
                                        className="p-4 border rounded-lg hover:border-blue-400 transition cursor-pointer bg-gray-50 hover:bg-white group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-semibold text-lg text-gray-900">{cls.name}</h3>
                                                <p className="text-sm text-gray-500">{cls.studentIds?.length || 0} Students</p>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition">
                                                <span className="text-xs text-blue-600 font-medium cursor-pointer">Manage &rarr;</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-gray-100 p-2 rounded border border-gray-200 mt-2">
                                            <span className="text-xs font-mono text-gray-500 uppercase">Join Code:</span>
                                            <code className="text-xs font-bold text-gray-800 flex-1">{cls.id}</code>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigator.clipboard.writeText(cls.id);
                                                    alert("Join Code copied to clipboard: " + cls.id);
                                                }}
                                                className="text-gray-400 hover:text-gray-700 transition"
                                                title="Copy Join Code"
                                            >
                                                <Copy size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Assignment Library Section */}
                    <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Assignment Library</h2>
                            <button
                                onClick={handleSeedAssignments}
                                disabled={seeding || assignments.length > 0}
                                className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {seeding ? "Seeding..." : "Seed from Static"}
                            </button>
                        </div>

                        <div className="space-y-4">
                            {assignments.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-gray-500 mb-2">No assignments found in Library.</p>
                                    <p className="text-xs text-gray-400">Assignments are fetched from the &apos;assignments&apos; collection.</p>
                                </div>
                            ) : (
                                assignments.map((assignment) => (
                                    <div key={assignment.id} className="p-4 border rounded-lg hover:shadow-md transition bg-white group relative">
                                        <h3 className="font-bold text-gray-800 mb-1">{assignment.title}</h3>
                                        {assignment.description && (
                                            <p className="text-sm text-gray-600 line-clamp-2">{assignment.description}</p>
                                        )}

                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    setSelectedAssignmentId(assignment.id);
                                                    setIsAssignModalOpen(true);
                                                }}
                                                className="bg-stone-900 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-stone-700"
                                            >
                                                Assign <Send size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* Assign Modal */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-serif font-bold text-xl">Distribute Assignment</h3>
                            <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-500 mb-4">Select a class to assign this text to:</p>
                            <div className="space-y-2">
                                {classes.map(cls => (
                                    <button
                                        key={cls.id}
                                        onClick={() => handleAssignToClass(cls.id)}
                                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition flex justify-between items-center group"
                                    >
                                        <span className="font-semibold text-gray-800">{cls.name}</span>
                                        <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">Select</span>
                                    </button>
                                ))}
                                {classes.length === 0 && <p className="text-center text-sm text-gray-400 italic">No classes created yet.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
