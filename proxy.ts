import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/session-core';
import { ROLE_HOME, UserRole } from '@/types/roles';

// Which role may open which area. Everything else on the site is public.
// The counter is open to every signed-in role; each dashboard is locked to exactly one role.
const AREAS: { prefix: string; roles: UserRole[] }[] = [
  { prefix: '/admin', roles: [UserRole.ADMIN] },
  { prefix: '/owner', roles: [UserRole.OWNER] },
  { prefix: '/manager', roles: [UserRole.MANAGER] },
  { prefix: '/counter', roles: [UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER, UserRole.ADMIN] },
];

function matchArea(pathname: string) {
  // /owner/register must stay public so new owners can sign up.
  if (pathname === '/owner/register' || pathname.startsWith('/owner/register/')) return null;
  return AREAS.find((a) => pathname === a.prefix || pathname.startsWith(`${a.prefix}/`)) ?? null;
}

export async function proxy(req: NextRequest) {
  const area = matchArea(req.nextUrl.pathname);
  if (!area) return NextResponse.next();

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    const login = new URL('/login', req.url);
    login.searchParams.set('next', req.nextUrl.pathname);
    const res = NextResponse.redirect(login);
    if (req.cookies.has(SESSION_COOKIE)) res.cookies.delete(SESSION_COOKIE); // expired or tampered
    return res;
  }

  if (!area.roles.includes(session.role)) {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role], req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/owner/:path*', '/manager/:path*', '/counter/:path*'],
};
