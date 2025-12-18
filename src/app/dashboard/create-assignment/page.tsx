"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

export default function CreateAssignmentPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        themeImageKeyword: '',
        content: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            await addDoc(collection(db, 'assignments'), {
                ...formData,
                author: user.displayName || user.email,
                createdAt: serverTimestamp()
            });
            router.push('/dashboard');
        } catch (error) {
            console.error(error);
            alert('Failed to create assignment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] p-8 font-serif">
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-stone-500 hover:text-stone-900 mb-8 transition-colors group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Dashboard</span>
                </button>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-200">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-stone-900">Create New Assignment</h1>
                            <p className="text-stone-500 mt-1">Add a new text to your library.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title & Theme Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-stone-700">Assignment Title</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full p-3 rounded-lg border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-stone-900 outline-none transition-all"
                                    placeholder="e.g., The Industrial Revolution"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-stone-700">
                                    Theme Image Keyword
                                    <span className="ml-2 text-stone-400 font-normal text-xs">(for Unsplash)</span>
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={formData.themeImageKeyword}
                                    onChange={e => setFormData(prev => ({ ...prev, themeImageKeyword: e.target.value }))}
                                    className="w-full p-3 rounded-lg border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-stone-900 outline-none transition-all"
                                    placeholder="e.g., machinery"
                                />
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-stone-700">
                                Content
                                <span className="ml-2 text-stone-400 font-normal text-xs">(Markdown Supported)</span>
                            </label>
                            <textarea
                                required
                                value={formData.content}
                                onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                className="w-full h-96 p-4 rounded-lg border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-stone-900 outline-none transition-all font-mono text-sm leading-relaxed resize-none"
                                placeholder="# Introduction&#10;&#10;Paste your text here..."
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end pt-4 border-t border-stone-100">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-8 py-3 bg-stone-900 text-white rounded-lg font-bold hover:bg-stone-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                <span>{loading ? 'Publishing...' : 'Publish Assignment'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
