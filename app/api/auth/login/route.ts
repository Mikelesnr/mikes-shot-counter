import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/roles';

const LOCKOUT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes cooldown after 3 wrong attempts

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mode, email, password, shopId, pin } = body;

    if (mode === 'PASSWORD') {
      const user = await prisma.user.findUnique({
        where: { email: email?.toLowerCase().trim() },
        include: { shop: true },
      });

      if (!user || !user.passwordHash) {
        return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
      }

      if (
        (user.role === UserRole.MANAGER || user.role === UserRole.STAFF) &&
        user.shop &&
        !user.shop.isPaid
      ) {
        return NextResponse.json(
          { error: 'Shop subscription is inactive. Contact your Shop Owner or Admin.' },
          { status: 403 }
        );
      }

      // Determine appropriate redirect path based on strict access control rules
      let redirectTo = '/dashboard';
      if (user.role === UserRole.ADMIN) redirectTo = '/admin';
      else if (user.role === UserRole.MANAGER) redirectTo = '/manager';
      else if (user.role === UserRole.STAFF) redirectTo = '/counter';

      const res = NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          shopId: user.shopId,
          shopName: user.shop?.name || null,
        },
        redirectTo,
      });

      // Secure HTTP-only session cookie
      res.cookies.set('msc_session', JSON.stringify({ userId: user.id, role: user.role, shopId: user.shopId }), {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      });

      // Client-readable status flag so the Navbar updates instantly
      res.cookies.set('msc_logged_in', 'true', {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
      });

      return res;
    }

    if (mode === 'PIN') {
      if (!shopId || !pin || pin.length !== 4) {
        return NextResponse.json({ error: 'Shop ID and 4-digit PIN required.' }, { status: 400 });
      }

      const shop = await prisma.shop.findUnique({ where: { id: shopId } });
      if (!shop) {
        return NextResponse.json({ error: 'Terminal Shop ID not found. Clear terminal ID.' }, { status: 404 });
      }

      if (!shop.isPaid) {
        return NextResponse.json({ error: 'Access suspended: Shop payment is overdue.' }, { status: 403 });
      }

      const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MS);
      const recentAttempts = await prisma.pinAttempt.findMany({
        where: { shopId, createdAt: { gte: windowStart } },
        orderBy: { createdAt: 'desc' },
        take: 3,
      });

      const consecutiveFailures = recentAttempts.filter((attempt: { success: boolean }) => !attempt.success).length;
      if (recentAttempts.length === 3 && consecutiveFailures === 3) {
        const oldestFailureTime = recentAttempts[2].createdAt.getTime();
        const secondsLeft = Math.ceil((oldestFailureTime + LOCKOUT_WINDOW_MS - Date.now()) / 1000);
        return NextResponse.json(
          {
            error: `Terminal locked due to 3 failed PIN attempts. Try again in ${secondsLeft}s.`,
            lockedUntil: oldestFailureTime + LOCKOUT_WINDOW_MS,
          },
          { status: 429 }
        );
      }

      const shopUsers = await prisma.user.findMany({
        where: {
          shopId,
          role: { in: [UserRole.MANAGER, UserRole.STAFF] },
          pinHash: { not: null },
        },
      });

      let matchedUser = null;
      for (const candidate of shopUsers) {
        if (candidate.pinHash && (await bcrypt.compare(pin, candidate.pinHash))) {
          matchedUser = candidate;
          break;
        }
      }

      if (!matchedUser) {
        await prisma.pinAttempt.create({
          data: { shopId, enteredPin: pin, success: false },
        });

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

      await prisma.pinAttempt.create({
        data: {
          shopId,
          userId: matchedUser.id,
          targetRole: matchedUser.role,
          enteredPin: '****',
          success: true,
        },
      });

      const redirectTo = matchedUser.role === UserRole.STAFF ? '/counter' : '/manager';

      const res = NextResponse.json({
        user: {
          id: matchedUser.id,
          name: matchedUser.name,
          role: matchedUser.role,
          shopId: matchedUser.shopId,
          shopName: shop.name,
        },
        redirectTo,
      });

      res.cookies.set(
        'msc_session',
        JSON.stringify({ userId: matchedUser.id, role: matchedUser.role, shopId: matchedUser.shopId }),
        { httpOnly: true, sameSite: 'lax', path: '/' }
      );

      res.cookies.set('msc_logged_in', 'true', {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
      });

      return res;
    }

    return NextResponse.json({ error: 'Invalid login mode.' }, { status: 400 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}