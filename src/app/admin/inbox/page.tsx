'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Eye, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { AdminPage } from '../_components/admin-page';
import { ContactMessageActions, ListingReportActions } from '../_components/inbox-actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import { getInboxItemsAction } from '@/app/actions';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

type InboxItemStatus = 'new' | 'handled' | 'all';

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'new' | 'handled';
  createdAt?: string | null;
};

type ListingReport = {
  id: string;
  listingId: string;
  reason: string;
  reporter?: {
    uid?: string;
    email?: string | null;
    displayName?: string | null;
  } | null;
  status: 'new' | 'handled';
  createdAt?: string | null;
};


export default function AdminInboxPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [listingReports, setListingReports] = useState<ListingReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mainTab = searchParams.get('tab') || 'messages';
  const contactStatus = (searchParams.get('contact') as InboxItemStatus) || 'new';
  const reportStatus = (searchParams.get('report') as InboxItemStatus) || 'new';

  useEffect(() => {
    setIsLoading(true);
    getInboxItemsAction({
      contactStatus: contactStatus,
      reportStatus: reportStatus,
    }).then(data => {
      setContactMessages(data.contactMessages);
      setListingReports(data.listingReports);
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setIsLoading(false);
    });
  }, [contactStatus, reportStatus]);

  const handleFilterChange = (type: 'contact' | 'report', value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(type, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  const handleTabChange = (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', value);
      router.push(`${pathname}?${params.toString()}`);
  }

  const FilterTabs = ({ type, value }: { type: 'contact' | 'report', value: string }) => (
    <Tabs value={value} onValueChange={(v) => handleFilterChange(type, v)} className="mb-4">
        <TabsList>
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="handled">Handled</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
    </Tabs>
  );

  const MessagesContent = () => {
    if (isLoading) return <InboxSkeleton />;
    if (contactMessages.length === 0) {
        return (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No contact messages match the current filter.</p>
            </div>
        );
    }
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {contactMessages.map((message) => (
                <Card key={message.id} className="flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <CardTitle className="text-lg">{message.name}</CardTitle>
                                <CardDescription>{message.email}</CardDescription>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <Badge variant={message.status === 'new' ? 'warning' : 'outline'}>{message.status}</Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {message.createdAt ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true }) : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    </CardContent>
                    <CardFooter className="flex items-center gap-2">
                        <ContactMessageActions messageId={message.id} currentStatus={message.status} />
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
  };

  const ReportsContent = () => {
      if (isLoading) return <InboxSkeleton />;
      if (listingReports.length === 0) {
        return (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No listing reports match the current filter.</p>
            </div>
        );
      }
      return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {listingReports.map((report) => (
            <Card key={report.id} className="flex flex-col">
                <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <CardTitle className="text-lg">Report for listing</CardTitle>
                            <CardDescription>ID: {report.listingId}</CardDescription>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <Badge variant={report.status === 'new' ? 'warning' : 'outline'}>{report.status}</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                                {report.createdAt ? formatDistanceToNow(new Date(report.createdAt), { addSuffix: true }) : 'N/A'}
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                    <div>
                        <p className="text-sm font-semibold mb-1">Reporter:</p>
                        <p className="text-sm text-muted-foreground">{report.reporter?.displayName || 'Anonymous'} ({report.reporter?.email || 'No email'})</p>
                    </div>
                    <div>
                        <p className="text-sm font-semibold mb-1">Reason:</p>
                        <p className="text-sm whitespace-pre-wrap bg-secondary/50 p-3 rounded-md">{report.reason}</p>
                    </div>
                </CardContent>
                <CardFooter className="flex items-center gap-2">
                    <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/listings/${report.listingId}`}><Eye className="mr-2 h-4 w-4"/> View Listing</Link>
                    </Button>
                    <ListingReportActions reportId={report.id} currentStatus={report.status} />
                </CardFooter>
            </Card>
            ))}
        </div>
      );
  }

  return (
    <AdminPage
      title="Inbox"
      description="Review user messages and listing reports."
      breadcrumbs={[{ href: '/admin', label: 'Dashboard' }, { href: '/admin/inbox', label: 'Inbox' }]}
    >
        <Tabs value={mainTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="messages">Contact Messages</TabsTrigger>
                <TabsTrigger value="reports">Listing Reports</TabsTrigger>
            </TabsList>
            <TabsContent value="messages">
                <FilterTabs type="contact" value={contactStatus} />
                <MessagesContent />
            </TabsContent>
            <TabsContent value="reports">
                <FilterTabs type="report" value={reportStatus} />
                <ReportsContent />
            </TabsContent>
      </Tabs>
    </AdminPage>
  );
}

const InboxSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({length: 2}).map((_, i) => (
            <Card key={i}>
                <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <Skeleton className="h-6 w-32 mb-2" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                        <div className="text-right flex-shrink-0 space-y-2">
                            <Skeleton className="h-5 w-16 ml-auto" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardContent>
                <CardFooter className="flex items-center gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                </CardFooter>
            </Card>
        ))}
    </div>
);

    
