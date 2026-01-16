
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { SkillType, UserStats } from '@/types';

const INITIAL_STATS: UserStats = {
    userId: '',
    level: 1,
    totalXp: 0,
    skills: {
        'Questioner': { xp: 0, level: 1, actions: 0 },
        'Clarifier': { xp: 0, level: 1, actions: 0 },
        'Summarizer': { xp: 0, level: 1, actions: 0 },
        'Predictor': { xp: 0, level: 1, actions: 0 },
        'DeepReader': { xp: 0, level: 1, actions: 0 }
    },
    badges: [],
    lastActive: null
};

// Leveling curve: Level N requires N * 100 XP
const XP_PER_LEVEL = 100;

export function useProgression() {
    const { user } = useAuth();
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const fetchStats = async () => {
            try {
                const docRef = doc(db, 'user_stats', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setStats(docSnap.data() as UserStats);
                } else {
                    // Initialize if new
                    const newStats = { ...INITIAL_STATS, userId: user.uid, lastActive: serverTimestamp() };
                    await setDoc(docRef, newStats);
                    setStats(newStats);
                }
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user]);

    const awardXP = async (skill: SkillType, amount: number) => {
        if (!user || !stats) return;

        const currentSkill = stats.skills[skill] || { xp: 0, level: 1, actions: 0 };
        const newSkillXp = currentSkill.xp + amount;

        // Simple Level Up Logic
        const newSkillLevel = Math.floor(newSkillXp / XP_PER_LEVEL) + 1;
        const skillLevelUp = newSkillLevel > currentSkill.level;

        const newTotalXp = stats.totalXp + amount;
        const newTotalLevel = Math.floor(newTotalXp / (XP_PER_LEVEL * 2)) + 1; // Global level harder?

        const updates: any = {
            [`skills.${skill}.xp`]: increment(amount),
            [`skills.${skill}.actions`]: increment(1),
            [`skills.${skill}.level`]: newSkillLevel, // Directly set calculated level
            totalXp: increment(amount),
            level: newTotalLevel,
            lastActive: serverTimestamp()
        };

        try {
            await updateDoc(doc(db, 'user_stats', user.uid), updates);

            // Optimistic update
            setStats(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    totalXp: prev.totalXp + amount,
                    level: newTotalLevel,
                    skills: {
                        ...prev.skills,
                        [skill]: {
                            xp: prev.skills[skill].xp + amount,
                            actions: prev.skills[skill].actions + 1,
                            level: newSkillLevel
                        }
                    }
                };
            });

            if (skillLevelUp) {
                // Could trigger a toast notification here
                console.log(`Leveled up ${skill} to ${newSkillLevel}!`);
            }

        } catch (error) {
            console.error("Error awarding XP:", error);
        }
    };

    return { stats, loading, awardXP };
}
