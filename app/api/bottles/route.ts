import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/roles';

async function getSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get('msc_session')?.value;
  return raw ? JSON.parse(raw) : null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get('shopId');
  if (!shopId) return NextResponse.json({ error: 'shopId required' }, { status: 400 });

  const [shop, bottles] = await Promise.all([
    prisma.shop.findUnique({ where: { id: shopId }, select: { id: true, name: true, shooterSize: true } }),
    prisma.bottle.findMany({ where: { shopId }, orderBy: { name: 'asc' } }),
  ]);

  return NextResponse.json({ shop, bottles });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role === UserRole.STAFF) {
    return NextResponse.json({ error: 'Unauthorized: Staff cannot modify bottle specs.' }, { status: 403 });
  }

  const { shopId, name, volume, fullWeight, emptyWeight } = await req.json();

  const bottle = await prisma.bottle.create({
    data: {
      shopId,
      name,
      volume: Number(volume),
      fullMass: Number(fullWeight),
      emptyMass: Number(emptyWeight),
    },
  });

  return NextResponse.json({ bottle });
}