import { NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types/roles';

async function ownedShop(ownerId: string, shopId: string) {
  return db.orm.public.Shop.where({ id: shopId, ownerId }).first();
}

export async function PATCH(req: Request, ctx: { params: Promise<{ shopId: string }> }) {
  const { session, response } = await requireRole(UserRole.OWNER);
  if (response) return response;
  const { shopId } = await ctx.params;
  if (!(await ownedShop(session.userId, shopId))) return NextResponse.json({ error: 'Shop not found.' }, { status: 404 });

  const { name, shooterSize } = await req.json();
  const data: { name?: string; shooterSize?: number } = {};
  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) return NextResponse.json({ error: 'Shop name cannot be empty.' }, { status: 400 });
    data.name = name.trim();
  }
  if (shooterSize !== undefined) {
    const size = Number(shooterSize);
    if (!Number.isFinite(size) || size <= 0 || size > 200) return NextResponse.json({ error: 'Shooter size must be between 1 and 200 ml.' }, { status: 400 });
    data.shooterSize = size;
  }
  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });

  const shop = await db.orm.public.Shop.where({ id: shopId }).update(data);
  return NextResponse.json({ shop });
}

// Permanently deletes the shop, its staff and manager accounts, bottles and PIN history.
export async function DELETE(req: Request, ctx: { params: Promise<{ shopId: string }> }) {
  const { session, response } = await requireRole(UserRole.OWNER);
  if (response) return response;
  const { shopId } = await ctx.params;
  const shop = await ownedShop(session.userId, shopId);
  if (!shop) return NextResponse.json({ error: 'Shop not found.' }, { status: 404 });

  const { confirmName } = await req.json().catch(() => ({}));
  if (confirmName !== shop.name) {
    return NextResponse.json({ error: 'Type the shop name exactly to confirm deletion.' }, { status: 400 });
  }

  await db.orm.public.Shop.where({ id: shopId }).delete();
  return NextResponse.json({ ok: true });
}
