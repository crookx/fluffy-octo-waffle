import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

async function getAuthenticatedUserFromCookie(cookieHeader: string | undefined) {
  try {
    if (!cookieHeader) return null;
    const match = cookieHeader.match(/__session=([^;]+)/);
    const sessionCookie = match?.[1];
    if (!sessionCookie) return null;
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists) return null;
    return { uid: decoded.uid, role: userDoc.data()?.role };
  } catch (err) {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || undefined;
    const user = await getAuthenticatedUserFromCookie(cookieHeader);
    if (!user) return NextResponse.json({ redirect: '/login' });

    let finalRedirect = '/';
    if (user.role === 'ADMIN') finalRedirect = '/admin';
    else if (user.role === 'SELLER') finalRedirect = '/dashboard';

    return NextResponse.json({ redirect: finalRedirect, role: user.role });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
