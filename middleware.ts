// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('firebaseAuthToken');
  const { pathname } = request.nextUrl;

  // Auth pages (logged-in user ne aa pages par jaavu nahi joie)
  const authPaths = ['/login', '/register', '/forgot-password'];
  const isAuthPath = authPaths.includes(pathname);

  // Guest mate fully public pages (login jaruri nathi)
  const publicPrefixes = ['/invitations/view'];
  const isPublicRoute = publicPrefixes.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );

  // Guest invitation page: hamesha allow
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Not authenticated + protected route -> login
  if (!token && !isAuthPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Authenticated + login/register page -> home
  if (token && isAuthPath) {
    return NextResponse.redirect(new URL('/', request.url));
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
     * - static asset files in /public (images, fonts, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|avif|bmp|css|js|woff|woff2|ttf|eot|map)$).*)',
  ],
};