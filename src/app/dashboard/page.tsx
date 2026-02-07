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
import { ListChecks, MessageSquareText, PlusCircle, TrendingUp } from 'lucide-react';
import { SellerPage } from '@/components/seller/seller-page';
import { getConversationStatus, conversationStatusLabel } from '@/lib/conversation-status';
import { getAuthenticatedUser } from './_lib/auth';

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.total}</div>
            <p className="text-xs text-muted-foreground">Across all statuses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting admin approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <StatusBadge status="approved" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.approved}</div>
            <p className="text-xs text-muted-foreground">Visible to buyers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <StatusBadge status="rejected" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.rejected}</div>
            <p className="text-xs text-muted-foreground">Needs changes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Latest Listings</CardTitle>
              <CardDescription>Recent listings you have created.</CardDescription>
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
              <div className="space-y-3">
                {recentListings.map((listing: Listing) => (
                  <div
                    key={listing.id}
                    className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <Link href={`/listings/${listing.id}`} className="font-medium hover:underline">
                        {listing.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {listing.location} • Ksh {listing.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={listing.status} />
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/listings/${listing.id}/edit`}>Edit</Link>
                      </Button>
                    </div>
                  </div>
                ))}
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
