
import React from 'react';
import { Eye, Menu, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface TopNavProps {
    onToggleFocus: () => void;
    isFocused: boolean;
}

export function TopNav({ onToggleFocus, isFocused }: TopNavProps) {
    const { user, signInWithGoogle, signOut } = useAuth();

    return (
        <header className={`h-16 border-b border-stone-200 flex items-center justify-between px-8 bg-[#FDFBF7] transition-all duration-500 ${isFocused ? '-mt-16 opacity-0 pointer-events-none' : 'mt-0 opacity-100'}`}>
            <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-stone-100 rounded-md text-stone-600">
                    <Menu size={20} />
                </button>
                <span className="font-serif font-bold text-lg text-stone-800 tracking-tight">Cognitive Scaffolding Engine</span>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={onToggleFocus}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-sans font-medium transition-colors"
                >
                    <Eye size={14} />
                    <span>Deep Work</span>
                </button>

                {user ? (
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-stone-500 font-sans hidden sm:inline">{user.email}</span>
                        <button
                            onClick={signOut}
                            className="w-8 h-8 rounded-full bg-stone-800 text-white flex items-center justify-center hover:bg-stone-700 transition-colors"
                            title="Sign Out"
                        >
                            <LogOut size={14} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={signInWithGoogle}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900 text-white hover:bg-stone-800 text-xs font-sans font-bold transition-colors"
                    >
                        <LogIn size={14} />
                        <span>Sign In</span>
                    </button>
                )}
            </div>
        </header>
    );
}
