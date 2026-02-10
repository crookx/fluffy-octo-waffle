import Link from 'next/link';
import { adminDb } from '@/lib/firebase-admin';
import { getListingsForSeller } from '@/lib/data';
import { StatusBadge } from '@/components/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatRelative } from 'date-fns';
import { redirect } from 'next/navigation';
import type { ListingStatus, UserProfile } from '@/lib/types';
import { Edit, PlusCircle } from 'lucide-react';
import { SellerPage } from '@/components/seller/seller-page';
import { getAuthenticatedUser } from '../_lib/auth';

export default async function SellerListingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  const listings = await getListingsForSeller(user.uid);
  const userProfileDoc = await adminDb.collection('users').doc(user.uid).get();
  if (!userProfileDoc.exists) {
    redirect('/login');
  }
  const userProfile = userProfileDoc.data() as UserProfile;

  const params = (await searchParams) ?? {};
  const requestedStatus = params.status;
  const allowedStatuses: Array<ListingStatus | 'all'> = ['all', 'pending', 'approved', 'rejected'];
  const activeStatus = allowedStatuses.includes((requestedStatus as ListingStatus | 'all') ?? 'all')
    ? ((requestedStatus as ListingStatus | 'all') ?? 'all')
    : 'all';

  const listingCounts = listings.reduce(
    (acc, listing) => {
      acc.all += 1;
      acc[listing.status] += 1;
      return acc;
    },
    { all: 0, pending: 0, approved: 0, rejected: 0 }
  );

  const visibleListings = activeStatus === 'all'
    ? listings
    : listings.filter((listing) => listing.status === activeStatus);

  return (
    <SellerPage
      title="Listings"
      description={`Manage your listings, ${userProfile.displayName || 'Seller'}.`}
      actions={(
        <Button asChild>
          <Link href="/listings/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Listing
          </Link>
        </Button>
      )}
    >
      <Card>
        <CardHeader>
          <CardTitle>Your Listings</CardTitle>
          <CardDescription>Review status, pricing, and edit details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'approved', label: 'Approved' },
              { key: 'rejected', label: 'Rejected' },
            ].map((item) => {
              const isActive = activeStatus === item.key;
              const href = item.key === 'all' ? '/dashboard/listings' : `/dashboard/listings?status=${item.key}`;
              const count = listingCounts[item.key as keyof typeof listingCounts];
              return (
                <Button key={item.key} asChild size="sm" variant={isActive ? 'default' : 'outline'}>
                  <Link href={href}>{item.label} ({count})</Link>
                </Button>
              );
            })}
          </div>

          {visibleListings.length > 0 ? (
            <>
              <div className="grid gap-4 md:hidden">
                {visibleListings.map((listing) => (
                  <div key={listing.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Link href={`/listings/${listing.id}`} className="font-semibold hover:underline">
                        {listing.title}
                      </Link>
                      <StatusBadge status={listing.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {listing.location} • Ksh {listing.price.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created {listing.createdAt ? formatRelative(listing.createdAt, new Date()) : 'N/A'}
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/listings/${listing.id}/edit`}>Edit Listing</Link>
                    </Button>
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Created</TableHead>
                      <TableHead className="text-right">Price (Ksh)</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleListings.map((listing) => (
                      <TableRow key={listing.id}>
                        <TableCell className="font-medium">
                          <Link href={`/listings/${listing.id}`} className="hover:underline">
                            {listing.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={listing.status} />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {listing.createdAt ? formatRelative(listing.createdAt, new Date()) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          {listing.price.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="icon">
                            <Link href={`/listings/${listing.id}/edit`}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit Listing</span>
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">{activeStatus === 'all' ? "You haven't created any listings yet." : `No ${activeStatus} listings yet.`}</p>
              <Button asChild className="mt-4">
                <Link href="/listings/new">Create Your First Listing</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </SellerPage>
  );
}
