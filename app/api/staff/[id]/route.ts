import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/src/prisma/db';
import { manageableShopId, requireRole } from '@/lib/auth';
import type { Session } from '@/lib/session-core';
import { UserRole } from '@/types/roles';

// Finds the person, but only if the caller is allowed to manage them.
// Managers: STAFF of their own shop. Owners: STAFF and MANAGERs of shops they own.
async function findManageable(session: Session, id: string) {
  const target = await db.orm.public.User.where({ id }).first();
  if (!target || !target.shopId || target.id === session.userId) return null;
  const allowedRoles = session.role === UserRole.OWNER ? [UserRole.STAFF, UserRole.MANAGER] : [UserRole.STAFF];
  if (!(allowedRoles as string[]).includes(target.role)) return null;
  const shopId = await manageableShopId(session, target.shopId);
  return shopId === target.shopId ? target : null;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireRole(UserRole.MANAGER, UserRole.OWNER);
  if (response) return response;
  const { id } = await ctx.params;
  const target = await findManageable(session, id);
  if (!target) return NextResponse.json({ error: 'Person not found.' }, { status: 404 });

  const { name, pin } = await req.json();
  const data: { name?: string; pinHash?: string } = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 });
    data.name = name.trim();
  }
  if (pin !== undefined && pin !== '') {
    if (typeof pin !== 'string' || !/^\d{4}$/.test(pin)) return NextResponse.json({ error: 'PIN must be exactly 4 digits.' }, { status: 400 });
    const others = await db.orm.public.User
      .where({ shopId: target.shopId })
      .where((u) => u.pinHash.isNotNull())
      .where((u) => u.id.neq(target.id))
      .all();
    for (const u of others) {
      if (u.pinHash && (await bcrypt.compare(pin, u.pinHash))) {
        return NextResponse.json({ error: 'PIN already assigned to another user.' }, { status: 409 });
      }
    }
    data.pinHash = await bcrypt.hash(pin, 10);
  }
  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });

  const updated = await db.orm.public.User.where({ id: target.id }).update(data);
  return NextResponse.json({ member: updated && { id: updated.id, name: updated.name, role: updated.role } });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireRole(UserRole.MANAGER, UserRole.OWNER);
  if (response) return response;
  const { id } = await ctx.params;
  const target = await findManageable(session, id);
  if (!target) return NextResponse.json({ error: 'Person not found.' }, { status: 404 });

  await db.orm.public.User.where({ id: target.id }).delete();
  return NextResponse.json({ ok: true });
}
