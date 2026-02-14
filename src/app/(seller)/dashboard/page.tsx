import Link from 'next/link';
import { adminDb } from '@/lib/firebase-admin';
import { getListingsForSeller } from '@/lib/data';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { redirect } from 'next/navigation';
import type { Conversation, Listing, UserProfile } from '@/lib/types';
import { Eye, ListChecks, MessageSquareText, PlusCircle, TrendingUp } from 'lucide-react';
import { SellerPage } from '@/components/seller/seller-page';
import { getConversationStatus, conversationStatusLabel } from '@/lib/conversation-status';
import { getAuthenticatedUser } from './_lib/auth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const statusStyles: Record<ReturnType<typeof getConversationStatus>, string> = {
  new: 'bg-warning/15 text-warning',
  responded: 'bg-success/15 text-success',
  closed: 'bg-muted text-muted-foreground',
};

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

  const statusCounts = listings.reduce(
    (acc, listing) => {
      acc.total += 1;
      acc[listing.status] += 1;
      return acc;
    },
    { total: 0, pending: 0, approved: 0, rejected: 0 }
  );

  const recentListings = [...listings]
    .sort((a, b) => {
      const aDate = a.createdAt?.toDate?.() ?? new Date(0);
      const bDate = b.createdAt?.toDate?.() ?? new Date(0);
      return bDate.getTime() - aDate.getTime();
    })
    .slice(0, 3);

  const recentActivity = [...listings]
    .sort((a, b) => {
      const aDate = a.updatedAt?.toDate?.() ?? new Date(0);
      const bDate = b.updatedAt?.toDate?.() ?? new Date(0);
      return bDate.getTime() - aDate.getTime();
    })
    .slice(0, 10);

  const conversationsSnapshot = await adminDb
    .collection('conversations')
    .where('participantIds', 'array-contains', user.uid)
    .orderBy('updatedAt', 'desc')
    .limit(3)
    .get();

  const recentConversations = conversationsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Conversation[];

  return (
    <SellerPage
      title="Dashboard"
      description={`Welcome back${userProfile.displayName ? `, ${userProfile.displayName}` : ''}.`}
      actions={(
        <Button asChild>
          <Link href="/listings/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Listing
          </Link>
        </Button>
      )}
    >
      {/* Quick Actions */}
      <div className="grid gap-3 md:grid-cols-3 mb-8">
        <Button asChild className="h-14 text-base">
          <Link href="/listings/new">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Listing
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-14 text-base">
          <Link href="/messages">
            <MessageSquareText className="mr-2 h-5 w-5" />
            View Messages
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-14 text-base">
          <Link href="/dashboard/listings">
            <ListChecks className="mr-2 h-5 w-5" />
            Manage Listings
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-10">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <ListChecks className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statusCounts.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all statuses</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <TrendingUp className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statusCounts.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting admin approval</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <StatusBadge status="approved" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{statusCounts.approved}</div>
            <p className="text-xs text-muted-foreground mt-1">Visible to buyers</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <StatusBadge status="rejected" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{statusCounts.rejected}</div>
            <p className="text-xs text-muted-foreground mt-1">Needs changes</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 rounded-lg border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <p className="text-sm text-muted-foreground">Your latest listing updates and review changes.</p>
          </div>
        </div>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No listing activity yet.</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((listing) => {
              const updatedAt = listing.updatedAt?.toDate?.();
              return (
                <div key={listing.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{listing.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{listing.location}, {listing.county}</p>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-1">
                    <StatusBadge status={listing.status} />
                    <span className="text-xs text-muted-foreground">
                      {updatedAt ? formatDistanceToNow(updatedAt, { addSuffix: true }) : 'Updated recently'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Listings Table</CardTitle>
              <CardDescription>Thumbnail, status, badge, views, and actions.</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/listings">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentListings.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">You haven't created any listings yet.</p>
                <Button asChild className="mt-4">
                  <Link href="/listings/new">Create Your First Listing</Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Badge</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentListings.map((listing: Listing) => (
                      <TableRow key={listing.id}>
                        <TableCell>
                          <div className="min-w-[220px]">
                            <Link href={`/listings/${listing.id}`} className="font-medium hover:underline">
                              {listing.title}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {listing.location} • Ksh {listing.price.toLocaleString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={listing.status} />
                        </TableCell>
                        <TableCell>{listing.badge ? <Badge variant="outline">{listing.badge}</Badge> : <span className="text-xs text-muted-foreground">None</span>}</TableCell>
                        <TableCell>{Math.max(5, Math.round(listing.price / 1000000))}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/listings/${listing.id}`}>
                                <Eye className="mr-1 h-3.5 w-3.5" />
                                View
                              </Link>
                            </Button>
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/listings/${listing.id}/edit`}>Edit</Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-muted-foreground" />
              Messages
            </CardTitle>
            <CardDescription>Recent buyer conversations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentConversations.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No conversations yet. Messages will appear when buyers contact you.
              </div>
            ) : (
              recentConversations.map((conversation) => {
                const status = getConversationStatus(conversation, user.uid);
                const updatedAt = conversation.updatedAt?.toDate?.();
                return (
                  <Link
                    key={conversation.id}
                    href={`/messages/${conversation.id}`}
                    className="block rounded-lg border p-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">{conversation.listingTitle}</p>
                      <Badge className={statusStyles[status]}>{conversationStatusLabel[status]}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {updatedAt ? `Updated ${formatDistanceToNow(updatedAt, { addSuffix: true })}` : 'Updated recently'}
                    </p>
                  </Link>
                );
              })
            )}
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/messages">Open Inbox</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </SellerPage>
  );
}
