'use client';

import { Heart } from 'lucide-react';
import { Button } from './ui/button';
import { useFavorites } from '@/hooks/use-favorites';
import { cn } from '@/lib/utils';
import { useAuth } from './providers';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ToastAction } from './ui/toast';

interface FavoriteButtonProps {
    listingId: string;
    className?: string;
}

export function FavoriteButton({ listingId, className }: FavoriteButtonProps) {
    const { user } = useAuth();
    const { isFavorite, addFavorite, removeFavorite } = useFavorites();
    const { toast } = useToast();
    const router = useRouter();

    const isFav = isFavorite(listingId);

    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            toast({
                title: 'Login Required',
                description: 'You need to be logged in to favorite listings.',
                action: <ToastAction altText="Login" onClick={() => router.push('/login?redirect=/')}>Login</ToastAction>
            });
            return;
        }

        if (isFav) {
            removeFavorite(listingId);
        } else {
            addFavorite(listingId);
        }
    };

    return (
        <Button
            size="icon"
            variant="ghost"
            className={cn('h-8 w-8 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm', className)}
            onClick={handleToggleFavorite}
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
            <Heart className={cn('h-4 w-4', isFav ? 'fill-red-500 text-red-500' : 'text-white')} />
        </Button>
    );
}
