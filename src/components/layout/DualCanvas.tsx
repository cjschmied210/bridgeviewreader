
"use client";

import React, { useState, useRef } from 'react';
import { TopNav } from './TopNav';
import { TimelineRail } from './TimelineRail';
import { EyeOff, LayoutDashboard, User, LogOut, X, Home } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, orderBy, getDoc, doc } from 'firebase/firestore';
import { useEffect } from 'react';

interface DualCanvasProps {
    children: React.ReactNode;
    sidebar: React.ReactNode;
    isBlurred?: boolean;
}

export function DualCanvas({ children, sidebar, isBlurred = false }: DualCanvasProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [isNavOpen, setIsNavOpen] = useState(false);
    const mainScrollRef = useRef<HTMLDivElement>(null);

    const { user, signOut } = useAuth();
    const { role } = useUserRole();
    const router = useRouter();

    // Data for Navigation
    const [recentWork, setRecentWork] = useState<{ id: string, title: string, status: string }[]>([]);

    useEffect(() => {
        async function fetchRecentWork() {
            if (!user || !isNavOpen || role !== 'student') return;
            try {
                // Fetch recent submissions
                const q = query(
                    collection(db, "submissions"),
                    where("studentId", "==", user.uid),
                    orderBy("submittedAt", "desc"), // or updatedAt if available
                    limit(3)
                );
                const snaps = await getDocs(q);

                // We need titles. 
                const workItems = await Promise.all(snaps.docs.map(async (d) => {
                    const subData = d.data();
                    // Fetch assignment title
                    // Optimization: We could cache this or store title in submission
                    const assignSnap = await getDoc(doc(db, "assignments", subData.assignmentId));
                    return {
                        id: subData.assignmentId,
                        title: assignSnap.exists() ? assignSnap.data().title : "Untitled Assignment",
                        status: subData.status
                    };
                }));
                setRecentWork(workItems);
            } catch (e) {
                console.error("Error fetching nav data", e);
            }
        }
        fetchRecentWork();
    }, [isNavOpen, user, role]);

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            <TopNav
                isFocused={isFocused}
                onToggleFocus={() => setIsFocused(!isFocused)}
                onMenuClick={() => setIsNavOpen(true)}
            />

            {/* Focus Mode Exit Button (Floating when focused) */}
            <button
                onClick={() => setIsFocused(false)}
                className={`fixed top-4 right-8 z-50 p-2 bg-stone-800/10 hover:bg-stone-800/20 rounded-full text-stone-600 transition-all duration-500 ${isFocused ? 'translate-y-0 opacity-100' : '-translate-y-16 opacity-0'}`}
                title="Exit Deep Work"
            >
                <EyeOff size={20} />
            </button>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Primary Text Area (Left) */}
                <div className="flex-1 relative h-full">
                    <main
                        ref={mainScrollRef}
                        className={`h-full w-full overflow-y-auto p-8 sm:p-12 lg:p-16 max-w-4xl mx-auto scroll-smooth transition-all duration-700 relative text-rendering-optimizeLegibility no-scrollbar ${isFocused ? 'scale-105' : 'scale-100'} ${isBlurred ? 'blur-md pointer-events-none' : ''}`}
                    >
                        <div className={`prose prose-lg prose-stone mx-auto transition-opacity duration-700 ${isFocused ? 'opacity-100' : 'opacity-100'}`}>
                            {children}
                        </div>
                    </main>
                    <TimelineRail containerRef={mainScrollRef} />
                </div>

                {/* Thinking Sidebar (Right) */}
                <aside className={`w-80 lg:w-96 border-l border-stone-200 bg-sidebar p-6 flex flex-col h-full overflow-y-auto shadow-inner transition-all duration-500 ${isFocused ? 'grayscale opacity-60 hover:grayscale-0 hover:opacity-100' : ''}`}>
                    {sidebar}
                </aside>

            </div>

            {/* Navigation Drawer */}
            {
                isNavOpen && (
                    <div className="fixed inset-0 z-50 flex">
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity"
                            onClick={() => setIsNavOpen(false)}
                        />

                        {/* Sidebar Panel */}
                        <div className="relative w-72 bg-[#FDFBF7] h-full shadow-2xl border-r border-stone-200 flex flex-col p-6 animate-in slide-in-from-left duration-300">
                            <button
                                onClick={() => setIsNavOpen(false)}
                                className="absolute top-4 right-4 p-2 hover:bg-stone-200 rounded-full text-stone-500 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="mb-8 mt-2">
                                <h2 className="font-serif font-bold text-xl text-stone-900">Cognitive Scaffolding</h2>
                                <p className="text-xs text-stone-500 uppercase tracking-wider font-bold mt-1">Navigation</p>
                            </div>

                            <nav className="flex-1 space-y-2">
                                <button
                                    onClick={() => router.push(role === 'teacher' ? '/dashboard' : '/portal')}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white hover:shadow-sm hover:border-stone-200 border border-transparent transition-all text-stone-700 font-bold text-sm"
                                >
                                    <LayoutDashboard size={18} />
                                    {role === 'teacher' ? 'Teacher Dashboard' : 'Student Portal'}
                                </button>
                                <button
                                    onClick={() => router.push('/profile')}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white hover:shadow-sm hover:border-stone-200 border border-transparent transition-all text-stone-700 font-bold text-sm"
                                >
                                    <User size={18} />
                                    My Profile
                                </button>
                            </nav>

                            {/* Current Work Section (Student Only) */}
                            {role === 'student' && recentWork.length > 0 && (
                                <div className="mb-4 mt-6">
                                    <p className="text-xs text-stone-500 uppercase tracking-wider font-bold mb-3 px-1">Current Work</p>
                                    <div className="space-y-4">
                                        {recentWork.map((work) => (
                                            <div key={work.id}>
                                                <button
                                                    onClick={() => {
                                                        router.push(`/assignment/${work.id}`);
                                                        setIsNavOpen(false);
                                                    }}
                                                    className="block w-full text-left font-bold text-stone-800 text-sm hover:text-blue-600 truncate mb-1"
                                                >
                                                    {work.title}
                                                </button>
                                                <div className="flex flex-col border-l-2 border-stone-200 pl-3 ml-1 gap-1">
                                                    <button
                                                        onClick={() => {
                                                            router.push(`/assignment/${work.id}?phase=AIRLOCK`);
                                                            setIsNavOpen(false);
                                                        }}
                                                        className="text-xs text-stone-500 hover:text-stone-800 text-left py-0.5"
                                                    >
                                                        1. Entry Airlock
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            router.push(`/assignment/${work.id}?phase=READING`);
                                                            setIsNavOpen(false);
                                                        }}
                                                        className="text-xs text-stone-500 hover:text-stone-800 text-left py-0.5"
                                                    >
                                                        2. Deep Reading
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            router.push(`/assignment/${work.id}?phase=SYNTHESIS`);
                                                            setIsNavOpen(false);
                                                        }}
                                                        className="text-xs text-stone-500 hover:text-stone-800 text-left py-0.5"
                                                    >
                                                        3. Synthesis
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-6 border-t border-stone-200">
                                <div className="flex items-center gap-3 mb-4 px-2">
                                    <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 font-bold text-sm">
                                        {user?.displayName?.[0] || 'U'}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-bold text-stone-900 truncate">{user?.displayName || 'User'}</p>
                                        <p className="text-xs text-stone-500 truncate">{user?.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => signOut()}
                                    className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm font-bold"
                                >
                                    <LogOut size={18} />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
