'use client';

import { Button } from '@/components/ui/button';
import { getOrCreateConversation } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MessageSquare } from 'lucide-react';

export function ContactSellerButton({ listingId }: { listingId: string }) {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleContact = async () => {
        setIsLoading(true);
        try {
            const { conversationId } = await getOrCreateConversation(listingId);
            router.push(`/messages/${conversationId}`);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Could not start conversation.',
            });
            setIsLoading(false);
        }
    };

    return (
        <Button onClick={handleContact} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
            Contact Seller
        </Button>
    );
}
