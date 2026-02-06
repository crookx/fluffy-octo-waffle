import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { getListingById } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, AlertTriangle, ExternalLink } from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import { AdminActions } from './_components/admin-actions';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { DynamicListingCarousel } from '@/components/dynamic-listing-carousel';
import { cn } from '@/lib/utils';

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

export default async function AdminReviewPage({ params }: { params: { id: string } }) {
  await checkAdmin();
  const listing = await getListingById(params.id);

  if (!listing) {
    notFound();
  }

  const isImageSuspicious = listing.imageAnalysis?.isSuspicious === true;

  return (
    <div className="container mx-auto max-w-7xl py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Admin Review</h1>
        <p className="text-muted-foreground">Listing ID: <code className="text-sm font-mono bg-muted px-1 py-0.5 rounded">{listing.id}</code></p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
            <Card>
                 <CardHeader className="p-0 relative">
                    <DynamicListingCarousel images={listing.images} title={listing.title} className="w-full rounded-t-lg overflow-hidden" />
                    {isImageSuspicious && (
                        <div className="absolute top-3 left-3 bg-destructive/80 text-destructive-foreground p-2 rounded-md flex items-center gap-2 text-sm">
                            <AlertTriangle className="h-5 w-5" />
                            <span>Suspicious Main Image</span>
                        </div>
                    )}
                </CardHeader>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl">{listing.title}</CardTitle>
                            <CardDescription>{listing.location}</CardDescription>
                        </div>
                        <StatusBadge status={listing.status} />
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="font-semibold text-2xl text-primary mb-4">Ksh {listing.price.toLocaleString()}</p>
                    <p className="text-sm">{listing.description}</p>
                    <Separator className="my-4" />
                    <h3 className="font-semibold mb-2">Seller: {listing.seller.name}</h3>
                </CardContent>
            </Card>

            {/* Actions for mobile/tablet */}
            <div className="lg:hidden space-y-6">
                <AdminActions listing={listing} />
            </div>

            <Card>
            <CardHeader>
                <CardTitle>Uploaded Evidence</CardTitle>
                <CardDescription>Documents provided by the seller for verification. Click to view.</CardDescription>
            </CardHeader>
            <CardContent>
                {listing.evidence && listing.evidence.length > 0 ? (
                <ul className="space-y-3">
                    {listing.evidence.map((doc) => (
                    <li key={doc.id}>
                       <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={cn(
                                "flex items-center gap-3 p-2 rounded-md border transition-colors",
                                doc.url ? "hover:bg-muted/50" : "cursor-not-allowed opacity-60"
                            )}
                            onClick={(e) => !doc.url && e.preventDefault()}
                            title={doc.url ? `View ${doc.name}` : `${doc.name} (Preview not available)`}
                        >
                            <FileText className="h-5 w-5 flex-shrink-0 text-accent" />
                            <span className="text-sm font-medium text-foreground/90 flex-1 truncate">{doc.name}</span>
                            {doc.url && <ExternalLink className="h-4 w-4 text-muted-foreground" />}
                        </a>
                    </li>
                    ))}
                </ul>
                ) : (
                <div className="text-center py-6">
                    <p className="text-muted-foreground">No evidence has been uploaded for this listing.</p>
                </div>
                )}
            </CardContent>
            </Card>
        </div>

        {/* Admin Actions Sidebar for Desktop */}
        <div className="hidden lg:block space-y-6 lg:sticky lg:top-24 h-min">
            <AdminActions listing={listing} />
        </div>
      </div>
    </div>
  );
}
