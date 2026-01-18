
"use client";

import React from 'react';
import { useProgression } from '@/hooks/useProgression';
import { useAuth } from '@/context/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SkillTree } from '@/components/features/SkillTree';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function ProfilePage() {
    const { user } = useAuth();
    const { role } = useUserRole();
    const { stats, loading } = useProgression();
    const router = useRouter();

    const toggleRole = async () => {
        if (!user) return;
        const newRole = role === 'teacher' ? 'student' : 'teacher';
        await updateDoc(doc(db, "users", user.uid), {
            role: newRole
        });
        window.location.reload(); // Refresh to apply the new role
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-[#FDFBF7] text-stone-400 font-serif gap-2"><Loader2 className="animate-spin" /> Loading Profile...</div>;
    }

    if (!user || !stats) {
        // Should redirect usually
        return <div className="p-8">Please log in.</div>;
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] p-8 font-serif">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex items-center justify-between pb-6 border-b-2 border-stone-200">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-stone-200 rounded-full text-stone-500 transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-stone-900">{user.displayName || 'Learner'}'s Profile</h1>
                            <p className="text-stone-500">Cognitive Competence Dashboard</p>
                            <button onClick={toggleRole} className="bg-orange-100 p-2 rounded text-xs font-bold mt-2 hover:bg-orange-200 transition-colors">
                                DEBUG: Switch to {role === 'teacher' ? 'Student' : 'Teacher'}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-sm text-stone-400 font-bold uppercase tracking-widest">Global Level</div>
                            <div className="text-4xl font-bold text-stone-800 leading-none">{stats.level}</div>
                        </div>
                        <div className="w-16 h-16 rounded-full bg-stone-900 text-[#FDFBF7] flex items-center justify-center font-bold text-xl border-4 border-stone-200 shadow-inner">
                            {user.displayName?.charAt(0) || 'U'}
                        </div>
                    </div>
                </header>

                {/* Main Stats Grid */}
                <main>
                    <section className="mb-12">
                        <h2 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">
                            <span className="w-2 h-8 bg-stone-900 rounded-full"></span>
                            Skill Progression
                        </h2>
                        <SkillTree stats={stats} />
                    </section>

                    {/* Quick Stats */}
                    <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-stone-100 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-stone-700">{stats.totalXp}</div>
                            <div className="text-xs text-stone-500 uppercase font-bold">Total XP</div>
                        </div>
                        <div className="bg-stone-100 p-4 rounded-lg text-center">
                            <div className="text-2xl font-bold text-stone-700">
                                {Object.values(stats.skills).reduce((acc, s) => acc + s.actions, 0)}
                            </div>
                            <div className="text-xs text-stone-500 uppercase font-bold">Total Actions</div>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
