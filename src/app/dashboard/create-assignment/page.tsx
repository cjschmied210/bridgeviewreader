"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, Save, Sparkles, Image as ImageIcon, Languages, SlidersHorizontal, BookOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

export default function CreateAssignmentPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { role, loading: roleLoading } = useUserRole();

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [themeImageKeyword, setThemeImageKeyword] = useState('');

    // Content State
    const [content, setContent] = useState('');
    const [contentEs, setContentEs] = useState('');
    const [contentSimple, setContentSimple] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            alert("Title and Main Content are required.");
            return;
        }

        if (!user || role !== 'teacher') {
            alert("Unauthorized.");
            return;
        }

        setIsSubmitting(true);

        try {
            // Basic HTML formatting wrapper if user just types raw text
            // In a real app we'd use a Quill/Draftjs editor.
            // For MVP, we'll try to guess: if it contains <p>, leave it, else wrap lines in <p>
            const formatHtml = (text: string) => {
                if (!text.trim()) return undefined;
                if (text.includes('<p>') || text.includes('<h1>')) return text;
                return text.split('\n\n').map(para => `<p class="mb-4">${para}</p>`).join('');
            };

            await addDoc(collection(db, "assignments"), {
                title,
                description,
                themeImageKeyword: themeImageKeyword || 'books',
                content: formatHtml(content),
                contentEs: formatHtml(contentEs), // Optional
                contentSimple: formatHtml(contentSimple), // Optional
                authorId: user.uid,
                createdAt: serverTimestamp(),
            });

            alert("Assignment created successfully!");
            router.push('/dashboard');
        } catch (error) {
            console.error("Error creating assignment:", error);
            alert("Failed to create assignment.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading || roleLoading) return <div className="p-12 text-center text-stone-400">Loading Studio...</div>;
    if (role !== 'teacher') {
        router.push('/');
        return null;
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] font-sans">
            <header className="fixed top-0 inset-x-0 bg-white border-b border-stone-200 z-50">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-stone-100 rounded-full text-stone-500 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="font-serif font-bold text-lg text-stone-900">Creation Studio</h1>
                            <p className="text-xs text-stone-500 font-medium uppercase tracking-wide">New Assignment</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => router.push('/dashboard')}
                            className="px-4 py-2 text-sm font-bold text-stone-500 hover:text-stone-800"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-stone-900 text-white rounded-full font-bold hover:bg-stone-800 transition-all flex items-center gap-2 shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <span className="animate-spin text-xl">◌</span> : <Save size={18} />}
                            Publish Assignment
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-24">
                <form onSubmit={handleSubmit} className="space-y-12">

                    {/* Metadata Section */}
                    <section className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-stone-700 uppercase tracking-wide">Assignment Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="e.g., The Industrial Revolution"
                                className="w-full text-3xl font-serif font-bold p-2 border-b-2 border-stone-100 focus:border-stone-900 outline-none placeholder:text-stone-300 transition-colors bg-transparent"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-stone-700 uppercase tracking-wide">Description (Optional)</label>
                            <input
                                type="text"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="A brief overview for the student portal..."
                                className="w-full text-base p-2 border-b border-stone-100 focus:border-blue-500 outline-none transition-colors bg-transparent"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-stone-700 uppercase tracking-wide">
                                <ImageIcon size={16} />
                                Theme Image Keyword
                            </label>
                            <p className="text-xs text-stone-400">Used to fetch a mood image from Unsplash (e.g., 'factory', 'nature', 'space').</p>
                            <input
                                type="text"
                                value={themeImageKeyword}
                                onChange={e => setThemeImageKeyword(e.target.value)}
                                placeholder="e.g., factory"
                                className="w-full max-w-md p-2 bg-stone-50 rounded border border-stone-200 focus:border-stone-400 outline-none"
                            />
                        </div>
                    </section>


                    {/* Content Editor Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* Primary Content (English) */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-stone-800 border-b border-stone-200 pb-2">
                                <BookOpen size={20} />
                                <h2 className="font-bold text-lg">Main Content (English)</h2>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden focus-within:ring-2 focus-within:ring-stone-900 transition-all">
                                <textarea
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    placeholder="Paste article text here. Supports HTML (<h1>, <p>) or plain text will be auto-formatted."
                                    className="w-full h-[500px] p-6 outline-none font-serif text-lg leading-relaxed resize-none"
                                />
                            </div>
                        </section>

                        {/* Differentiation Options */}
                        <section className="space-y-8">

                            {/* Spanish Content */}
                            <div className="space-y-4 opacity-70 hover:opacity-100 transition-opacity">
                                <div className="flex items-center justify-between text-blue-700 border-b border-blue-100 pb-2">
                                    <div className="flex items-center gap-2">
                                        <Languages size={20} />
                                        <h2 className="font-bold text-lg">Spanish Translation</h2>
                                    </div>
                                    <span className="text-xs uppercase font-bold tracking-wider px-2 py-1 bg-blue-50 rounded">Optional</span>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                                    <textarea
                                        value={contentEs}
                                        onChange={e => setContentEs(e.target.value)}
                                        placeholder="Paste Spanish translation here..."
                                        className="w-full h-[200px] p-4 outline-none font-serif text-base leading-relaxed resize-none text-stone-600"
                                    />
                                </div>
                            </div>

                            {/* Simplified Content */}
                            <div className="space-y-4 opacity-70 hover:opacity-100 transition-opacity">
                                <div className="flex items-center justify-between text-purple-700 border-b border-purple-100 pb-2">
                                    <div className="flex items-center gap-2">
                                        <SlidersHorizontal size={20} />
                                        <h2 className="font-bold text-lg">Simplified Version</h2>
                                    </div>
                                    <span className="text-xs uppercase font-bold tracking-wider px-2 py-1 bg-purple-50 rounded">Optional</span>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border border-purple-100 overflow-hidden focus-within:ring-2 focus-within:ring-purple-500 transition-all">
                                    <textarea
                                        value={contentSimple}
                                        onChange={e => setContentSimple(e.target.value)}
                                        placeholder="Paste simplified/lower Lexile version here..."
                                        className="w-full h-[200px] p-4 outline-none font-serif text-base leading-relaxed resize-none text-stone-600"
                                    />
                                </div>
                            </div>

                            <div className="bg-stone-100 p-4 rounded-lg flex gap-3 text-stone-500 text-sm">
                                <Sparkles className="shrink-0" />
                                <p>Tip: You can use AI to generate the Spanish and Simplified versions after writing your main content.</p>
                            </div>

                        </section>
                    </div>

                </form>
            </main>
        </div>
    );
}
