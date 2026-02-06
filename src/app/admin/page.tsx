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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Shield, Award, BadgeCheck, Inbox } from 'lucide-react';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import { cn } from '@/lib/utils';
import { TrustBadge } from '@/components/trust-badge';

async function checkAdmin() {
  const sessionCookie = cookies().get('__session')?.value;
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


  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>Review and manage all property listings. {pendingListings.length} listing(s) require your review.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-sm text-muted-foreground">
              Manage listings, review trust badges, and respond to incoming reports and messages.
            </p>
            <Button asChild variant="outline">
              <Link href="/admin/inbox">
                <Inbox className="mr-2 h-4 w-4" />
                Reports &amp; Messages
              </Link>
            </Button>
          </div>
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
              {[...pendingListings, ...otherListings].map((listing) => (
                <TableRow key={listing.id} className={cn(listing.status === 'pending' && 'bg-warning/10 hover:bg-warning/20')}>
                  <TableCell className="font-medium">
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
