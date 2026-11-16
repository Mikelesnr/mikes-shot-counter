import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/src/prisma/db';
import { manageableShopId, requireRole } from '@/lib/auth';
import { UserRole } from '@/types/roles';

// List and add the people of one shop. Managers: their own shop. Owners: pass ?shopId= for a shop they own.
export async function GET(req: Request) {
  const { session, response } = await requireRole(UserRole.MANAGER, UserRole.OWNER);
  if (response) return response;
  const shopId = await manageableShopId(session, new URL(req.url).searchParams.get('shopId'));
  if (!shopId) return NextResponse.json({ error: 'Shop not found.' }, { status: 404 });

  const members = await db.orm.public.User
    .where({ shopId })
    .select('id', 'name', 'email', 'role', 'createdAt')
    .orderBy((u) => u.createdAt.asc())
    .all();
  return NextResponse.json({ members });
}

export async function POST(req: Request) {
  const { session, response } = await requireRole(UserRole.MANAGER, UserRole.OWNER);
  if (response) return response;

  const { shopId: requestedShop, name, pin } = await req.json();
  const shopId = await manageableShopId(session, requestedShop);
  if (!shopId) return NextResponse.json({ error: 'Shop not found.' }, { status: 404 });

  if (typeof name !== 'string' || !name.trim()) return NextResponse.json({ error: 'Staff name is required.' }, { status: 400 });
  if (typeof pin !== 'string' || !/^\d{4}$/.test(pin)) return NextResponse.json({ error: 'Staff PIN must be exactly 4 digits.' }, { status: 400 });

  const withPins = await db.orm.public.User.where({ shopId }).where((u) => u.pinHash.isNotNull()).all();
  for (const u of withPins) {
    if (u.pinHash && (await bcrypt.compare(pin, u.pinHash))) {
      return NextResponse.json({ error: 'PIN already assigned to another user.' }, { status: 409 });
    }
  }

  const staff = await db.orm.public.User.create({
    name: name.trim(),
    pinHash: await bcrypt.hash(pin, 10),
    role: UserRole.STAFF,
    shopId,
  });
  return NextResponse.json({ staff: { id: staff.id, name: staff.name, role: staff.role } });
}
