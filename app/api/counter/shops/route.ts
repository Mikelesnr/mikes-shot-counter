import { NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types/roles';

// Shops the signed-in user may use on the shot counter.
export async function GET() {
  const { session, response } = await requireRole();
  if (response) return response;

  let shops: { id: string; name: string; shooterSize: number }[];
  if (session.role === UserRole.ADMIN) {
    shops = await db.orm.public.Shop.select('id', 'name', 'shooterSize').orderBy((s) => s.name.asc()).limit(200).all();
  } else if (session.role === UserRole.OWNER) {
    shops = await db.orm.public.Shop
      .where({ ownerId: session.userId })
      .select('id', 'name', 'shooterSize')
      .orderBy((s) => s.name.asc())
      .all();
  } else if (session.shopId) {
    shops = await db.orm.public.Shop.where({ id: session.shopId }).select('id', 'name', 'shooterSize').all();
  } else {
    shops = [];
  }

  return NextResponse.json({ shops });
}
