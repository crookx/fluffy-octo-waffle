'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';

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
        }, async (error) => {
            const permissionError = new FirestorePermissionError({
                path: `users/${user.uid}/favorites`,
                operation: 'list',
            }, error);
            errorEmitter.emit('permission-error', permissionError);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addFavorite = useCallback((listingId: string) => {
        if (!user) return;
        const favDocRef = doc(db, 'users', user.uid, 'favorites', listingId);
        const favoriteData = {
            createdAt: serverTimestamp()
        };
        
        setDoc(favDocRef, favoriteData)
            .catch(async (error) => {
                const permissionError = new FirestorePermissionError({
                    path: favDocRef.path,
                    operation: 'create',
                    requestResourceData: favoriteData
                }, error);
                errorEmitter.emit('permission-error', permissionError);
            });

    }, [user]);

    const removeFavorite = useCallback((listingId: string) => {
        if (!user) return;
        const favDocRef = doc(db, 'users', user.uid, 'favorites', listingId);

        deleteDoc(favDocRef)
            .catch(async (error) => {
                const permissionError = new FirestorePermissionError({
                    path: favDocRef.path,
                    operation: 'delete',
                }, error);
                errorEmitter.emit('permission-error', permissionError);
            });
    }, [user]);

    const isFavorite = (listingId: string) => favoriteIds.has(listingId);

    return { favoriteIds, addFavorite, removeFavorite, isFavorite, loading };
}
