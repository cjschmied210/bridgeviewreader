
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile, UserRole } from '@/types';

export function useUserRole() {
    const { user } = useAuth();
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRole() {
            if (!user) {
                setRole(null);
                setLoading(false);
                return;
            }

            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data() as UserProfile;
                    setRole(userData.role);
                } else {
                    // For now, if no document exists, default to null or handle accordingly
                    // You might want to create a default profile here if not exists
                    setRole(null);
                }
            } catch (error) {
                console.error("Error fetching user role:", error);
                setRole(null);
            } finally {
                setLoading(false);
            }
        }

        fetchRole();
    }, [user]);

    return { role, loading };
}
