import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/roles';

export async function POST(req: Request) {
  const { shopId, name, pin } = await req.json();

  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: 'Staff PIN must be exactly 4 digits.' }, { status: 400 });
  }

  const existingUsers = await prisma.user.findMany({
    where: { shopId, pinHash: { not: null } },
  });

  for (const u of existingUsers) {
    if (u.pinHash && (await bcrypt.compare(pin, u.pinHash))) {
      return NextResponse.json({ error: 'PIN already assigned to another user.' }, { status: 409 });
    }
  }

  const pinHash = await bcrypt.hash(pin, 10);
  const staff = await prisma.user.create({
    data: { name, pinHash, role: UserRole.STAFF, shopId },
  });

  return NextResponse.json({ staff: { id: staff.id, name: staff.name, role: staff.role } });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get('shopId');

  if (!shopId) return NextResponse.json({ error: 'shopId required' }, { status: 400 });

  const [staff, failedAttempts] = await Promise.all([
    prisma.user.findMany({
      where: { shopId, role: { in: [UserRole.MANAGER, UserRole.STAFF] } },
      select: { id: true, name: true, role: true, createdAt: true },
    }),
    prisma.pinAttempt.findMany({
      where: { shopId, success: false },
      orderBy: { createdAt: 'desc' },
      take: 25,
    }),
  ]);

  return NextResponse.json({ staff, failedAttempts });
}