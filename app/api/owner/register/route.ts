import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/src/prisma/db';
import { SESSION_COOKIE, sessionCookieOptions, signSession } from '@/lib/session-core';
import { UserRole } from '@/types/roles';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (
      typeof name !== 'string' || !name.trim() ||
      typeof email !== 'string' || !email.includes('@') ||
      typeof password !== 'string' || password.length < 8
    ) {
      return NextResponse.json(
        { error: 'Name, a valid email, and a password of at least 8 characters are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await db.orm.public.User.where({ email: normalizedEmail }).first();
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const owner = await db.orm.public.User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: UserRole.OWNER,
    });

    const res = NextResponse.json({
      user: { id: owner.id, name: owner.name, email: owner.email, role: owner.role },
    });
    const token = await signSession({ userId: owner.id, role: UserRole.OWNER, shopId: null, name: owner.name });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  } catch (error) {
    console.error('Owner registration error:', error);
    return NextResponse.json({ error: 'Failed to create owner account.' }, { status: 500 });
  }
}
