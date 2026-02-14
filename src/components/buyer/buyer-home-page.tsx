'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { LandingHero } from '@/components/buyer/landing-hero';
import { BadgeLegend } from '@/components/buyer/badge-legend';
import { HowToFind } from '@/components/buyer/how-to-find';
import type { Listing, BadgeValue } from '@/lib/types';
import { useEffect, useState, useTransition, useMemo, Suspense } from 'react';
import { searchListingsAction } from '@/app/actions';
import { FileText, Inbox, Loader2, MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
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
import { useRouter, usePathname } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TrustBadge } from '@/components/trust-badge';
import { FavoriteButton } from '@/components/favorite-button';
import { ListingCardSkeleton } from '@/components/listing-card-skeleton';

const LAND_TYPES = ['Agricultural', 'Residential', 'Commercial', 'Industrial', 'Mixed-Use'];
const BADGE_OPTIONS: BadgeValue[] = ['Gold', 'Silver', 'Bronze'];

export function BuyerHomePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ListingsContent />
    </Suspense>
  );
}

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

function ListingsContent() {
  const router = useRouter();
  const pathname = usePathname();
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
    if (query) filters.push({ type: 'query', value: query, label: `Query: ${query}` });
    if (landType) filters.push({ type: 'landType', value: landType, label: `Type: ${landType}` });
    if (priceRange[0] > 0 || priceRange[1] < 50000000) {
      filters.push({
        type: 'price',
        value: priceRange,
        label: `Price: ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}`,
      });
    }
    if (areaRange[0] > 0 || areaRange[1] < 100) {
      filters.push({
        type: 'area',
        value: areaRange,
        label: `Area: ${areaRange[0]} - ${areaRange[1]} acres`,
      });
    }
    badges.forEach((badge) =>
      filters.push({ type: 'badge', value: badge, label: `${badge} Badge` }),
    );
    return filters;
  }, [query, landType, priceRange, areaRange, badges]);

  const countiesCovered = useMemo(
    () => new Set(listings.map((listing) => listing.county).filter(Boolean)).size,
    [listings],
  );

  const badgeDistribution = useMemo(
    () => ({
      Gold: listings.filter((listing) => listing.badge === 'Gold').length,
      Silver: listings.filter((listing) => listing.badge === 'Silver').length,
      Bronze: listings.filter((listing) => listing.badge === 'Bronze').length,
    }),
    [listings],
  );

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
    setPriceRange([
      Number(params.get('minPrice') || 0),
      Number(params.get('maxPrice') || 50000000),
    ]);
    setAreaRange([
      Number(params.get('minArea') || 0),
      Number(params.get('maxArea') || 100),
    ]);
    setBadges((params.get('badges')?.split(',') as BadgeValue[]) || []);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {
      query: query || undefined,
      landType: landType || undefined,
      badges: badges.length > 0 ? badges : undefined,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      minArea: areaRange[0],
      maxArea: areaRange[1],
      limit: 12,
    };

    searchListingsAction(params).then((result) => {
      setListings(result.listings);
      setLastVisibleId(result.lastVisibleId);
      setHasMore(result.listings.length > 0 && !!result.lastVisibleId);
      setLoading(false);
      setIsFilterSheetOpen(false);
    });
  }, [query, landType, priceRange, areaRange, badges]);

  const handleLoadMore = async () => {
    if (!lastVisibleId || !hasMore) return;
    setLoadingMore(true);

    const params = {
      query: query || undefined,
      landType: landType || undefined,
      badges: badges.length > 0 ? badges : undefined,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      minArea: areaRange[0],
      maxArea: areaRange[1],
      limit: 12,
      startAfter: lastVisibleId,
    };

    const result = await searchListingsAction(params);
    setListings((prev) => [...prev, ...result.listings]);
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
  };

  const removeFilter = (type: string, value: BadgeValue | string | [number, number]) => {
    if (type === 'query') setQuery('');
    if (type === 'landType') setLandType('');
    if (type === 'price') setPriceRange([0, 50000000]);
    if (type === 'area') setAreaRange([0, 100]);
    if (type === 'badge') setBadges(badges.filter((badge) => badge !== value));
    updateUrlParams();
  };

  const FilterControls = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
      <div className="space-y-2 lg:col-span-3">
        <Label htmlFor="search-query">Search by Keyword</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="search-query"
            placeholder="Search location, property name, or seller..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onBlur={updateUrlParams}
            onKeyDown={(event) => event.key === 'Enter' && updateUrlParams()}
            className="pl-10"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="land-type">Land Type</Label>
        <Select
          value={landType}
          onValueChange={(value) => {
            setLandType(value === 'all' ? '' : value);
            updateUrlParams();
          }}
        >
          <SelectTrigger id="land-type">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {LAND_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
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
            {BADGE_OPTIONS.map((badge) => (
              <DropdownMenuCheckboxItem
                key={badge}
                checked={badges.includes(badge)}
                onCheckedChange={(checked) => {
                  const newBadges = checked
                    ? [...badges, badge]
                    : badges.filter((option) => option !== badge);
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
            <span>
              {priceRange[1].toLocaleString()}
              {priceRange[1] === 50000000 ? '+' : ''}
            </span>
          </div>
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange([value[0], value[1]])}
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
            <span>
              {areaRange[1]}
              {areaRange[1] === 100 ? '+' : ''}
            </span>
          </div>
          <Slider
            value={areaRange}
            onValueChange={(value) => setAreaRange([value[0], value[1]])}
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
    <>
      {/* ===== SECTION 1: Hero & CTA ===== */}
      <LandingHero verifiedListings={listings.length} countiesCovered={countiesCovered} />

      {/* ===== SECTION 2: How to Find - Step Guide ===== */}
      <HowToFind />

      {/* ===== SECTION 3: Featured Gold-Badge Properties ===== */}
      {!loading && listings.length > 0 && (
        <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Top Verified Listings
            </h2>
            <p className="mt-2 text-muted-foreground">Our best Gold-badge properties</p>
          </div>
          <FeaturedListings listings={listings.filter((listing) => listing.badge === 'Gold').slice(0, 6)} />
        </div>
      )}

      <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-12 sm:mb-16">
          <BadgeLegend distribution={badgeDistribution} />
        </div>

        <div className="mb-4 lg:hidden">
          <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full relative">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Search & Filter
                {activeFilters.length > 0 && (
                  <Badge className="ml-2 bg-primary text-primary-foreground" variant="default">
                    {activeFilters.length}
                  </Badge>
                )}
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

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          <aside className="hidden lg:col-span-4 lg:block">
            <div className="sticky top-20 rounded-lg border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Refine Your Search</h3>
                {activeFilters.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="text-sm">
                    Clear Filters
                  </Button>
                )}
              </div>
              <FilterControls />
            </div>
          </aside>

          <section id="listings-section" className="lg:col-span-8">
            {activeFilters.length > 0 && (
              <div className="mb-6 flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium">Active Filters:</p>
                {activeFilters.map((filter) => (
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
            <div>
              <div className="mb-6 flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Searching verified properties...</span>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <ListingCardSkeleton key={index} />
                ))}
              </div>
            </div>
          ) : listings.length > 0 ? (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {listings.length} verified properties
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {listings.map((listing, index) => (
                  <Card
                    key={listing.id}
                    className="flex cursor-pointer flex-col overflow-hidden border border-border transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg animate-soft-fade-scale"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                  >
                    <CardHeader className="relative p-0">
                      <Link href={`/listings/${listing.id}`} className="block">
                        <Image
                          src={listing.images[0]?.url || 'https://picsum.photos/seed/fallback/600/400'}
                          alt={listing.title}
                          width={600}
                          height={400}
                          className="aspect-[3/2] w-full object-cover transition-transform duration-300 hover:scale-105"
                          data-ai-hint={listing.images[0]?.hint || 'landscape'}
                        />
                      </Link>
                      <div className="absolute top-3 left-3 z-10">
                        <FavoriteButton listingId={listing.id} />
                      </div>
                      <div className="absolute top-3 right-3">
                        {listing.badge && <TrustBadge badge={listing.badge} />}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3 p-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          <span>{listing.location}, {listing.county}</span>
                        </p>
                        <p>{listing.area} acres</p>
                      </div>
                      <Link href={`/listings/${listing.id}`}>
                        <CardTitle className="mb-1 text-lg font-semibold tracking-tight hover:text-accent leading-tight">
                          {listing.title}
                        </CardTitle>
                      </Link>
                      <CardDescription className="line-clamp-2 text-sm text-muted-foreground">
                        {listing.description}
                      </CardDescription>
                      <div className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" />
                          {listing.evidence?.length ?? 0} documents
                        </p>
                        <StatusBadge status={listing.status} />
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-between items-center">
                      <p className="text-xl font-bold text-primary">
                        Ksh {listing.price.toLocaleString()}
                      </p>
                      <Button asChild variant="ghost" className="text-primary hover:text-primary">
                        <Link href={`/listings/${listing.id}`}>View Details</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              {hasMore && (
                <div className="mt-12 text-center">
                  <Button onClick={handleLoadMore} disabled={loadingMore} size="lg">
                    {loadingMore ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More Properties'
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 rounded-lg border-2 border-dashed">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg font-medium">
                {activeFilters.length > 0 ? 'No properties match your filters.' : 'No listings found yet.'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {activeFilters.length > 0
                  ? 'Try: Checking other counties, broadening price range, or removing filters.'
                  : 'Browse featured properties above or check back soon for new verified listings.'}
              </p>
              {activeFilters.length > 0 && (
                <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          )}
          </section>
        </div>
      </div>

      <TestimonialsSection />
    </>
  );
}
