import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const { listingId, reason } = await request.json();

    if (!listingId || !reason) {
      return NextResponse.json({ message: 'Listing ID and reason are required.' }, { status: 400 });
    }

    let reporter: { uid: string; email?: string | null; displayName?: string | null } | null = null;
    const sessionCookie = cookies().get('__session')?.value;
    if (sessionCookie) {
      try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          reporter = {
            uid: decodedToken.uid,
            email: userData?.email ?? decodedToken.email ?? null,
            displayName: userData?.displayName ?? decodedToken.name ?? null,
          };
        } else {
          reporter = { uid: decodedToken.uid, email: decodedToken.email ?? null, displayName: decodedToken.name ?? null };
        }
      } catch (authError) {
        console.warn('Report submission: unable to verify reporter identity.', authError);
      }
    }

    const reportRef = await adminDb.collection('listingReports').add({
      listingId,
      reason,
      reporter,
      createdAt: FieldValue.serverTimestamp(),
      status: 'new',
    });

    if (reporter?.email) {
      await adminDb.collection('emailQueue').add({
        to: reporter.email,
        template: 'report-confirmation',
        subject: 'We received your listing report',
        payload: {
          listingId,
          reportId: reportRef.id,
          name: reporter.displayName ?? 'there',
        },
        createdAt: FieldValue.serverTimestamp(),
        status: 'queued',
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Report submission failed:', error);
    return NextResponse.json({ message: 'Failed to submit report.' }, { status: 500 });
  }
}
