'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import type { Conversation } from '@/lib/types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

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
        }, (error) => {
            console.error("Error fetching conversations:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);
    
    if (loading || authLoading) {
        return (
            <div className="p-4 space-y-4">
                {Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
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
                                "flex items-start gap-3 p-4 border-b hover:bg-muted/50",
                                isActive && "bg-secondary"
                            )}>
                                <Avatar className="h-10 w-10 border">
                                    <AvatarImage src={otherParticipant.photoURL} alt={otherParticipant.displayName} />
                                    <AvatarFallback>{otherParticipant.displayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold truncate">{otherParticipant.displayName}</p>
                                        {convo.lastMessage?.timestamp && (
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(convo.lastMessage.timestamp.toDate(), { addSuffix: true })}
                                            </p>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">{convo.listingTitle}</p>
                                    <p className="text-sm text-muted-foreground truncate">
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
