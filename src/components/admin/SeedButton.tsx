
import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, writeBatch, doc, getDocs } from 'firebase/firestore';
import { assignments } from '@/lib/assignments';
import { Database, Check, Loader2 } from 'lucide-react';

export function SeedButton() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');

    const handleSeed = async () => {
        setLoading(true);
        setStatus('idle');
        try {
            const collectionRef = collection(db, 'assignments');
            const snapshot = await getDocs(collectionRef);

            if (!snapshot.empty) {
                // For safety in this demo, avoid duplicates if already seeded
                const count = snapshot.size;
                setMsg(`Found ${count} existing assignments.`);
                setStatus('success');
                setLoading(false);
                return;
            }

            const batch = writeBatch(db);

            assignments.forEach((assignment) => {
                // Create a ref with the specific ID to keep URLs consistent if we used IDs
                // Or just let Firestore generate key.
                // Let's use the local ID as the doc ID for consistency.
                const docRef = doc(db, 'assignments', assignment.id);
                batch.set(docRef, {
                    title: assignment.title,
                    content: assignment.content,
                    themeImageKeyword: assignment.themeImageKeyword,
                    author: 'System',
                    createdAt: new Date()
                });
            });

            await batch.commit();
            setMsg(`Seeded ${assignments.length} assignments.`);
            setStatus('success');
        } catch (err: unknown) {
            console.error(err);
            setStatus('error');
            if (err instanceof Error) {
                setMsg(err.message);
            } else {
                setMsg('An unknown error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-4 left-4 z-50">
            <button
                onClick={handleSeed}
                disabled={loading}
                className="flex items-center gap-2 p-3 bg-stone-900 text-white rounded-lg shadow-xl hover:bg-stone-800 transition-colors text-xs font-mono"
            >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
                {status === 'success' ? <Check size={14} className="text-green-400" /> : null}
                {loading ? 'Seeding...' : 'Seed Database'}
            </button>
            {msg && (
                <div className="absolute left-0 bottom-full mb-2 bg-stone-800 text-white text-[10px] p-2 rounded whitespace-nowrap">
                    {msg}
                </div>
            )}
        </div>
    );
}
