'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export function useFavorites() {
    const { user } = useAuth();
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setFavoriteIds(new Set());
            setLoading(false);
            return;
        }

        const favsCollectionRef = collection(db, 'users', user.uid, 'favorites');
        const unsubscribe = onSnapshot(favsCollectionRef, (snapshot) => {
            const ids = new Set<string>();
            snapshot.forEach((doc) => {
                ids.add(doc.id);
            });
            setFavoriteIds(ids);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching favorites: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addFavorite = useCallback(async (listingId: string) => {
        if (!user) return;
        try {
            const favDocRef = doc(db, 'users', user.uid, 'favorites', listingId);
            await setDoc(favDocRef, {
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error adding favorite: ", error);
        }
    }, [user]);

    const removeFavorite = useCallback(async (listingId: string) => {
        if (!user) return;
        try {
            const favDocRef = doc(db, 'users', user.uid, 'favorites', listingId);
            await deleteDoc(favDocRef);
        } catch (error) {
            console.error("Error removing favorite: ", error);
        }
    }, [user]);

    const isFavorite = (listingId: string) => favoriteIds.has(listingId);

    return { favoriteIds, addFavorite, removeFavorite, isFavorite, loading };
}
