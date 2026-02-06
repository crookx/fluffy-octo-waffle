'use client';

import { Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { Skeleton } from './ui/skeleton';

const tips = [
    "Always verify the title deed at your local Land Registry office before making any payment.",
    "Visit the property in person to confirm its location, boundaries, and condition.",
    "Engage a registered lawyer to handle the legal aspects of the transaction.",
    "Be cautious of deals that seem too good to be true. Scammers often use low prices to lure buyers.",
    "Ensure any payments are made through secure, traceable methods. Avoid large cash payments."
];

export function BuyerTip() {
    const [tip, setTip] = useState('');

    useEffect(() => {
        // This runs only on the client, after hydration
        setTip(tips[Math.floor(Math.random() * tips.length)]);
    }, []);

    if (!tip) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-secondary">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-accent" />
                    <span>Safe Buying Tip</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">{tip}</p>
            </CardContent>
        </Card>
    );
}
