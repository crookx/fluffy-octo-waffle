'use client';

import { Button } from '@/components/ui/button';
import { Shield, CheckCircle2, Zap, ChevronDown, BadgeCheck } from 'lucide-react';
import Link from 'next/link';

/**
 * LandingHero - Hero section for the landing page
 * Introduces platform value proposition and calls to action
 */
export function LandingHero({
  verifiedListings = 0,
  countiesCovered = 0,
}: {
  verifiedListings?: number;
  countiesCovered?: number;
}) {
  const handleExplore = () => {
    const listingsSection = document.getElementById('listings-section');
    if (listingsSection) {
      listingsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };
  return (
    <section className="w-full">
      {/* Main Hero */}
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-700 py-16 text-white sm:py-20 lg:min-h-[600px] lg:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.14),transparent_40%)]" />
        <div className="container max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative text-center space-y-6 sm:space-y-8">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
              <BadgeCheck className="h-4 w-4" />
              {verifiedListings.toLocaleString()} verified listings across Kenya
            </div>
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Find Verified Land in Kenya
                <span className="block text-emerald-100">With Documentation You Can Trust</span>
              </h1>
              <p className="mx-auto max-w-3xl text-base text-emerald-50/95 sm:text-xl">
                Browse transparent listings backed by title deeds, survey records, and trust badges that help you compare legal readiness at a glance.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-2xl mx-auto">
              <div className="rounded-lg border border-white/30 bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold sm:text-3xl">{verifiedListings.toLocaleString()}</div>
                <p className="mt-1 text-sm text-emerald-50/90">Verified Listings</p>
              </div>
              <div className="rounded-lg border border-white/30 bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold sm:text-3xl">{countiesCovered}</div>
                <p className="mt-1 text-sm text-emerald-50/90">Counties Covered</p>
              </div>
              <div className="rounded-lg border border-white/30 bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold sm:text-3xl">3</div>
                <p className="mt-1 text-sm text-emerald-50/90">Trust Badge Levels</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-4">
              <Button size="lg" onClick={handleExplore} className="w-full bg-white text-emerald-900 hover:bg-emerald-50 sm:w-auto">
                Browse Listings
              </Button>
              <Button size="lg" variant="ghost" asChild className="w-full border border-white/40 text-white hover:bg-white/10 hover:text-white sm:w-auto">
                <Link href="/trust">How It Works</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="relative flex justify-center pb-4 pt-8">
          <ChevronDown className="h-6 w-6 animate-bounce text-emerald-50/70" />
        </div>
      </div>

      {/* Trust Features */}
      <div className="border-y bg-muted/30 py-12 sm:py-16">
        <div className="container max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Why Choose Kenya Land Trust?</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="space-y-3 text-center">
                  <Shield className="h-8 w-8 text-primary mx-auto" />
                  <h3 className="font-semibold text-lg">Verified Documentation</h3>
                  <p className="text-sm text-muted-foreground">
                    Every listing includes verified documents: title deeds, survey maps, and supporting evidence.
                  </p>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="space-y-3 text-center">
                  <CheckCircle2 className="h-8 w-8 text-primary mx-auto" />
                  <h3 className="font-semibold text-lg">Trust Badges</h3>
                  <p className="text-sm text-muted-foreground">
                    Gold, Silver, and Bronze badges show documentation quality at a glance.
                  </p>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="space-y-3 text-center">
                  <Zap className="h-8 w-8 text-primary mx-auto" />
                  <h3 className="font-semibold text-lg">Fast & Easy</h3>
                  <p className="text-sm text-muted-foreground">
                    Search, filter, and connect with sellers directly. No middlemen, no hassle.
                  </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
