import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// This route is called to verify the session exists
export async function GET(request: NextRequest) {
  console.log('/api/auth/session GET: Checking if session exists.');
  const cookieHeader = request.headers.get('cookie') || '';
  console.log('/api/auth/session GET: Cookie header:', cookieHeader ? '[present]' : '[empty]');
  
  const sessionCookie = request.cookies.get('__session')?.value;
  
  if (!sessionCookie) {
    console.log('/api/auth/session GET: No session cookie found.');
    return NextResponse.json({ status: 'error', authenticated: false }, { status: 401 });
  }

  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    console.log('/api/auth/session GET: Session verified for user:', decodedToken.uid);
    let role: string | null = null;
    try {
      const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
      role = userDoc.exists ? userDoc.data()?.role ?? null : null;
    } catch (roleError: any) {
      console.warn('/api/auth/session GET: Unable to load user role:', roleError?.message ?? roleError);
    }
    return NextResponse.json({ status: 'success', authenticated: true, uid: decodedToken.uid, role });
  } catch (error: any) {
    console.error('/api/auth/session GET: Session verification failed:', error.message);
    return NextResponse.json({ status: 'error', authenticated: false }, { status: 401 });
  }
}

// This route is called on login/signup to create a session cookie
export async function POST(request: NextRequest) {
  console.log('/api/auth/session POST: Received request to create session cookie.');
  const { idToken } = await request.json();

  if (!idToken) {
    console.error('/api/auth/session POST: No idToken provided in the request body.');
    return NextResponse.json({ status: 'error', message: 'idToken is required.' }, { status: 400 });
  }

  // 5 days
  const expiresInMs = 60 * 60 * 24 * 5 * 1000;
  console.log('/api/auth/session POST: Attempting to create session cookie...');

  try {
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: expiresInMs });
    console.log('/api/auth/session POST: Session cookie created successfully.');

    // Allow HTTP during local development; rely on request protocol or production env for HTTPS.
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const isSecureContext = process.env.NODE_ENV === 'production'
      || forwardedProto === 'https'
      || request.nextUrl.protocol === 'https:';
    
    const options = { 
        name: '__session', 
        value: sessionCookie, 
        maxAge: expiresInMs / 1000, // Convert milliseconds to seconds for Next.js cookie
        httpOnly: true, 
        secure: isSecureContext,
        sameSite: 'lax' as const,
        path: '/' 
    };
    
    console.log('/api/auth/session POST: Setting cookie and sending success response.');
    const response = NextResponse.json({ status: 'success' });
    response.cookies.set(options);
    return response;
  } catch (error: any) {
    console.error("/api/auth/session POST: Error creating session cookie:", error);
    return NextResponse.json({ status: 'error', message: `Failed to create session cookie: ${error.message}` }, { status: 401 });
  }
}

// This route is called on logout
export async function DELETE() {
  console.log('/api/auth/session DELETE: Received request to delete session cookie.');
  const response = NextResponse.json({ status: 'success' });
  response.cookies.set('__session', '', { maxAge: 0 });
  console.log('/api/auth/session DELETE: Session cookie cleared.');
  return response;
}
