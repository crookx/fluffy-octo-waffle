import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth, adminDb } from './lib/firebase-admin';

// Force the middleware to run on the Node.js runtime
export const runtime = 'nodejs';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('__session')?.value;
  
  // These are public pages, but if a user is logged in, we don't want them to see it.
  const authPages = ['/login', '/signup'];
  if (authPages.includes(pathname) && sessionCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // All pages that require a user to be logged in
  const protectedPages = ['/admin', '/dashboard', '/listings/new', '/messages'];
  let isProtectedRoute = protectedPages.some(p => pathname.startsWith(p));

  // Regex to match /listings/{any-id}/edit
  const editListingPattern = /^\/listings\/[^/]+\/edit$/;
  if (!isProtectedRoute) {
    isProtectedRoute = editListingPattern.test(pathname);
  }

  // Handle all protected routes
  if (isProtectedRoute) {
      if (!sessionCookie) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // If it's an admin route, perform an additional role check
      if (pathname.startsWith('/admin')) {
          try {
            const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
            const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
            if (!userDoc.exists || userDoc.data()?.role !== 'ADMIN') {
              // Not an admin, redirect to access denied page
              return NextResponse.redirect(new URL('/denied', request.url));
            }
          } catch (error) {
            // Invalid session cookie, clear it and redirect to login
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            const response = NextResponse.redirect(loginUrl);
            response.cookies.set('__session', '', { maxAge: 0 });
            return response;
          }
      }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
