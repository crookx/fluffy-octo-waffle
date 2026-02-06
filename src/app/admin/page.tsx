import Link from 'next/link';
import { getAllListingsForAdmin } from '@/lib/data';
import { StatusBadge } from '@/components/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Inbox, List, Clock, CheckCircle, XCircle } from 'lucide-react';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import { cn } from '@/lib/utils';
import { TrustBadge } from '@/components/trust-badge';
import { Breadcrumbs } from '@/components/breadcrumbs';

async function checkAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) return redirect('/login');

  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'ADMIN') {
       return redirect('/denied');
    }
  } catch (error) {
    return redirect('/login');
  }
}

export default async function AdminDashboard() {
  await checkAdmin();
  const listings = await getAllListingsForAdmin();
  
  const pendingListings = listings.filter(l => l.status === 'pending');
  const otherListings = listings.filter(l => l.status !== 'pending');
  
  const totalListings = listings.length;
  const pendingListingsCount = pendingListings.length;
  const approvedListingsCount = listings.filter(l => l.status === 'approved').length;
  const rejectedListingsCount = listings.filter(l => l.status === 'rejected').length;

  return (
    <div className="container mx-auto py-12">
      <div className="mb-8">
        <Breadcrumbs items={[{ href: '/admin', label: 'Admin Dashboard' }]} />
        <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Review and manage all property listings. {pendingListings.length} listing(s) require your review.</p>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalListings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingListingsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Listings</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedListingsCount}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected Listings</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedListingsCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>All Listings</CardTitle>
              <Button asChild variant="outline">
                <Link href="/admin/inbox">
                  <Inbox className="mr-2 h-4 w-4" />
                  Reports &amp; Messages
                </Link>
              </Button>
            </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead className="hidden sm:table-cell">Seller</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">AI Badge</TableHead>
                  <TableHead>Assigned Badge</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No listings found.
                    </TableCell>
                  </TableRow>
                ) : (
                  [...pendingListings, ...otherListings].map((listing) => (
                  <TableRow key={listing.id} className={cn(listing.status === 'pending' && 'bg-warning/10 hover:bg-warning/20')}>
                    <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold">{listing.title}</span>
                          <span className="text-xs text-muted-foreground">{listing.location}</span>
                        </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{listing.seller.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={listing.status} />
                    </TableCell>
                     <TableCell className="hidden md:table-cell">
                      {listing.badgeSuggestion ? (
                        <TrustBadge badge={listing.badgeSuggestion.badge} />
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                       {listing.badge ? (
                        <TrustBadge badge={listing.badge} />
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/listings/${listing.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Review
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
