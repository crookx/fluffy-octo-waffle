import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

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
    <div className="container mx-auto py-10 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Contact Messages</CardTitle>
          <CardDescription>Latest inquiries submitted from the contact form.</CardDescription>
        </CardHeader>
        <CardContent>
          {contactMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No contact messages yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sender</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contactMessages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell className="font-medium">{message.name}</TableCell>
                    <TableCell>{message.email}</TableCell>
                    <TableCell className="max-w-md truncate" title={message.message}>
                      {message.message}
                    </TableCell>
                    <TableCell>
                      <Badge variant={message.status === 'new' ? 'secondary' : 'outline'}>{message.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {message.createdAt ? formatDistanceToNow(message.createdAt, { addSuffix: true }) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listing Reports</CardTitle>
          <CardDescription>Reports submitted by buyers or visitors.</CardDescription>
        </CardHeader>
        <CardContent>
          {listingReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No listing reports yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Listing ID</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listingReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.listingId}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{report.reporter?.displayName || 'Anonymous'}</span>
                        <span className="text-xs text-muted-foreground">{report.reporter?.email || 'No email'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md truncate" title={report.reason}>
                      {report.reason}
                    </TableCell>
                    <TableCell>
                      <Badge variant={report.status === 'new' ? 'secondary' : 'outline'}>{report.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {report.createdAt ? formatDistanceToNow(report.createdAt, { addSuffix: true }) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
