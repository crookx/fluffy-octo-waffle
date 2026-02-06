import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

// This route is called on login/signup to create a session cookie
export async function POST(request: NextRequest) {
  console.log('/api/auth/session POST: Received request to create session cookie.');
  const { idToken } = await request.json();

  if (!idToken) {
    console.error('/api/auth/session POST: No idToken provided in the request body.');
    return NextResponse.json({ status: 'error', message: 'idToken is required.' }, { status: 400 });
  }

  // 5 days
  const expiresIn = 60 * 60 * 24 * 5 * 1000;
  console.log('/api/auth/session POST: Attempting to create session cookie...');

  try {
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    console.log('/api/auth/session POST: Session cookie created successfully.');

    const options = { 
        name: '__session', 
        value: sessionCookie, 
        maxAge: expiresIn, 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
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
