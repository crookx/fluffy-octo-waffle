'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import type { Conversation } from '@/lib/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';

export function ConversationsList() {
    const { user, loading: authLoading } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();

    useEffect(() => {
        if (!user) return;
        setLoading(true);

        const q = query(
            collection(db, 'conversations'), 
            where('participantIds', 'array-contains', user.uid),
            orderBy('updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const convos = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Conversation));
            setConversations(convos);
            setLoading(false);
        }, async (error) => {
            const permissionError = new FirestorePermissionError({
                path: 'conversations',
                operation: 'list',
            }, error);
            errorEmitter.emit('permission-error', permissionError);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);
    
    if (loading || authLoading) {
        return (
            <div className="p-4 space-y-4">
                {Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
        )
    }

    const getOtherParticipant = (convo: Conversation) => {
        const otherId = convo.participantIds.find(id => id !== user?.uid);
        return otherId ? convo.participants[otherId] : null;
    }

    return (
        <div className="h-full overflow-y-auto">
            <h2 className="p-4 text-lg font-semibold border-b">Chats</h2>
            {conversations.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No conversations yet.</p>
            ) : (
                <nav className="flex flex-col">
                    {conversations.map(convo => {
                        const otherParticipant = getOtherParticipant(convo);
                        if (!otherParticipant) return null;
                        const isActive = pathname.includes(convo.id);
                        return (
                            <Link href={`/messages/${convo.id}`} key={convo.id} className={cn(
                                "flex items-center gap-3 p-4 border-b hover:bg-muted/50",
                                isActive && "bg-secondary"
                            )}>
                                <div className="relative h-12 w-12 flex-shrink-0">
                                    <Image
                                        src={convo.listingImage || 'https://picsum.photos/seed/property/100/100'}
                                        alt={convo.listingTitle}
                                        fill
                                        className="rounded-md object-cover"
                                    />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-start gap-2">
                                        <p className="font-semibold truncate">{convo.listingTitle}</p>
                                        {convo.lastMessage?.timestamp && (
                                            <p className="text-xs text-muted-foreground flex-shrink-0">
                                                {formatDistanceToNow(convo.lastMessage.timestamp.toDate(), { addSuffix: true })}
                                            </p>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">
                                        With: {otherParticipant.displayName}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate mt-1">
                                        {convo.lastMessage?.senderId === user?.uid && 'You: '}
                                        {convo.lastMessage?.text}
                                    </p>
                                </div>
                            </Link>
                        )
                    })}
                </nav>
            )}
        </div>
    )
}
