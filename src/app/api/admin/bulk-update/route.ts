import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingIds, status } = body || {};

    if (!Array.isArray(listingIds) || listingIds.length === 0) {
      return NextResponse.json({ status: 'error', message: 'No listing ids provided.' }, { status: 400 });
    }

    // Verify session cookie
    const sessionCookie = request.cookies.get('__session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ status: 'error', message: 'Authentication required.' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const userRole = userDoc.exists ? userDoc.data()?.role : null;

    if (userRole !== 'ADMIN') {
      return NextResponse.json({ status: 'error', message: 'Only admins are allowed.' }, { status: 403 });
    }

    const batch = adminDb.batch();
    listingIds.forEach((id: string) => {
      const ref = adminDb.collection('listings').doc(id);
      batch.update(ref, {
        status,
        updatedAt: FieldValue.serverTimestamp(),
        adminReviewedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    return NextResponse.json({ status: 'success' });
  } catch (err: any) {
    console.error('/api/admin/bulk-update error:', err?.message || err);
    return NextResponse.json({ status: 'error', message: err?.message || 'Unknown error' }, { status: 500 });
  }
}
