import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth, adminDb } from './lib/firebase-admin';
import { cookies } from 'next/headers';

// Force the middleware to run on the Node.js runtime
export const runtime = 'nodejs';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = cookies().get('__session')?.value;
  
  // These are public pages, but if a user is logged in, we don't want them to see it.
  const authPages = ['/login', '/signup'];
  if (authPages.includes(pathname) && sessionCookie) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // All pages that require a user to be logged in just to access
  const generalProtectedPages = ['/messages', '/profile', '/favorites', '/onboarding'];

  // All pages that require a SELLER or ADMIN role
  const sellerPages = ['/dashboard', '/listings/new'];
  const editListingPattern = /^\/listings\/[^/]+\/edit$/;

  const isGeneralProtectedRoute = generalProtectedPages.some(p => pathname.startsWith(p));
  const isSellerRoute = sellerPages.some(p => pathname.startsWith(p)) || editListingPattern.test(pathname);
  const isAdminRoute = pathname.startsWith('/admin');

  // Handle all protected routes
  if (isGeneralProtectedRoute || isSellerRoute || isAdminRoute) {
      if (!sessionCookie) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Verify the session cookie and get the user's role
      try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
        const userRole = userDoc.exists() ? userDoc.data()?.role : null;

        // Admin Role Check
        if (isAdminRoute && userRole !== 'ADMIN') {
          return NextResponse.redirect(new URL('/denied', request.url));
        }

        // Seller Role Check
        if (isSellerRoute && userRole !== 'SELLER' && userRole !== 'ADMIN') {
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
