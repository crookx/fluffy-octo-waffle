'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { LandingHero } from '@/components/buyer/landing-hero';
import { BadgeLegend } from '@/components/buyer/badge-legend';
import { HowToFind } from '@/components/buyer/how-to-find';
import { TestimonialsSection } from '@/components/buyer/testimonials-section';
import { ListingsContent } from '@/components/buyer/listings-content';

function LoadingFallback() {
  return (
    <div className="w-full py-20 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Loading properties...</p>
      </div>
    </div>
  );
}

export function BuyerHomePage() {
  return (
    <>
      <LandingHero />
      <BadgeLegend />
      <HowToFind />

      <section className="container mx-auto px-4 py-10" id="listings-section">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Browse Verified Listings</h2>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Start with keyword and land type, then expand advanced filters only if needed.
          </p>
        </div>

        <Suspense fallback={<LoadingFallback />}>
          <ListingsContent />
        </Suspense>
      </section>

      <TestimonialsSection />
    </>
  );
}
