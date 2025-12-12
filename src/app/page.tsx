
"use client";

import { useAuth } from '@/context/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LogIn, BookOpen, GraduationCap } from 'lucide-react';

export default function LandingPage() {
  const { user, signInWithGoogle, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (user && role) {
      if (role === 'teacher') {
        router.push('/dashboard');
      } else {
        router.push('/portal');
      }
    }
  }, [user, role, router]);

  if (authLoading || roleLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-[#FDFBF7] text-stone-400 font-serif">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-stone-900 rounded-2xl flex items-center justify-center transform rotate-3 shadow-2xl">
            <BookOpen className="text-[#FDFBF7]" size={40} />
          </div>
        </div>

        <h1 className="text-5xl md:text-6xl font-serif font-bold text-stone-900 tracking-tight leading-tight">
          Cognitive Scaffolding
          <span className="block text-stone-500 italic mt-2">Engine</span>
        </h1>

        <p className="text-xl text-stone-600 font-serif max-w-lg mx-auto leading-relaxed">
          A deep reading environment designed to replace shallow scrolling with intentional friction and active thought.
        </p>

        <div className="pt-8">
          <button
            onClick={signInWithGoogle}
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-stone-900 text-[#FDFBF7] rounded-full font-bold text-lg hover:bg-stone-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
          >
            <LogIn size={20} />
            <span>Enter Environment</span>
            <div className="absolute inset-0 rounded-full ring-2 ring-stone-900 ring-offset-2 ring-offset-[#FDFBF7] opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </div>

        <div className="pt-12 grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-lg mx-auto">
          <div className="p-4 rounded-xl bg-white border border-stone-200/60 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-stone-800 font-bold">
              <GraduationCap size={18} />
              <h3>For Students</h3>
            </div>
            <p className="text-sm text-stone-500">Access assignments, track your growth, and build deep reading habits.</p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-stone-200/60 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-stone-800 font-bold">
              <BookOpen size={18} />
              <h3>For Teachers</h3>
            </div>
            <p className="text-sm text-stone-500">Distribute scaffolding, monitor cognition, and grade with insight.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
