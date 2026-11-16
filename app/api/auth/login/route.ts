import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/src/prisma/db';
import { SESSION_COOKIE, sessionCookieOptions, signSession } from '@/lib/session-core';
import { ROLE_HOME, UserRole } from '@/types/roles';

const LOCKOUT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes cooldown after 3 wrong attempts

// A real bcrypt hash of a random string, used so unknown emails take as long as wrong passwords.
const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEeO5G6yQx0JYy3o4n9r1vJf8o2K1o0vQ3e';

async function startSession(user: { id: string; name: string; role: string; shopId: string | null }, shopName: string | null) {
  const res = NextResponse.json({
    user: { id: user.id, name: user.name, role: user.role, shopId: user.shopId, shopName },
    redirectTo: ROLE_HOME[user.role as UserRole] ?? '/counter',
  });
  const token = await signSession({
    userId: user.id,
    role: user.role as UserRole,
    shopId: user.shopId,
    name: user.name,
  });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}

export async function POST(req: Request) {
  try {
    const { mode, email, password, shopId, pin } = await req.json();

    if (mode === 'PASSWORD') {
      if (typeof email !== 'string' || typeof password !== 'string') {
        return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
      }

      const user = await db.orm.public.User.where({ email: email.toLowerCase().trim() }).include('shop').first();
      const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

      if (!user || !user.passwordHash || !valid) {
        return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
      }

      if ((user.role === UserRole.MANAGER || user.role === UserRole.STAFF) && user.shop && !user.shop.isPaid) {
        return NextResponse.json(
          { error: 'Shop subscription is inactive. Contact your Shop Owner or Admin.' },
          { status: 403 }
        );
      }

      return startSession(user, user.shop?.name ?? null);
    }

    if (mode === 'PIN') {
      if (typeof shopId !== 'string' || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
        return NextResponse.json({ error: 'Shop ID and 4-digit PIN required.' }, { status: 400 });
      }

      const shop = await db.orm.public.Shop.where({ id: shopId }).first();
      if (!shop) {
        return NextResponse.json({ error: 'Terminal Shop ID not found. Clear terminal ID.' }, { status: 404 });
      }
      if (!shop.isPaid) {
        return NextResponse.json({ error: 'Access suspended: Shop payment is overdue.' }, { status: 403 });
      }

      const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MS);
      const recentAttempts = await db.orm.public.PinAttempt
        .where({ shopId })
        .where((a) => a.createdAt.gte(windowStart))
        .orderBy((a) => a.createdAt.desc())
        .limit(3)
        .all();

      const consecutiveFailures = recentAttempts.filter((a) => !a.success).length;
      if (recentAttempts.length === 3 && consecutiveFailures === 3) {
        const oldestFailureTime = recentAttempts[2].createdAt.getTime();
        const secondsLeft = Math.max(1, Math.ceil((oldestFailureTime + LOCKOUT_WINDOW_MS - Date.now()) / 1000));
        return NextResponse.json(
          {
            error: `Terminal locked due to 3 failed PIN attempts. Try again in ${secondsLeft}s.`,
            lockedUntil: oldestFailureTime + LOCKOUT_WINDOW_MS,
          },
          { status: 429 }
        );
      }

      const shopUsers = await db.orm.public.User
        .where({ shopId })
        .where((u) => u.pinHash.isNotNull())
        .all();

      let matchedUser: (typeof shopUsers)[number] | null = null;
      for (const candidate of shopUsers) {
        if (
          (candidate.role === UserRole.MANAGER || candidate.role === UserRole.STAFF) &&
          candidate.pinHash &&
          (await bcrypt.compare(pin, candidate.pinHash))
        ) {
          matchedUser = candidate;
          break;
        }
      }

      if (!matchedUser) {
        await db.orm.public.PinAttempt.create({ shopId, enteredPin: pin, success: false });
        const remainingTries = Math.max(0, 2 - consecutiveFailures);
        return NextResponse.json(
          {
            error:
              remainingTries > 0
                ? `Incorrect PIN. ${remainingTries} attempt(s) remaining before lockout.`
                : 'Incorrect PIN. Terminal locked for 5 minutes.',
          },
          { status: 401 }
        );
      }

      await db.orm.public.PinAttempt.create({
        shopId,
        userId: matchedUser.id,
        targetRole: matchedUser.role,
        enteredPin: '****',
        success: true,
      });

      return startSession(matchedUser, shop.name);
    }

    return NextResponse.json({ error: 'Invalid login mode.' }, { status: 400 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
