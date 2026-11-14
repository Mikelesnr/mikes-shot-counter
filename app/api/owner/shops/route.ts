import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/roles';

async function getSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get('msc_session')?.value;
  return raw ? JSON.parse(raw) : null;
}

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== UserRole.OWNER && session.role !== UserRole.ADMIN)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const shops = await prisma.shop.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      users: {
        where: { role: UserRole.MANAGER },
        select: { id: true, name: true, email: true },
      },
      _count: { select: { users: true, bottles: true } },
    },
  });

  return NextResponse.json({ shops });
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== UserRole.OWNER && session.role !== UserRole.ADMIN)) {
      return NextResponse.json({ error: 'Unauthorized: Only Shop Owners can create shops.' }, { status: 403 });
    }

    const { shopName, shooterSize, managerName, managerEmail, managerPassword, managerPin } = await req.json();

    if (!shopName || !managerName || !managerEmail || !managerPassword) {
      return NextResponse.json({ error: 'All shop and manager fields are required.' }, { status: 400 });
    }

    if (!/^\d{4}$/.test(managerPin)) {
      return NextResponse.json({ error: 'Manager PIN must be exactly 4 digits.' }, { status: 400 });
    }

    const normalizedManagerEmail = managerEmail.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedManagerEmail } });
    if (existingUser) {
      return NextResponse.json({ error: 'That manager email is already registered.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(managerPassword, 12);
    const pinHash = await bcrypt.hash(managerPin, 10);

    const shop = await prisma.shop.create({
      data: {
        name: shopName.trim(),
        shooterSize: Number(shooterSize) || 25,
        isPaid: false, // Remains locked until Mike toggles Paid status in Admin Dash
        nextBillingDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        users: {
          create: {
            name: managerName.trim(),
            email: normalizedManagerEmail,
            passwordHash,
            pinHash,
            role: UserRole.MANAGER,
          },
        },
      },
      include: {
        users: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return NextResponse.json({ shop });
  } catch (error) {
    console.error('Create shop error:', error);
    return NextResponse.json({ error: 'Failed to create shop.' }, { status: 500 });
  }
}