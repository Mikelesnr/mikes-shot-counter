// Edge/proxy-safe session helpers. Do not import next/headers or the database here:
// this file is also used by proxy.ts.
import { SignJWT, jwtVerify } from 'jose';
import { isUserRole, UserRole } from '@/types/roles';

export const SESSION_COOKIE = 'msc_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours: one bar shift plus clean-up

export interface Session {
  userId: string;
  role: UserRole;
  shopId: string | null;
  name: string;
}

function getKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET must be set to a random string of at least 32 characters.');
    }
    // Development only. Never reaches production because of the check above.
    return new TextEncoder().encode('dev-only-secret-change-me-dev-only-secret');
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(session: Session): Promise<string> {
  return new SignJWT({ role: session.role, shopId: session.shopId, name: session.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getKey());
}

export async function verifySession(token: string | undefined | null): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), { algorithms: ['HS256'] });
    if (!payload.sub || !isUserRole(payload.role)) return null;
    return {
      userId: payload.sub,
      role: payload.role,
      shopId: typeof payload.shopId === 'string' ? payload.shopId : null,
      name: typeof payload.name === 'string' ? payload.name : '',
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
};
