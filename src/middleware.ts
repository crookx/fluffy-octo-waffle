import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth, adminDb } from './lib/firebase-admin';

// Force the middleware to run on the Node.js runtime
export const runtime = 'nodejs';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('__session')?.value;
  const isDev = process.env.NODE_ENV === 'development';
  
  console.log(`[Middleware] ${request.method} ${pathname} - Session Cookie: ${sessionCookie ? '[present]' : '[missing]'}`);

  // Skip middleware for server action requests — they handle their own auth
  if (request.headers.get('Next-Action')) {
    return NextResponse.next();
  }
  
  // These are public pages, but if a user is logged in, we don't want them to see it.
  const authPages = ['/login', '/signup'];
  if (authPages.includes(pathname) && sessionCookie) {
    // Only redirect navigation requests (GET), not programmatic POSTs
    if (request.method !== 'GET') {
      return NextResponse.next();
    }
    // Try to verify the session cookie and redirect users to a role-appropriate page
    try {
      const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
      const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
      const userRole = userDoc.exists ? userDoc.data()?.role : null;

      if (userRole === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else if (userRole === 'SELLER') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } else {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (e) {
      console.warn('[Middleware] Auth page session verification failed:', e);
      // If verification fails, clear cookie and show login/signup as usual
      const response = NextResponse.next();
      if (isDev) {
        response.headers.set(
          'Content-Security-Policy',
          [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "connect-src 'self' https: ws: wss:",
            "font-src 'self' data: https:",
            "object-src 'none'",
            "base-uri 'self'",
            "frame-ancestors 'self'",
          ].join('; ')
        );
      }
      response.cookies.set('__session', '', { maxAge: 0 });
      return response;
    }
  }

  // All pages that require a user to be logged in just to access
  const generalProtectedPages = ['/messages', '/profile', '/favorites', '/onboarding'];

  // All pages that require a SELLER or ADMIN role
  const sellerPages = ['/dashboard', '/listings/new', '/settings'];
  const editListingPattern = /^\/listings\/[^/]+\/edit$/;

  const isGeneralProtectedRoute = generalProtectedPages.some(p => pathname.startsWith(p));
  const isSellerRoute = sellerPages.some(p => pathname.startsWith(p)) || editListingPattern.test(pathname);
  const isAdminRoute = pathname.startsWith('/admin');

  // Handle all protected routes
  if (isGeneralProtectedRoute || isSellerRoute || isAdminRoute) {
      if (!sessionCookie) {
        console.log(`[Middleware] ${pathname} requires auth but no session cookie found, redirecting to /login`);
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        const response = NextResponse.redirect(loginUrl);
        if (isDev) {
          response.headers.set(
            'Content-Security-Policy',
            [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "connect-src 'self' https: ws: wss:",
              "font-src 'self' data: https:",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'self'",
            ].join('; ')
          );
        }
        return response;
      }

      // Verify the session cookie and get the user's role
      try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
        const userRole = userDoc.exists ? userDoc.data()?.role : null;

        console.log(`[Middleware] ${pathname} - User: ${decodedToken.uid}, Role: ${userRole}`);

        // Admin Role Check
        if (isAdminRoute && userRole !== 'ADMIN') {
          console.log(`[Middleware] ${pathname} requires ADMIN but user is ${userRole}, redirecting to /denied`);
          return NextResponse.redirect(new URL('/denied', request.url));
        }

        // Seller Role Check
        if (isSellerRoute && userRole !== 'SELLER' && userRole !== 'ADMIN') {
            return NextResponse.redirect(new URL('/denied', request.url));
        }

      } catch (error) {
        console.warn('[Middleware] Protected route session verification failed:', error);
        // Invalid session cookie, clear it and redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        const response = NextResponse.redirect(loginUrl);
        if (isDev) {
          response.headers.set(
            'Content-Security-Policy',
            [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "connect-src 'self' https: ws: wss:",
              "font-src 'self' data: https:",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'self'",
            ].join('; ')
          );
        }
        response.cookies.set('__session', '', { maxAge: 0 });
        return response;
      }
  }

  const response = NextResponse.next();
  if (isDev) {
    response.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "connect-src 'self' https: ws: wss:",
        "font-src 'self' data: https:",
        "object-src 'none'",
        "base-uri 'self'",
        "frame-ancestors 'self'",
      ].join('; ')
    );
  }
  return response;
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
