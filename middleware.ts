import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const sessionCookie = req.cookies.get('msc_session')?.value;
  const { pathname } = req.url ? new URL(req.url) : { pathname: '' };

  const isAdminRoute = pathname.startsWith('/admin');
  const isManagerRoute = pathname.startsWith('/manager');
  const isCounterRoute = pathname.startsWith('/counter');
  const isOwnerRoute = pathname.startsWith('/dashboard');

  // If it's not a protected route, let it pass through normally
  if (!isAdminRoute && !isManagerRoute && !isCounterRoute && !isOwnerRoute) {
    return NextResponse.next();
  }

  // If no session cookie exists, redirect straight to login
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    // Parse the JSON session cookie set by your login route
    const session = JSON.parse(sessionCookie);
    const role = session?.role;

    // Strict Role Enforcement
    if (isAdminRoute && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    if (isManagerRoute && !['MANAGER', 'OWNER', 'ADMIN'].includes(role)) {
      return NextResponse.redirect(new URL('/counter', req.url));
    }
    if (isOwnerRoute && !['OWNER', 'ADMIN'].includes(role)) {
      return NextResponse.redirect(new URL('/counter', req.url));
    }
    if (isCounterRoute && !['STAFF', 'MANAGER', 'OWNER', 'ADMIN'].includes(role)) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
  } catch {
    // If cookie parsing fails, force a re-login
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/admin/:path*', '/manager/:path*', '/counter/:path*', '/dashboard/:path*'],
};