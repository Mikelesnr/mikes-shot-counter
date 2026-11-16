import { NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { canAccessShop, requireRole } from '@/lib/auth';
import { UserRole } from '@/types/roles';

export async function GET(req: Request) {
  const { session, response } = await requireRole();
  if (response) return response;

  const { searchParams } = new URL(req.url);
  // Staff and managers can only ever see their own shop, whatever the URL says.
  const requested =
    session.role === UserRole.STAFF || session.role === UserRole.MANAGER
      ? session.shopId
      : searchParams.get('shopId');

  if (!requested) return NextResponse.json({ error: 'shopId required' }, { status: 400 });
  if (!(await canAccessShop(session, requested))) {
    return NextResponse.json({ error: 'You do not have access to this shop.' }, { status: 403 });
  }

  const [shop, bottles] = await Promise.all([
    db.orm.public.Shop.where({ id: requested }).select('id', 'name', 'shooterSize').first(),
    db.orm.public.Bottle.where({ shopId: requested }).orderBy((b) => b.name.asc()).all(),
  ]);

  return NextResponse.json({ shop, bottles });
}

// Only a Shop Manager can change bottle specs, and only for their own shop.
export async function POST(req: Request) {
  const { session, response } = await requireRole(UserRole.MANAGER);
  if (response) return response;
  if (!session.shopId) {
    return NextResponse.json({ error: 'Your account is not linked to a shop.' }, { status: 400 });
  }

  const body = await req.json();
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const volume = Number(body.volume);
  const fullMass = Number(body.fullWeight);
  const emptyMass = Number(body.emptyWeight);

  if (!name) return NextResponse.json({ error: 'Bottle name is required.' }, { status: 400 });
  if (![volume, fullMass, emptyMass].every((n) => Number.isFinite(n) && n > 0)) {
    return NextResponse.json({ error: 'Volume and weights must be positive numbers.' }, { status: 400 });
  }
  if (fullMass <= emptyMass) {
    return NextResponse.json({ error: 'Full weight must be greater than empty weight.' }, { status: 400 });
  }

  const bottle = await db.orm.public.Bottle.create({ shopId: session.shopId, name, volume, fullMass, emptyMass });
  return NextResponse.json({ bottle });
}
