import { notFound, redirect } from 'next/navigation';
import { getListingById } from '@/lib/data';
import { EditListingForm } from './_components/edit-listing-form';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';
import { SellerPage } from '@/components/seller/seller-page';

async function getAuthenticatedUser() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    if (!sessionCookie) return null;

    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        return decodedToken;
    } catch(e) {
        return null;
    }
}


export default async function EditListingPage({ params }: { params: { id: string } }) {
    const user = await getAuthenticatedUser();
    if (!user) {
        redirect('/login');
    }

    const listing = await getListingById(params.id);

    if (!listing) {
        notFound();
    }

    // Security check: only owner can edit. Admins use a different interface.
    if (listing.ownerId !== user.uid) {
        redirect('/denied');
    }

    return (
      <SellerPage
        title="Edit Listing"
        description="Update your property details. Changes will be re-submitted for review."
      >
        <div className="max-w-3xl">
          <EditListingForm listing={listing} />
        </div>
      </SellerPage>
    );
}
