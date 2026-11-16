import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/src/prisma/db';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types/roles';

// Everything here is scoped to the manager's own shop, taken from their signed session.
export async function GET() {
  const { session, response } = await requireRole(UserRole.MANAGER);
  if (response) return response;
  if (!session.shopId) return NextResponse.json({ error: 'Your account is not linked to a shop.' }, { status: 400 });

  const shopId = session.shopId;
  const [staff, failedAttempts] = await Promise.all([
    db.orm.public.User
      .where({ shopId })
      .where((u) => u.role.in([UserRole.MANAGER, UserRole.STAFF]))
      .select('id', 'name', 'role', 'createdAt')
      .orderBy((u) => u.createdAt.desc())
      .all(),
    db.orm.public.PinAttempt
      .where({ shopId, success: false })
      .orderBy((a) => a.createdAt.desc())
      .limit(25)
      .all(),
  ]);

  return NextResponse.json({ staff, failedAttempts });
}

export async function POST(req: Request) {
  const { session, response } = await requireRole(UserRole.MANAGER);
  if (response) return response;
  if (!session.shopId) return NextResponse.json({ error: 'Your account is not linked to a shop.' }, { status: 400 });

  const { name, pin } = await req.json();
  if (typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Staff name is required.' }, { status: 400 });
  }
  if (typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: 'Staff PIN must be exactly 4 digits.' }, { status: 400 });
  }

  const shopId = session.shopId;
  const existingUsers = await db.orm.public.User.where({ shopId }).where((u) => u.pinHash.isNotNull()).all();
  for (const u of existingUsers) {
    if (u.pinHash && (await bcrypt.compare(pin, u.pinHash))) {
      return NextResponse.json({ error: 'PIN already assigned to another user.' }, { status: 409 });
    }
  }

  const pinHash = await bcrypt.hash(pin, 10);
  const staff = await db.orm.public.User.create({ name: name.trim(), pinHash, role: UserRole.STAFF, shopId });

  return NextResponse.json({ staff: { id: staff.id, name: staff.name, role: staff.role } });
}
