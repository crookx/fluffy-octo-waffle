import Link from 'next/link';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
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
import { Edit } from 'lucide-react';

async function getAuthenticatedUser() {
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) return null;

    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        return decodedToken;
    } catch(e) {
        return null;
    }
}

export default async function SellerDashboard() {
  const user = await getAuthenticatedUser();

  if (!user) {
    // This is handled by middleware, but as a safeguard.
    redirect('/login');
  }

  const listings = await getListingsForSeller(user.uid);
  const userProfileDoc = await adminDb.collection('users').doc(user.uid).get();
  if (!userProfileDoc.exists) {
      // This should not happen if they are logged in and have a user record
      redirect('/login');
  }
  const userProfile = userProfileDoc.data() as UserProfile;


  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Seller Dashboard</CardTitle>
          <CardDescription>Welcome back, {userProfile.displayName}! Here you can manage your property listings.</CardDescription>
        </CardHeader>
        <CardContent>
           {listings.length > 0 ? (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Property Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Created</TableHead>
                        <TableHead className="text-right">Price (Ksh)</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {listings.map((listing) => (
                        <TableRow key={listing.id}>
                            <TableCell className="font-medium">
                                <Link href={`/listings/${listing.id}`} className="hover:underline">{listing.title}</Link>
                            </TableCell>
                            <TableCell>
                                <StatusBadge status={listing.status} />
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
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
    </div>
  );
}
