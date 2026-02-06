import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Eye, Mail, CheckCircle } from 'lucide-react';
import Link from 'next/link';

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  createdAt?: Date | null;
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
  status: string;
  createdAt?: Date | null;
};

const toDate = (timestamp: FirebaseFirestore.Timestamp | undefined) => {
  if (!timestamp) return null;
  return timestamp.toDate();
};

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

export default async function AdminInboxPage() {
  await checkAdmin();

  const [contactSnapshot, reportSnapshot] = await Promise.all([
    adminDb.collection('contactMessages').orderBy('createdAt', 'desc').limit(50).get(),
    adminDb.collection('listingReports').orderBy('createdAt', 'desc').limit(50).get(),
  ]);

  const contactMessages: ContactMessage[] = contactSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      email: data.email,
      message: data.message,
      status: data.status || 'new',
      createdAt: toDate(data.createdAt),
    };
  });

  const listingReports: ListingReport[] = reportSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      listingId: data.listingId,
      reason: data.reason,
      reporter: data.reporter ?? null,
      status: data.status || 'new',
      createdAt: toDate(data.createdAt),
    };
  });

  return (
    <div className="container mx-auto py-12 space-y-8">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
        <p className="text-muted-foreground">Review user messages and listing reports.</p>
      </div>

      <section>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">Contact Messages</h2>
         {contactMessages.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No contact messages yet.</p>
             </div>
          ) : (
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
                                    {message.createdAt ? formatDistanceToNow(message.createdAt, { addSuffix: true }) : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    </CardContent>
                    <CardFooter className="flex items-center gap-2">
                        <Button size="sm" variant="outline" disabled>
                            <Mail className="mr-2 h-4 w-4"/> Reply
                        </Button>
                        <Button size="sm" variant="outline" disabled>
                             <CheckCircle className="mr-2 h-4 w-4"/> Mark Handled
                        </Button>
                    </CardFooter>
                </Card>
              ))}
            </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">Listing Reports</h2>
        {listingReports.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No listing reports yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {listingReports.map((report) => (
                  <Card key={report.id} className="flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <CardTitle className="text-lg">Report for: {report.listingId}</CardTitle>
                                <CardDescription>
                                    By: {report.reporter?.displayName || 'Anonymous'} ({report.reporter?.email || 'No email'})
                                </CardDescription>
                            </div>
                             <div className="text-right flex-shrink-0">
                                <Badge variant={report.status === 'new' ? 'warning' : 'outline'}>{report.status}</Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {report.createdAt ? formatDistanceToNow(report.createdAt, { addSuffix: true }) : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                     <CardContent className="flex-1">
                        <p className="text-sm font-semibold mb-2">Reason:</p>
                        <p className="text-sm whitespace-pre-wrap bg-secondary/50 p-3 rounded-md">{report.reason}</p>
                    </CardContent>
                    <CardFooter className="flex items-center gap-2">
                        <Button asChild size="sm" variant="outline">
                           <Link href={`/admin/listings/${report.listingId}`}><Eye className="mr-2 h-4 w-4"/> View Listing</Link>
                        </Button>
                        <Button size="sm" variant="outline" disabled>
                            <CheckCircle className="mr-2 h-4 w-4"/> Mark Handled
                        </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          )}
      </section>
    </div>
  );
}
