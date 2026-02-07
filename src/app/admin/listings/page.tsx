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
import { Search } from "lucide-react";
import { searchListingsAction, bulkUpdateListingStatus } from "@/app/actions";
import type { Listing } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function AdminListingsPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [lastVisibleId, setLastVisibleId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const pageSize = 12;

  const fetchListings = async (opts: { append?: boolean; startAfter?: string | null } = {}) => {
    setLoading(true);
    try {
      const res = await searchListingsAction({
        query: query || undefined,
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
    // initial load / refetch on filter change
    setSelected({});
    setLastVisibleId(null);
    fetchListings({ append: false });
  }, [query, statusFilter]);

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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, location, seller..."
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <select
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
          <div className="flex items-center justify-between">
            <CardTitle>Listings</CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={selectAllOnPage} disabled={listings.length === 0}>
                Select page
              </Button>
              <Button size="sm" variant="ghost" onClick={clearSelection}>
                Clear
              </Button>
              <Button size="sm" onClick={() => handleBulk("approved")} disabled={selectedIds.length === 0}>
                Approve Selected
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleBulk("rejected")} disabled={selectedIds.length === 0}>
                Reject Selected
              </Button>
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
          ) : (
            <div className="space-y-2">
              {listings.map((l) => (
                <div key={l.id} className="flex items-center gap-3 rounded-md border px-3 py-2">
                  <Checkbox checked={!!selected[l.id]} onCheckedChange={() => toggleSelect(l.id)} />
                  <div className="flex-1">
                    <Link href={`/admin/listings/${l.id}`} className="font-medium">
                      {l.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">{l.location} — Ksh {l.price.toLocaleString()}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">{l.status}</div>
                </div>
              ))}
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
