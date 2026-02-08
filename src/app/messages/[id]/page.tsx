'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/providers';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, doc, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import type { Message, Conversation } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { conversationStatusLabel, getConversationStatus, type ConversationStatus } from '@/lib/conversation-status';

const ChatSkeleton = () => (
    <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b">
            <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-end gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="p-3 rounded-lg bg-secondary space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </div>
            <div className="flex items-end gap-2 justify-end">
                <div className="p-3 rounded-lg bg-primary/10 space-y-2">
                     <Skeleton className="h-4 w-56" />
                </div>
            </div>
            <div className="flex items-end gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                 <div className="p-3 rounded-lg bg-secondary space-y-2">
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
        </CardContent>
        <CardFooter className="border-t p-4">
            <div className="w-full flex items-center gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-10" />
            </div>
        </CardFooter>
    </Card>
);


export default function ConversationPage({ params }: { params: { id: string } }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [status, setStatus] = useState<ConversationStatus>('new');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (!user) return;
        setLoading(true);

        const convoRef = doc(db, 'conversations', params.id);
        const convoUnsubscribe = onSnapshot(convoRef, (doc) => {
            if (doc.exists()) {
                const convoData = { id: doc.id, ...doc.data() } as Conversation;
                if (!convoData.participantIds.includes(user.uid)) {
                    // unauthorized
                    setConversation(null);
                    return;
                }
                setConversation(convoData);
                setStatus(getConversationStatus(convoData, user.uid));
            } else {
                setConversation(null);
            }
        }, async (error) => {
            const permissionError = new FirestorePermissionError({
                path: convoRef.path,
                operation: 'get',
            }, error);
            errorEmitter.emit('permission-error', permissionError);
            setLoading(false);
        });

        const messagesColRef = collection(db, 'conversations', params.id, 'messages');
        const messagesQuery = query(messagesColRef, orderBy('timestamp', 'asc'));
        const messagesUnsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Message));
            setMessages(msgs);
            setLoading(false);
        }, async (error) => {
            const permissionError = new FirestorePermissionError({
                path: messagesColRef.path,
                operation: 'list',
            }, error);
            errorEmitter.emit('permission-error', permissionError);
            setLoading(false);
        });

        return () => {
            convoUnsubscribe();
            messagesUnsubscribe();
        };
    }, [params.id, user]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !conversation) return;

        setSending(true);
        const text = newMessage;
        setNewMessage('');
        
        const messagesColRef = collection(db, 'conversations', params.id, 'messages');
        const messageData = {
            senderId: user.uid,
            text: text,
            timestamp: serverTimestamp(),
        };

        // Use a non-blocking write with a .catch handler for errors.
        addDoc(messagesColRef, messageData).catch(async (error) => {
            const permissionError = new FirestorePermissionError({
                path: messagesColRef.path,
                operation: 'create',
                requestResourceData: messageData,
            }, error);
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not send message. Permission denied.' });
            setNewMessage(text); // Restore the message text
        });

        const convoRef = doc(db, 'conversations', params.id);
        const convoData = {
            lastMessage: {
                text: text,
                senderId: user.uid,
                timestamp: serverTimestamp(),
            },
            updatedAt: serverTimestamp(),
            status: 'responded',
        };

        // Also handle errors for updating the conversation document
        updateDoc(convoRef, convoData).catch(async (error) => {
            const permissionError = new FirestorePermissionError({
                path: convoRef.path,
                operation: 'update',
                requestResourceData: convoData,
            }, error);
            errorEmitter.emit('permission-error', permissionError);
            // Don't show a second toast, one is enough.
        });
        
        // UI updates immediately, don't wait for the write to complete.
        setStatus('responded');
        setSending(false);
    };

    const handleStatusChange = (nextStatus: ConversationStatus) => {
        if (!conversation) return;
        setStatus(nextStatus);
        const convoRef = doc(db, 'conversations', params.id);
        updateDoc(convoRef, { status: nextStatus }).catch(async (error) => {
            const permissionError = new FirestorePermissionError({
                path: convoRef.path,
                operation: 'update',
                requestResourceData: { status: nextStatus },
            }, error);
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update conversation status.' });
        });
    };

    if (loading) {
        return <ChatSkeleton />;
    }

    if (!conversation) {
        return <Card className="h-full flex items-center justify-center"><p>Conversation not found or you do not have access.</p></Card>
    }
    
    const otherParticipantId = conversation.participantIds.find(id => id !== user?.uid);
    const otherParticipant = otherParticipantId ? conversation.participants[otherParticipantId] : null;

    return (
        <div className="h-full grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-4">
            <Card className="h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between gap-4 border-b">
                    <Link href={`/listings/${conversation.listingId}`} className="flex items-center gap-3 overflow-hidden group">
                        <div className="relative h-12 w-12 flex-shrink-0">
                            <Image
                                src={conversation.listingImage || 'https://picsum.photos/seed/conversation/100/100'}
                                alt={conversation.listingTitle}
                                fill
                                className="rounded-md object-cover"
                            />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="truncate font-semibold group-hover:underline">{conversation.listingTitle}</p>
                            <p className="text-sm text-muted-foreground truncate">
                                Conversation with {otherParticipant?.displayName}
                            </p>
                        </div>
                    </Link>
                    {otherParticipant && (
                        <Avatar className="h-10 w-10 border hidden sm:flex">
                            <AvatarImage src={otherParticipant.photoURL} alt={otherParticipant.displayName} />
                            <AvatarFallback>{otherParticipant.displayName.charAt(0)}</AvatarFallback>
                        </Avatar>
                    )}
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                    <Alert variant="default" className="border-warning/50 bg-warning/10 text-warning [&>svg]:text-warning">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="text-warning font-bold">Safety Tip</AlertTitle>
                        <AlertDescription className="text-warning/90">
                            For your safety, never share personal financial details (like bank accounts) or make payments outside of the platform. Report any suspicious requests.
                        </AlertDescription>
                    </Alert>

                    {messages.map(msg => {
                        const isSender = msg.senderId === user?.uid;
                        const participant = isSender ? null : (conversation.participants[msg.senderId] || null);

                        return (
                            <div key={msg.id} className={cn("flex items-end gap-2", isSender && "justify-end")}>
                                {!isSender && participant && (
                                    <Avatar className="h-8 w-8 border self-start">
                                        <AvatarImage src={participant.photoURL} />
                                        <AvatarFallback>{participant.displayName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn(
                                    "max-w-xs md:max-w-md lg:max-w-xl p-3 rounded-lg",
                                    isSender ? "bg-primary text-primary-foreground" : "bg-secondary"
                                )}>
                                    <p className="text-sm" style={{whiteSpace: 'pre-wrap'}}>{msg.text}</p>
                                    {msg.timestamp && (
                                        <p className={cn("text-xs mt-1 text-right", isSender ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                            {format(msg.timestamp.toDate(), 'p')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </CardContent>
                <CardFooter className="border-t p-4">
                    <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
                        <Input 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            disabled={sending}
                            autoComplete="off"
                        />
                        <Button type="submit" size="icon" aria-label="Send message" disabled={sending || !newMessage.trim()}>
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </form>
                </CardFooter>
            </Card>

            <Card className="h-full">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Conversation Details</p>
                        <Badge variant="secondary">{conversationStatusLabel[status]}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase">Listing</p>
                        <Link href={`/listings/${conversation.listingId}`} className="text-sm font-medium hover:underline">
                            {conversation.listingTitle}
                        </Link>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase">Buyer</p>
                        <p className="text-sm font-medium">{otherParticipant?.displayName || 'Unknown'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase mb-2">Status</p>
                        <Select value={status} onValueChange={(value: ConversationStatus) => handleStatusChange(value)}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="responded">Responded</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button asChild variant="outline" className="w-full">
                        <Link href={`/listings/${conversation.listingId}`}>View Listing</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
