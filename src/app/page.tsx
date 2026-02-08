'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import type { Listing, BadgeValue } from '@/lib/types';
import { useEffect, useState, useTransition, useMemo } from 'react';
import { searchListingsAction } from '@/app/actions';
import { Loader2, Search, SlidersHorizontal, X, Award, Shield, BadgeCheck, LandPlot } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TrustBadge } from '@/components/trust-badge';
import { FavoriteButton } from '@/components/favorite-button';
import { ListingCardSkeleton } from '@/components/listing-card-skeleton';


const LAND_TYPES = ["Agricultural", "Residential", "Commercial", "Industrial", "Mixed-Use"];
const BADGE_OPTIONS: BadgeValue[] = ["Gold", "Silver", "Bronze"];
const TRUST_HIGHLIGHTS = [
  {
    title: 'Verified Listings',
    description: 'Every plot is vetted with clear ownership and honest details.',
    icon: Shield,
  },
  {
    title: 'Trust Badges',
    description: 'Gold, Silver, and Bronze ratings help you decide with confidence.',
    icon: BadgeCheck,
  },
  {
    title: 'Guided Buying',
    description: 'We help you understand zoning, utilities, and next steps.',
    icon: Award,
  },
];


export default function ListingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [listings, setListings] = useState<Listing[]>([]);
  const [lastVisibleId, setLastVisibleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Filter states
  const [query, setQuery] = useState('');
  const [landType, setLandType] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000000]);
  const [areaRange, setAreaRange] = useState<[number, number]>([0, 100]);
  const [badges, setBadges] = useState<BadgeValue[]>([]);

  const activeFilters = useMemo(() => {
    const filters = [];
    if (query) filters.push({type: 'query', value: query, label: `Query: ${query}`});
    if (landType) filters.push({type: 'landType', value: landType, label: `Type: ${landType}`});
    if (priceRange[0] > 0 || priceRange[1] < 50000000) filters.push({type: 'price', value: priceRange, label: `Price: ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}`});
    if (areaRange[0] > 0 || areaRange[1] < 100) filters.push({type: 'area', value: areaRange, label: `Area: ${areaRange[0]} - ${areaRange[1]} acres`});
    badges.forEach(b => filters.push({type: 'badge', value: b, label: `${b} Badge`}));
    return filters;
  }, [query, landType, priceRange, areaRange, badges]);

  const listingCountLabel = loading ? 'Loading...' : `${listings.length}${hasMore ? '+' : ''}`;


  const updateUrlParams = useDebouncedCallback(() => {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (landType) params.set('landType', landType);
    params.set('minPrice', String(priceRange[0]));
    params.set('maxPrice', String(priceRange[1]));
    params.set('minArea', String(areaRange[0]));
    params.set('maxArea', String(areaRange[1]));
    if (badges.length > 0) params.set('badges', badges.join(','));
    
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }, 500);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get('query') || '');
    setLandType(params.get('landType') || '');
    setPriceRange([Number(params.get('minPrice') || 0), Number(params.get('maxPrice') || 50000000)]);
    setAreaRange([Number(params.get('minArea') || 0), Number(params.get('maxArea') || 100)]);
    setBadges(params.get('badges')?.split(',') as BadgeValue[] || []);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const params = {
      query: searchParams.get('query') || undefined,
      landType: searchParams.get('landType') || undefined,
      badges: searchParams.get('badges')?.split(',') as BadgeValue[] || undefined,
      minPrice: Number(searchParams.get('minPrice') || 0),
      maxPrice: Number(searchParams.get('maxPrice') || 50000000),
      minArea: Number(searchParams.get('minArea') || 0),
      maxArea: Number(searchParams.get('maxArea') || 100),
      limit: 12,
    };
    
    searchListingsAction(params).then(result => {
      setListings(result.listings);
      setLastVisibleId(result.lastVisibleId);
      setHasMore(result.listings.length > 0 && !!result.lastVisibleId);
      setLoading(false);
      setIsFilterSheetOpen(false);
    });
  }, [searchParams]);

  const handleLoadMore = async () => {
    if (!lastVisibleId || !hasMore) return;
    setLoadingMore(true);

    const params = {
      query: searchParams.get('query') || undefined,
      landType: searchParams.get('landType') || undefined,
      badges: searchParams.get('badges')?.split(',') as BadgeValue[] || undefined,
      minPrice: Number(searchParams.get('minPrice') || 0),
      maxPrice: Number(searchParams.get('maxPrice') || 50000000),
      minArea: Number(searchParams.get('minArea') || 0),
      maxArea: Number(searchParams.get('maxArea') || 100),
      limit: 12,
      startAfter: lastVisibleId,
    };
    
    const result = await searchListingsAction(params);
    setListings(prev => [...prev, ...result.listings]);
    setLastVisibleId(result.lastVisibleId);
    setHasMore(result.listings.length > 0 && !!result.lastVisibleId);
    setLoadingMore(false);
  };
  
  const resetFilters = () => {
    setQuery('');
    setLandType('');
    setPriceRange([0, 50000000]);
    setAreaRange([0, 100]);
    setBadges([]);
    updateUrlParams();
  }

  const removeFilter = (type: string, value: any) => {
    if (type === 'query') setQuery('');
    if (type === 'landType') setLandType('');
    if (type === 'price') setPriceRange([0, 50000000]);
    if (type === 'area') setAreaRange([0, 100]);
    if (type === 'badge') setBadges(badges.filter(b => b !== value));
    updateUrlParams();
  }
  

  const FilterControls = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
        <div className="space-y-2 lg:col-span-3">
            <Label htmlFor="search-query">Search by Keyword</Label>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    id="search-query"
                    placeholder="e.g., Kajiado, Kitengela, farm..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onBlur={updateUrlParams}
                    onKeyDown={(e) => e.key === 'Enter' && updateUrlParams()}
                    className="pl-10"
                />
            </div>
        </div>
         <div className="space-y-2">
            <Label htmlFor="land-type">Land Type</Label>
            <Select value={landType} onValueChange={(value) => { setLandType(value === 'all' ? '' : value); updateUrlParams(); }}>
                <SelectTrigger id="land-type">
                    <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {LAND_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="space-y-2">
            <Label>Trust Badge</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>{badges.length > 0 ? `${badges.length} selected` : 'Any Badge'}</span>
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter by Badge</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {BADGE_OPTIONS.map(badge => (
                   <DropdownMenuCheckboxItem
                        key={badge}
                        checked={badges.includes(badge)}
                        onCheckedChange={(checked) => {
                            const newBadges = checked ? [...badges, badge] : badges.filter(b => b !== badge);
                            setBadges(newBadges);
                            updateUrlParams();
                        }}
                    >
                        {badge}
                    </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <div className="space-y-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label>Price Range (Ksh)</Label>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{priceRange[0].toLocaleString()}</span>
                        <span>{priceRange[1].toLocaleString()}{priceRange[1] === 50000000 ? '+' : ''}</span>
                    </div>
                    <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        onValueCommit={updateUrlParams}
                        max={50000000}
                        min={0}
                        step={100000}
                    />
            </div>
             <div className="space-y-2">
                <Label>Area (Acres)</Label>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{areaRange[0]}</span>
                        <span>{areaRange[1]}{areaRange[1] === 100 ? '+' : ''}</span>
                    </div>
                    <Slider
                        value={areaRange}
                        onValueChange={setAreaRange}
                        onValueCommit={updateUrlParams}
                        max={100}
                        min={0}
                        step={1}
                    />
            </div>
        </div>
      </div>
  );
  
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <section className="mb-12 rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-accent/10 px-6 py-10 text-center shadow-sm md:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Trusted land marketplace</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-primary md:text-5xl">
          Secure Your Piece of Kenya
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-foreground/80">
          Browse verified land listings with transparent trust signals and effortless filtering.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="#listings">Browse listings</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/about">How it works</Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border bg-card/60 px-4 py-3 text-left shadow-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Listings</p>
            <p className="text-2xl font-semibold text-primary">{listingCountLabel}</p>
          </div>
          <div className="rounded-xl border bg-card/60 px-4 py-3 text-left shadow-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Trust badges</p>
            <p className="text-2xl font-semibold text-primary">3-tier verification</p>
          </div>
          <div className="rounded-xl border bg-card/60 px-4 py-3 text-left shadow-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Coverage</p>
            <p className="text-2xl font-semibold text-primary">Nationwide</p>
          </div>
        </div>
      </section>

      <section className="mb-12 grid gap-6 md:grid-cols-3">
        {TRUST_HIGHLIGHTS.map((highlight) => {
          const Icon = highlight.icon;
          return (
            <Card key={highlight.title} className="border-muted/60 shadow-sm">
              <CardHeader className="space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">{highlight.title}</CardTitle>
                <CardDescription>{highlight.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </section>

      <div className="mb-8 p-6 border rounded-lg bg-card shadow-sm">
        <div className="lg:hidden mb-4">
            <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" className="w-full">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Search & Filter
                </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh] flex flex-col">
                <SheetHeader>
                <SheetTitle>Search & Filter</SheetTitle>
                <SheetDescription>Find the perfect property for you.</SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-1">
                <div className="p-4">
                    <FilterControls />
                </div>
                </div>
            </SheetContent>
            </Sheet>
        </div>
        <div className="hidden lg:block">
           <FilterControls />
        </div>
      </div>

       <div id="listings" className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Results</p>
            <p className="text-lg font-semibold text-primary">
              {loading ? 'Fetching listings...' : `Showing ${listings.length} listing${listings.length === 1 ? '' : 's'}`}
            </p>
          </div>
          {activeFilters.length > 0 && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-sm">Reset Filters</Button>
          )}
       </div>

       {activeFilters.length > 0 && (
            <div className="mb-4 flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium">Applied Filters:</p>
                {activeFilters.map(filter => (
                    <Badge key={filter.label} variant="secondary" className="pl-2">
                        {filter.label}
                        <button
                          onClick={() => removeFilter(filter.type, filter.value)}
                          className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                          aria-label={`Remove ${filter.label} filter`}
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>
       )}

      {(loading || isPending) && listings.length === 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({length: 8}).map((_, i) => <ListingCardSkeleton key={i} />)}
        </div>
      ) : listings.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing, index) => (
              <Card
                key={listing.id}
                className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-soft-fade-scale"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
              >
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
                  <div className="absolute top-3 left-3 z-10">
                    <FavoriteButton listingId={listing.id} />
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    {listing.badge && <TrustBadge badge={listing.badge} />}
                    <StatusBadge status={listing.status} />
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
           {hasMore && (
                <div className="mt-12 text-center">
                    <Button onClick={handleLoadMore} disabled={loadingMore}>
                        {loadingMore ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            'Load More'
                        )}
                    </Button>
                </div>
            )}
        </>
      ) : (
        <div className="text-center py-20 rounded-lg border-2 border-dashed">
          <p className="text-muted-foreground text-lg font-medium">No listings found.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your filters or search terms to explore more options.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button variant="outline" onClick={resetFilters}>Clear filters</Button>
            <Button asChild>
              <Link href="/contact">Get help</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
