
"use client";

import { useAuth } from '@/context/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogIn, BookOpen, GraduationCap, School } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function LandingPage() {
  const { user, signInWithGoogle, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const router = useRouter();
  const [isSelectingRole, setIsSelectingRole] = useState(false);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  useEffect(() => {
    // If we have a user and a role, redirect correctly
    if (user && role) {
      if (role === 'teacher') {
        router.push('/dashboard');
      } else {
        router.push('/portal');
      }
    } else if (user && !roleLoading && !role) {
      // User is logged in but no role found -> Show selection
      setIsSelectingRole(true);
    }
  }, [user, role, roleLoading, router]);

  const handleRoleSelection = async (selectedRole: 'student' | 'teacher') => {
    if (!user) return;
    setIsSubmittingRole(true);
    setSubmissionError(null);
    try {
      console.log("Attempting to save role:", selectedRole, "for user:", user.uid);
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: selectedRole,
        createdAt: serverTimestamp(),
      });
      console.log("Role saved successfully. Reloading...");
      // For MVP robustness.
      window.location.reload();
    } catch (error: any) {
      console.error("Error creating profile:", error);
      setSubmissionError(error.message || "Failed to save role. Check console for details.");
      setIsSubmittingRole(false);
    }
  };

  if (authLoading || roleLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-[#FDFBF7] text-stone-400 font-serif">Loading...</div>;
  }

  // Onboarding View
  if (isSelectingRole) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-8">
          <h1 className="text-3xl font-serif font-bold text-stone-900">Welcome, {user?.displayName?.split(' ')[0]}</h1>
          <p className="text-stone-600">Please select your role to continue.</p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleRoleSelection('student')}
              disabled={isSubmittingRole}
              className="p-6 bg-white border border-stone-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all flex flex-col items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="p-4 bg-blue-50 text-blue-600 rounded-full group-hover:scale-110 transition-transform">
                <GraduationCap size={32} />
              </div>
              <span className="font-bold text-stone-800">I am a Student</span>
            </button>

            <button
              onClick={() => handleRoleSelection('teacher')}
              disabled={isSubmittingRole}
              className="p-6 bg-white border border-stone-200 rounded-xl hover:border-amber-400 hover:shadow-lg transition-all flex flex-col items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="p-4 bg-amber-50 text-amber-600 rounded-full group-hover:scale-110 transition-transform">
                <School size={32} />
              </div>
              <span className="font-bold text-stone-800">I am a Teacher</span>
            </button>
          </div>
          {submissionError && (
            <div className="text-red-600 bg-red-50 p-3 rounded-lg text-sm mt-4">
              {submissionError}
            </div>
          )}
          {isSubmittingRole && (
            <div className="text-stone-500 text-sm mt-2 animate-pulse">
              Setting up your profile...
            </div>
          )}
        </div>
      </div>
    );
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
              <School size={18} />
              <h3>For Teachers</h3>
            </div>
            <p className="text-sm text-stone-500">Distribute scaffolding, monitor cognition, and grade with insight.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
