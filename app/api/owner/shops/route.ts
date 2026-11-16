import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/src/prisma/db';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types/roles';

// Owners only ever see and create their own shops.
export async function GET() {
  const { session, response } = await requireRole(UserRole.OWNER);
  if (response) return response;

  const shops = await db.orm.public.Shop
    .where({ ownerId: session.userId })
    .orderBy((s) => s.createdAt.desc())
    .include('users', (u) => u.where({ role: UserRole.MANAGER }).select('id', 'name', 'email'))
    .include('bottles', (b) => b.count())
    .all();

  return NextResponse.json({ shops });
}

export async function POST(req: Request) {
  try {
    const { session, response } = await requireRole(UserRole.OWNER);
    if (response) return response;

    const { shopName, shooterSize, managerName, managerEmail, managerPassword, managerPin } = await req.json();

    if (
      typeof shopName !== 'string' || !shopName.trim() ||
      typeof managerName !== 'string' || !managerName.trim() ||
      typeof managerEmail !== 'string' || !managerEmail.includes('@') ||
      typeof managerPassword !== 'string' || managerPassword.length < 8
    ) {
      return NextResponse.json(
        { error: 'Shop name, manager name, a valid manager email and a password of 8+ characters are required.' },
        { status: 400 }
      );
    }
    if (typeof managerPin !== 'string' || !/^\d{4}$/.test(managerPin)) {
      return NextResponse.json({ error: 'Manager PIN must be exactly 4 digits.' }, { status: 400 });
    }

    const size = Number(shooterSize) || 25;
    if (size <= 0 || size > 200) {
      return NextResponse.json({ error: 'Shooter size must be between 1 and 200 ml.' }, { status: 400 });
    }

    const normalizedManagerEmail = managerEmail.toLowerCase().trim();
    const existingUser = await db.orm.public.User.where({ email: normalizedManagerEmail }).first();
    if (existingUser) {
      return NextResponse.json({ error: 'That manager email is already registered.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(managerPassword, 12);
    const pinHash = await bcrypt.hash(managerPin, 10);

    // Remains locked until the Admin marks the shop as paid.
    const shop = await db.orm.public.Shop.create({
      name: shopName.trim(),
      shooterSize: size,
      isPaid: false,
      nextBillingDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ownerId: session.userId,
    });

    const manager = await db.orm.public.User.create({
      name: managerName.trim(),
      email: normalizedManagerEmail,
      passwordHash,
      pinHash,
      role: UserRole.MANAGER,
      shopId: shop.id,
    });

    return NextResponse.json({
      shop: { ...shop, users: [{ id: manager.id, name: manager.name, email: manager.email, role: manager.role }] },
    });
  } catch (error) {
    console.error('Create shop error:', error);
    return NextResponse.json({ error: 'Failed to create shop.' }, { status: 500 });
  }
}
