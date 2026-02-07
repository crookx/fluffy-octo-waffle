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
import type { UserProfile } from '@/lib/types';
import { Edit, PlusCircle } from 'lucide-react';
import { SellerPage } from '@/components/seller/seller-page';
import { getAuthenticatedUser } from '../_lib/auth';

export default async function SellerListingsPage() {
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
          {listings.length > 0 ? (
            <>
              <div className="grid gap-4 md:hidden">
                {listings.map((listing) => (
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
                    {listings.map((listing) => (
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
              <p className="text-muted-foreground">You haven't created any listings yet.</p>
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
