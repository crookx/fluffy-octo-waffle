'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, ListPlus, User } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/providers';
import { Skeleton } from '@/components/ui/skeleton';

export default function OnboardingPage() {
    const { userProfile, loading } = useAuth();

    if (loading) {
        return (
            <div className="container mx-auto max-w-2xl py-10">
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    const isSeller = userProfile?.role === 'SELLER' || userProfile?.role === 'ADMIN';

    return (
        <div className="container mx-auto max-w-2xl py-10">
            <Card className="border-2 border-primary/20 shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl">Welcome to Kenya Land Trust, {userProfile?.displayName || 'User'}!</CardTitle>
                    <CardDescription className="text-base">Your account has been successfully created. Here are a few things you can do next.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Recommended Next Steps:</h3>
                        <div className="space-y-3">
                           <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                                <User className="h-6 w-6 text-accent mt-1" />
                                <div>
                                    <h4 className="font-semibold">Complete Your Profile</h4>
                                    <p className="text-sm text-muted-foreground">Add a phone number or update your display name to build trust.</p>
                                    <Button asChild size="sm" className="mt-2">
                                        <Link href="/profile">Go to Profile</Link>
                                    </Button>
                                </div>
                            </div>
                             {isSeller && (
                                <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                                    <ListPlus className="h-6 w-6 text-accent mt-1" />
                                    <div>
                                        <h4 className="font-semibold">Create Your First Listing</h4>
                                        <p className="text-sm text-muted-foreground">Ready to sell? Start by creating a listing for your property.</p>
                                        <Button asChild size="sm" variant="accent" className="mt-2">
                                            <Link href="/listings/new">Create Listing</Link>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-muted-foreground">Or, you can start exploring properties right away.</p>
                        <Button asChild variant="link" className="mt-2">
                            <Link href="/">Browse Listings</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
