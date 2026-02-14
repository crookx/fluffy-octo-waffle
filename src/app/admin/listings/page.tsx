"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPage } from "../_components/admin-page";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ChevronRight, Eye, Check, X } from "lucide-react";
import { searchListingsAction, bulkUpdateListingStatus } from "@/app/actions";
import type { Listing } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminListingsPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [lastVisibleId, setLastVisibleId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  const pageSize = 12;

  const fetchListings = async (opts: { append?: boolean; startAfter?: string | null } = {}) => {
    setLoading(true);
    try {
      const res = await searchListingsAction({
        query: debouncedQuery || undefined,
        status: statusFilter as any,
        limit: pageSize,
        startAfter: opts.startAfter || undefined,
      });

      if (opts.append) {
        setListings((s) => [...s, ...res.listings]);
      } else {
        setListings(res.listings);
      }

      setLastVisibleId(res.lastVisibleId);
      setHasMore(Boolean(res.lastVisibleId));
    } catch (e) {
      console.error('Error fetching listings:', e);
      alert(`Error fetching listings: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    // initial load / refetch on filter change
    setSelected({});
    setLastVisibleId(null);
    fetchListings({ append: false });
  }, [debouncedQuery, statusFilter]);

  const toggleSelect = (id: string) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  };

  const selectAllOnPage = () => {
    const newMap: Record<string, boolean> = {};
    listings.forEach((l) => (newMap[l.id] = true));
    setSelected(newMap);
  };

  const clearSelection = () => setSelected({});

  const selectedIds = useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected]);

  const handleBulk = async (status: "approved" | "rejected" | "pending") => {
    if (selectedIds.length === 0) return;
    try {
      await bulkUpdateListingStatus(selectedIds, status as any);
      // Refresh list
      setSelected({});
      setLastVisibleId(null);
      await fetchListings({ append: false });
    } catch (e) {
      console.error('Error in bulk update:', e);
      alert(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <AdminPage
      title="Listings"
      description="Manage all platform listings. Search, filter, and perform bulk actions."
      breadcrumbs={[{ href: "/admin", label: "Dashboard" }, { href: "/admin/listings", label: "Listings" }]}
    >
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="col-span-2">
          <div className="relative">
            <label htmlFor="listing-search" className="sr-only">
              Search listings
            </label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="listing-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, location, seller..."
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <label htmlFor="status-filter" className="sr-only">
            Filter listings by status
          </label>
          <select
            id="status-filter"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Listings</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex items-center gap-2">
                <Button size="sm" variant={viewMode === 'table' ? 'default' : 'outline'} onClick={() => setViewMode('table')}>
                  Table
                </Button>
                <Button size="sm" variant={viewMode === 'kanban' ? 'default' : 'outline'} onClick={() => setViewMode('kanban')}>
                  Kanban
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => handleBulk("approved")} disabled={selectedIds.length === 0}>
                  Approve Selected
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleBulk("rejected")}
                  disabled={selectedIds.length === 0}
                >
                  Reject Selected
                </Button>
              </div>
              <div className="flex items-center gap-2 sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      More actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={selectAllOnPage} disabled={listings.length === 0}>
                      Select page
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={clearSelection} disabled={selectedIds.length === 0}>
                      Clear selection
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <Button size="sm" variant="outline" onClick={selectAllOnPage} disabled={listings.length === 0}>
                  Select page
                </Button>
                <Button size="sm" variant="ghost" onClick={clearSelection} disabled={selectedIds.length === 0}>
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No listings match the current filters.</p>
            </div>
          ) : viewMode === 'kanban' ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {(['pending', 'approved', 'rejected'] as const).map((status) => {
                const items = listings.filter((l) => l.status === status);
                return (
                  <div key={status} className="rounded-lg border bg-muted/20 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold capitalize">{status}</h3>
                      <Badge variant="outline">{items.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {items.length === 0 ? (
                        <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">No listings</div>
                      ) : (
                        items.map((l) => (
                          <div key={l.id} className="rounded-md border bg-background p-3">
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <Link href={`/admin/listings/${l.id}`} className="line-clamp-1 text-sm font-medium hover:underline">
                                {l.title}
                              </Link>
                              <Checkbox
                                checked={!!selected[l.id]}
                                onCheckedChange={() => toggleSelect(l.id)}
                                aria-label={`Select listing ${l.title}`}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">{l.location} • Ksh {l.price.toLocaleString()}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">{l.landType}</Badge>
                              <Button asChild variant="ghost" size="sm" className="h-7 px-2">
                                <Link href={`/admin/listings/${l.id}`}>Open</Link>
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {listings.map((l) => {
                const statusColor = {
                  pending: 'bg-yellow-50 text-yellow-900 border-yellow-200',
                  approved: 'bg-green-50 text-green-900 border-green-200',
                  rejected: 'bg-red-50 text-red-900 border-red-200',
                };
                const statusIcon = {
                  pending: null,
                  approved: <Check className="h-4 w-4" />,
                  rejected: <X className="h-4 w-4" />,
                };

                return (
                  <div key={l.id} className={`flex items-center gap-3 rounded-lg border p-3 transition-all hover:shadow-md ${statusColor[l.status as keyof typeof statusColor]}`}>
                    <Checkbox
                      checked={!!selected[l.id]}
                      onCheckedChange={() => toggleSelect(l.id)}
                      aria-label={`Select listing ${l.title}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/listings/${l.id}`} className="font-medium hover:underline">
                          {l.title}
                        </Link>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {l.landType}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{l.location} • Ksh {l.price.toLocaleString()}</div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="secondary" className="capitalize flex items-center gap-1">
                        {statusIcon[l.status as keyof typeof statusIcon] && (
                          <>
                            {statusIcon[l.status as keyof typeof statusIcon]}
                          </>
                        )}
                        {l.status}
                      </Badge>
                    </div>

                    {/* Quick Actions - Desktop */}
                    <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                      <Link href={`/admin/listings/${l.id}`}>
                        <Button size="sm" variant="ghost" title="View details">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {l.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleBulk('approved')}
                            title="Approve listing"
                            disabled={!selected[l.id]}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleBulk('rejected')}
                            title="Reject listing"
                            disabled={!selected[l.id]}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex justify-center">
            {hasMore && (
              <Button onClick={() => fetchListings({ append: true, startAfter: lastVisibleId })}>
                Load more
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </AdminPage>
  );
}
