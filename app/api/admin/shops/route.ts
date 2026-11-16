import { NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { requireRole } from '@/lib/auth';
import { UserRole } from '@/types/roles';

export async function GET(req: Request) {
  const { response } = await requireRole(UserRole.ADMIN);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 10));
  const filter = searchParams.get('filter') || 'ALL';

  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  let shops = db.orm.public.Shop;
  if (filter === 'PAID') shops = shops.where({ isPaid: true });
  else if (filter === 'UNPAID') shops = shops.where({ isPaid: false });
  else if (filter === 'DUE_SOON') shops = shops.where((s) => s.nextBillingDue.lte(sevenDaysFromNow));

  const [rows, totals] = await Promise.all([
    shops
      .orderBy((s) => s.createdAt.desc())
      .include('users', (u) => u.count())
      .include('bottles', (b) => b.count())
      .limit(limit)
      .offset((page - 1) * limit)
      .all(),
    shops.aggregate((a) => ({ total: a.count() })),
  ]);

  const total = totals.total;

  // Whole-fleet numbers (not just the current page or filter).
  const [paidStandard, paidCustom, dueSoon, paidCount] = await Promise.all([
    db.orm.public.Shop.where({ isPaid: true, customPrice: null }).aggregate((a) => ({ sum: a.sum('standardPrice') })),
    db.orm.public.Shop
      .where({ isPaid: true })
      .where((s) => s.customPrice.isNotNull())
      .aggregate((a) => ({ sum: a.sum('customPrice') })),
    db.orm.public.Shop.where((s) => s.nextBillingDue.lte(sevenDaysFromNow)).aggregate((a) => ({ n: a.count() })),
    db.orm.public.Shop.where({ isPaid: true }).aggregate((a) => ({ n: a.count() })),
  ]);
  const stats = {
    paidMrr: (paidStandard.sum ?? 0) + (paidCustom.sum ?? 0),
    dueSoon: dueSoon.n,
    paidShops: paidCount.n,
  };
  const enrichedShops = rows.map((shop) => ({
    ...shop,
    effectivePrice: shop.customPrice ?? shop.standardPrice,
    isDueSoon: shop.nextBillingDue.getTime() <= sevenDaysFromNow.getTime(),
    _count: { users: shop.users, bottles: shop.bottles },
  }));

  return NextResponse.json({
    shops: enrichedShops,
    stats,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
}

export async function PATCH(req: Request) {
  const { response } = await requireRole(UserRole.ADMIN);
  if (response) return response;

  const { shopId, isPaid, customPrice, nextBillingDue } = await req.json();
  if (typeof shopId !== 'string') return NextResponse.json({ error: 'shopId required' }, { status: 400 });

  const data: { isPaid?: boolean; customPrice?: number | null; nextBillingDue?: Date } = {};
  if (typeof isPaid === 'boolean') data.isPaid = isPaid;
  if (customPrice !== undefined) {
    if (customPrice === null || customPrice === '') data.customPrice = null;
    else if (Number.isFinite(Number(customPrice)) && Number(customPrice) >= 0) data.customPrice = Number(customPrice);
    else return NextResponse.json({ error: 'Custom price must be a positive number.' }, { status: 400 });
  }
  if (nextBillingDue) {
    const d = new Date(nextBillingDue);
    if (Number.isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid billing date.' }, { status: 400 });
    data.nextBillingDue = d;
  }
  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });

  const updated = await db.orm.public.Shop.where({ id: shopId }).update(data);
  if (!updated) return NextResponse.json({ error: 'Shop not found.' }, { status: 404 });
  return NextResponse.json({ shop: updated });
}
