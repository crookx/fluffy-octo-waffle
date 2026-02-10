'use client';

import { useEffect, useState, useTransition, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
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
import { Loader2, Search, SlidersHorizontal, X, LandPlot, ChevronDown } from 'lucide-react';
import { searchListingsAction } from '@/app/actions';
import type { Listing, BadgeValue } from '@/lib/types';
import { SaveSearchButton } from './save-search-button';

const LAND_TYPES = ["Agricultural", "Residential", "Commercial", "Industrial", "Mixed-Use"];
const BADGE_OPTIONS: BadgeValue[] = ["Gold", "Silver", "Bronze"];
type SortOption = "newest" | "priceLow" | "priceHigh" | "areaHigh";

/**
 * ListingsContent - Reusable component for browsing and filtering listings
 * Used by both home page and dedicated explore page
 */
export function ListingsContent() {
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
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const activeFilters = useMemo(() => {
    const filters = [];
    if (query) filters.push({type: 'query', value: query, label: `Query: ${query}`});
    if (landType) filters.push({type: 'landType', value: landType, label: `Type: ${landType}`});
    if (priceRange[0] > 0 || priceRange[1] < 50000000) filters.push({type: 'price', value: priceRange, label: `Price: ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}`});
    if (areaRange[0] > 0 || areaRange[1] < 100) filters.push({type: 'area', value: areaRange, label: `Area: ${areaRange[0]} - ${areaRange[1]} acres`});
    badges.forEach(b => filters.push({type: 'badge', value: b, label: `${b} Badge`}));
    return filters;
  }, [query, landType, priceRange, areaRange, badges]);
  
  const currentFilters = useMemo(() => ({
    query: query || undefined,
    landType: landType || undefined,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    minArea: areaRange[0],
    maxArea: areaRange[1],
    badges: badges.length > 0 ? badges : undefined,
  }), [query, landType, priceRange, areaRange, badges]);

  const listingCountLabel = loading ? 'Loading...' : `${listings.length}${hasMore ? '+' : ''}`;

  const sortedListings = useMemo(() => {
    const next = [...listings];
    if (sortBy === 'priceLow') return next.sort((a, b) => a.price - b.price);
    if (sortBy === 'priceHigh') return next.sort((a, b) => b.price - a.price);
    if (sortBy === 'areaHigh') return next.sort((a, b) => b.area - a.area);
    return next;
  }, [listings, sortBy]);

  const updateUrlParams = useDebouncedCallback(() => {
    const params = new URLSearchParams(window.location.search);
    if (query) params.set('query', query); else params.delete('query');
    if (landType) params.set('landType', landType); else params.delete('landType');
    params.set('minPrice', String(priceRange[0]));
    params.set('maxPrice', String(priceRange[1]));
    params.set('minArea', String(areaRange[0]));
    params.set('maxArea', String(areaRange[1]));
    if (badges.length > 0) params.set('badges', badges.join(',')); else params.delete('badges');
    
    startTransition(() => {
      // Using window.history.pushState to avoid scroll-to-top behavior of router.replace
      window.history.pushState(null, '', `${pathname}?${params.toString()}`);
    });
  }, 500);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get('query') || '');
    setLandType(params.get('landType') || '');
    setPriceRange([Number(params.get('minPrice') || 0), Number(params.get('maxPrice') || 50000000)]);
    setAreaRange([Number(params.get('minArea') || 0), Number(params.get('maxArea') || 100)]);
    setBadges(params.get('badges')?.split(',').filter(Boolean) as BadgeValue[] || []);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {
      ...currentFilters,
      limit: 12,
    };
    
    searchListingsAction(params).then(result => {
      setListings(result.listings);
      setLastVisibleId(result.lastVisibleId);
      setHasMore(result.listings.length > 0 && !!result.lastVisibleId);
      setLoading(false);
      setIsFilterSheetOpen(false);
    });
  }, [currentFilters]);

  const handleLoadMore = async () => {
    if (!lastVisibleId || !hasMore) return;
    setLoadingMore(true);

    const params = {
      ...currentFilters,
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
    // This will trigger the useEffect for search
  };

  const removeFilter = (type: string, value: any) => {
    if (type === 'query') setQuery('');
    if (type === 'landType') setLandType('');
    if (type === 'price') setPriceRange([0, 50000000]);
    if (type === 'area') setAreaRange([0, 100]);
    if (type === 'badge') setBadges(badges.filter(b => b !== value));
    // This will trigger the useEffect for search
  }

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <div className="space-y-4">
        {/* Desktop Filters */}
        <div className="hidden md:block p-6 rounded-lg border bg-card space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="search-query">Search by Keyword</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="search-query"
                  placeholder="e.g., Kajiado, Kitengela, farm..."
                  value={query}
                  onChange={(e) => {setQuery(e.target.value); updateUrlParams()}}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="land-type">Land Type</Label>
              <Select value={landType} onValueChange={(value) => { setLandType(value === 'all' ? '' : value); }}>
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
            <div className="flex justify-end">
              <Button variant="outline" className="gap-2" onClick={() => setShowAdvancedFilters((prev) => !prev)}>
                Advanced filters
                <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>

          <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
            <CollapsibleContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
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
                          }}
                        >
                          {badge}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Price Range (Ksh)</Label>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{priceRange[0].toLocaleString()}</span>
                      <span>{priceRange[1].toLocaleString()}{priceRange[1] === 50000000 ? '+' : ''}</span>
                    </div>
                    <Slider
                      value={priceRange}
                      onValueChange={(value) => setPriceRange([value[0], value[1]])}
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
                      onValueChange={(value) => setAreaRange([value[0], value[1]])}
                      max={100}
                      min={0}
                      step={1}
                    />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Mobile Filter Sheet */}
        <div className="md:hidden">
          <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filter Properties</SheetTitle>
                <SheetDescription>Refine your search to find the perfect property</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="mobile-search">Search by Keyword</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      id="mobile-search"
                      placeholder="e.g., Kajiado, farm..."
                      value={query}
                      onChange={(e) => {setQuery(e.target.value); updateUrlParams()}}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Land Type</Label>
                  <Select value={landType} onValueChange={(value) => { setLandType(value === 'all' ? '' : value); }}>
                    <SelectTrigger>
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
                  <Label>Price Range</Label>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>{priceRange[0].toLocaleString()}</span>
                    <span>{priceRange[1].toLocaleString()}+</span>
                  </div>
                  <Slider
                    value={priceRange}
                    onValueChange={(value) => setPriceRange([value[0], value[1]])}
                    max={50000000}
                    min={0}
                    step={100000}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Area (Acres)</Label>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                    <span>{areaRange[0]}</span>
                    <span>{areaRange[1]}+</span>
                  </div>
                  <Slider
                    value={areaRange}
                    onValueChange={(value) => setAreaRange([value[0], value[1]])}
                    max={100}
                    min={0}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Trust Badge</Label>
                  <div className="space-y-2">
                    {BADGE_OPTIONS.map(badge => (
                      <div key={badge} className="flex items-center">
                        <input 
                          type="checkbox" 
                          id={`badge-${badge}`}
                          checked={badges.includes(badge)}
                          onChange={(e) => {
                            const newBadges = e.target.checked ? [...badges, badge] : badges.filter(b => b !== badge);
                            setBadges(newBadges);
                          }}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor={`badge-${badge}`} className="ml-2 text-sm cursor-pointer">{badge}</label>
                      </div>
                    ))}
                  </div>
                </div>
                {activeFilters.length > 0 && (
                  <Button variant="outline" className="w-full" onClick={resetFilters}>
                    Clear All Filters
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Active Filters Display */}
        {activeFilters.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">Active Filters:</p>
              {activeFilters.map((filter, idx) => (
                <Badge key={idx} variant="secondary" className="gap-2">
                  {filter.label}
                  <button
                    aria-label={`Remove ${filter.label} filter`}
                    onClick={() => removeFilter(filter.type, filter.value)}
                    className="ml-1 hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
                <Button variant="ghost" size="sm" onClick={resetFilters}>Clear all</Button>
            </div>
          </div>
        )}
        <div className="ml-auto">
          <SaveSearchButton filters={currentFilters} disabled={activeFilters.length === 0} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card p-3">
        <p className="text-sm text-muted-foreground">
          Listings found: <span className="font-semibold text-foreground">{listingCountLabel}</span>
        </p>
        <div className="flex items-center gap-2">
          <Label htmlFor="sort-listings" className="text-sm whitespace-nowrap">Sort by</Label>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger id="sort-listings" className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="priceLow">Price: Low to High</SelectItem>
              <SelectItem value="priceHigh">Price: High to Low</SelectItem>
              <SelectItem value="areaHigh">Area: Largest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="md:hidden sticky top-16 z-20 -mx-4 px-4 py-3 bg-background/95 backdrop-blur border-y">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-sm font-medium">Active filters ({activeFilters.length})</p>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFilters.slice(0, 3).map((filter, idx) => (
              <Badge key={idx} variant="secondary" className="gap-1.5 text-xs">
                {filter.label}
                <button aria-label={`Remove ${filter.label} filter`} onClick={() => removeFilter(filter.type, filter.value)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {activeFilters.length > 3 && (
              <Badge variant="outline" className="text-xs">+{activeFilters.length - 3} more</Badge>
            )}
          </div>
        </div>
      )}


      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : sortedListings.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="listings-section">
            {sortedListings.map((listing) => (
              <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                <div className="relative h-48 overflow-hidden bg-muted">
                  {listing.images && listing.images.length > 0 ? (
                    <Image
                      src={listing.images[0].url}
                      alt={listing.images[0].hint || listing.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <LandPlot className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <FavoriteButton listingId={listing.id} />
                  </div>
                  {listing.badge && <TrustBadge badge={listing.badge} className="absolute top-2 left-2" />}
                </div>

                <CardHeader className="flex-1">
                  <CardTitle className="line-clamp-2">{listing.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{listing.location}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Price</span>
                      <span className="font-semibold">Ksh {listing.price.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Area</span>
                      <span className="font-semibold">{listing.area} acres</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Type</span>
                      <span className="font-semibold text-xs">{listing.landType}</span>
                    </div>
                  </div>

                  {listing.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{listing.description}</p>
                  )}
                </CardContent>

                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/listings/${listing.id}`}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center py-8">
              <Button onClick={handleLoadMore} disabled={loadingMore} className="gap-2">
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
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
          <p className="text-muted-foreground text-lg font-medium">No listings found.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your filters or search terms to explore more options.
          </p>
          <div className="mx-auto mt-4 max-w-xl rounded-md bg-muted/60 px-4 py-3 text-left text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-2">Try these quick adjustments:</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Increase the max price by 10–20%.</li>
              <li>Widen area range by at least 5 acres.</li>
              <li>Remove one trust badge filter.</li>
            </ul>
          </div>
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
