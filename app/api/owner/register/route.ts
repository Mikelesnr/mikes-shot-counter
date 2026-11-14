import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/roles';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password || password.length < 6) {
      return NextResponse.json(
        { error: 'Name, email, and a password of at least 6 characters are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const owner = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: UserRole.OWNER,
      },
    });

    const res = NextResponse.json({
      user: { id: owner.id, name: owner.name, email: owner.email, role: owner.role },
    });

    res.cookies.set(
      'msc_session',
      JSON.stringify({ userId: owner.id, role: owner.role, shopId: null }),
      { httpOnly: true, sameSite: 'lax', path: '/' }
    );

    return res;
  } catch (error) {
    console.error('Owner registration error:', error);
    return NextResponse.json({ error: 'Failed to create owner account.' }, { status: 500 });
  }
}