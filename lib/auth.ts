import 'server-only';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { SESSION_COOKIE, verifySession, type Session } from '@/lib/session-core';
import { UserRole } from '@/types/roles';

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

type GuardResult = { session: Session; response?: undefined } | { session?: undefined; response: NextResponse };

/** For API routes: returns the session, or a ready-made 401/403 response. */
export async function requireRole(...roles: UserRole[]): Promise<GuardResult> {
  const session = await getSession();
  if (!session) {
    return { response: NextResponse.json({ error: 'Please sign in.' }, { status: 401 }) };
  }
  // A removed account must stop working immediately, not when its cookie expires.
  const stillExists = await db.orm.public.User.where({ id: session.userId }).first();
  if (!stillExists) {
    return { response: NextResponse.json({ error: 'This account no longer exists.' }, { status: 401 }) };
  }
  if (roles.length > 0 && !roles.includes(session.role)) {
    return { response: NextResponse.json({ error: 'You do not have access to this.' }, { status: 403 }) };
  }
  return { session };
}

/** Can this signed-in user read the given shop's bottles? Staff/Manager: their own shop. Owner: shops they own. Admin: any. */
export async function canAccessShop(session: Session, shopId: string): Promise<boolean> {
  if (session.role === UserRole.ADMIN) return true;
  if (session.role === UserRole.STAFF || session.role === UserRole.MANAGER) return session.shopId === shopId;
  if (session.role === UserRole.OWNER) {
    const shop = await db.orm.public.Shop.where({ id: shopId, ownerId: session.userId }).first();
    return shop !== null;
  }
  return false;
}

/**
 * The shop a manager or owner is allowed to manage people in.
 * Manager: always their own shop. Owner: the requested shop, only if they own it.
 */
export async function manageableShopId(session: Session, requested?: string | null): Promise<string | null> {
  if (session.role === UserRole.MANAGER) return session.shopId;
  if (session.role === UserRole.OWNER && requested) {
    const shop = await db.orm.public.Shop.where({ id: requested, ownerId: session.userId }).first();
    return shop ? shop.id : null;
  }
  return null;
}
