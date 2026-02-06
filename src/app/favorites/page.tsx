'use client';

import { useEffect, useState } from 'react';
import { useFavorites } from '@/hooks/use-favorites';
import { getListingsByIds } from '@/app/actions';
import type { Listing } from '@/lib/types';
import { Loader2, LandPlot } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { TrustBadge } from '@/components/trust-badge';
import { FavoriteButton } from '@/components/favorite-button';

export default function FavoritesPage() {
    const { favoriteIds, loading: favoritesLoading } = useFavorites();
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (favoritesLoading) return;
        
        setLoading(true);
        const ids = Array.from(favoriteIds);

        if (ids.length === 0) {
            setListings([]);
            setLoading(false);
            return;
        }

        getListingsByIds(ids).then((favoriteListings) => {
            setListings(favoriteListings);
            setLoading(false);
        });

    }, [favoriteIds, favoritesLoading]);

    if (loading || favoritesLoading) {
        return (
            <div className="container mx-auto py-10">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </div>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold tracking-tight mb-8">My Favorites</h1>
            {listings.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {listings.map((listing) => (
                         <Card key={listing.id} className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <CardHeader className="relative p-0">
                                <Link href={`/listings/${listing.id}`} className="block">
                                    <Image
                                    src={listing.images[0]?.url || 'https://picsum.photos/seed/fallback/600/400'}
                                    alt={listing.title}
                                    width={600}
                                    height={400}
                                    className="aspect-[3/2] w-full object-cover"
                                    data-ai-hint={listing.images[0]?.hint || 'landscape'}
                                    />
                                </Link>
                                <div className="absolute top-3 right-3 flex items-center gap-2">
                                    {listing.badge && <TrustBadge badge={listing.badge} />}
                                    <StatusBadge status={listing.status} />
                                </div>
                                <div className="absolute top-3 left-3 z-10">
                                    <FavoriteButton listingId={listing.id} />
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 p-4">
                                <Link href={`/listings/${listing.id}`}>
                                    <CardTitle className="mb-1 text-lg font-semibold tracking-tight hover:text-accent leading-tight">
                                    {listing.title}
                                    </CardTitle>
                                </Link>
                                <CardDescription className="text-sm text-muted-foreground">
                                    {listing.location}, {listing.county}
                                </CardDescription>
                                <p className="text-sm text-foreground/80 mt-2 flex items-center gap-2">
                                    <LandPlot className="h-4 w-4 text-accent" />
                                    {listing.area} Acres
                                </p>
                            </CardContent>
                            <CardFooter className="p-4 pt-0 flex justify-between items-center">
                                <p className="text-xl font-bold text-primary">
                                    Ksh {listing.price.toLocaleString()}
                                </p>
                                <Button asChild>
                                    <Link href={`/listings/${listing.id}`}>View</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 rounded-lg border-2 border-dashed">
                    <p className="text-muted-foreground text-lg font-medium">You have no favorite listings yet.</p>
                    <p className="text-sm text-muted-foreground mt-2">Click the heart icon on a listing to save it here.</p>
                     <Button asChild className="mt-4">
                        <Link href="/">Browse Listings</Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
