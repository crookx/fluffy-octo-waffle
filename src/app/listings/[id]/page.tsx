import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { getListingById } from '@/lib/data';
import { StatusBadge } from '@/components/status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  EyeOff,
  MapPin,
  Mountain,
  Square,
  LandPlot,
  Coins
} from 'lucide-react';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { UserProfile } from '@/lib/types';
import { TrustBadge } from '@/components/trust-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ContactSellerButton } from './_components/contact-seller-button';
import { BuyerTip } from '@/components/buyer-tip';
import { DynamicLocationMap } from '@/components/dynamic-location-map';
import { DynamicListingCarousel } from '@/components/dynamic-listing-carousel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { FavoriteButton } from '@/components/favorite-button';

async function getAuthenticatedUser(): Promise<{uid: string, role: UserProfile['role']} | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    if (!sessionCookie) return null;

    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
        if (!userDoc.exists) return null;
        
        const userProfile = userDoc.data() as UserProfile;
        return { uid: decodedToken.uid, role: userProfile.role };
    } catch(e) {
        return null;
    }
}


export default async function ListingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const listing = await getListingById(params.id);
  const user = await getAuthenticatedUser();

  if (!listing) {
    notFound();
  }

  // Security check: Only show approved listings to the public.
  // The owner and admins can see listings in any state.
  const isOwner = user?.uid === listing.ownerId;
  const isAdmin = user?.role === 'ADMIN';
  const canContact = user && !isOwner;
  const canViewEvidenceNames = isOwner || isAdmin;


  if (listing.status !== 'approved' && !isOwner && !isAdmin) {
    return (
        <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
            <div className="flex flex-col items-center justify-center text-center py-20">
                <EyeOff className="h-24 w-24 text-muted-foreground" />
                <h1 className="mt-8 text-3xl font-bold">Listing Not Available</h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    This listing is currently under review or is otherwise unavailable.
                </p>
            </div>
        </div>
    )
  }

  const {
    id,
    title,
    location,
    county,
    price,
    description,
    images,
    status,
    seller,
    evidence,
    area,
    size,
    landType,
    badge,
    latitude,
    longitude,
    isApproximateLocation
  } = listing;

  const listingDetails = [
    { icon: Coins, label: "Price", value: `Ksh ${price.toLocaleString()}`},
    { icon: MapPin, label: "Location", value: `${location}, ${county}` },
    { icon: Mountain, label: "Area", value: `${area} Acres` },
    { icon: Square, label: "Dimensions", value: size },
    { icon: LandPlot, label: "Land Type", value: landType },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12 pb-24 md:pb-12">
      <Alert className="mb-6 border-primary/30 bg-primary/5">
        <AlertTitle>Trust &amp; Verification</AlertTitle>
        <AlertDescription>
          Trust badges and approval statuses are based on seller-submitted documents and are not legal guarantees.
          Learn more in our{' '}
          <Link href="/trust" className="underline font-medium">
            Trust &amp; Verification guide
          </Link>
          .
        </AlertDescription>
      </Alert>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-8">
          <Card className="overflow-hidden">
            <CardHeader className="p-0 relative">
               <DynamicListingCarousel images={images} title={title} className="w-full" />
              <div className="absolute top-3 left-3 z-10">
                <FavoriteButton listingId={id} />
              </div>
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {badge && <TrustBadge badge={badge} />}
                <StatusBadge status={status} />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-primary md:text-4xl">
                    {title}
                  </h1>
                </div>
              </div>

               <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2 my-6 text-sm text-foreground/90">
                {listingDetails.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-2">
                    <Icon className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold">{label}</p>
                        <p className="text-muted-foreground">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <h2 className="text-2xl font-semibold tracking-tight mb-4">
                About this property
              </h2>
              <div className="prose prose-stone max-w-none text-foreground/90">
                <p>{description}</p>
              </div>

              <Separator className="my-6" />

              <h2 className="text-2xl font-semibold tracking-tight mb-4">
                Listed by
              </h2>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={seller.avatarUrl} alt={seller.name} />
                  <AvatarFallback>
                    {seller.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-medium">{seller.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>Location on Map</CardTitle>
              {isApproximateLocation && (
                <CardDescription>
                  Approximate location based on the seller&apos;s provided area. Verify exact boundaries before purchase.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {latitude && longitude ? (
                <DynamicLocationMap lat={latitude} lon={longitude} title={title} />
              ) : (
                <p className="text-muted-foreground">Location data is not available for this listing.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Context Sidebar */}
        <div className="space-y-6 md:sticky md:top-24 h-min">
          {canContact && (
            <Card className="hidden md:block">
              <CardContent className="p-4">
                <ContactSellerButton listingId={listing.id} />
              </CardContent>
            </Card>
          )}
          <BuyerTip />
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Evidence</CardTitle>
              <CardDescription>Documents provided by seller</CardDescription>
            </CardHeader>
            <CardContent>
              {evidence.length > 0 ? (
                <ul className="space-y-3">
                  {evidence.map((doc, index) => (
                    <li key={doc.id} className="flex items-center gap-3 p-2 rounded-md border">
                      <FileText className="h-5 w-5 flex-shrink-0 text-accent" />
                      <span
                        className="text-sm font-medium text-foreground/90 truncate"
                        title={canViewEvidenceNames ? doc.name : 'Seller-provided document'}
                      >
                        {canViewEvidenceNames ? doc.name : `Document ${index + 1}`}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No evidence has been uploaded for this listing yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Sticky CTA for Mobile */}
      {canContact && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-background/90 p-4 backdrop-blur-sm border-t">
          <ContactSellerButton listingId={listing.id} />
        </div>
      )}
    </div>
  );
}
