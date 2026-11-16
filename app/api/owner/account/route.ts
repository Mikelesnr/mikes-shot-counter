import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/src/prisma/db';
import { requireRole } from '@/lib/auth';
import { SESSION_COOKIE } from '@/lib/session-core';
import { UserRole } from '@/types/roles';

// An owner deleting their own account. This also deletes every shop they own, with its people and bottles.
export async function DELETE(req: Request) {
  const { session, response } = await requireRole(UserRole.OWNER);
  if (response) return response;

  const { password } = await req.json().catch(() => ({}));
  const owner = await db.orm.public.User.where({ id: session.userId }).first();
  if (!owner?.passwordHash || typeof password !== 'string' || !(await bcrypt.compare(password, owner.passwordHash))) {
    return NextResponse.json({ error: 'Password is incorrect.' }, { status: 403 });
  }

  await db.orm.public.Shop.where({ ownerId: owner.id }).delete();
  await db.orm.public.User.where({ id: owner.id }).delete();

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
