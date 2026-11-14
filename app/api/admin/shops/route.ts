import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.max(1, Number(searchParams.get('limit') || 10));
  const filter = searchParams.get('filter') || 'ALL';

  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const whereClause: Prisma.ShopWhereInput = {};

  if (filter === 'PAID') whereClause.isPaid = true;
  if (filter === 'UNPAID') whereClause.isPaid = false;
  if (filter === 'DUE_SOON') {
    whereClause.nextBillingDue = { lte: sevenDaysFromNow };
  }

  const [shops, total] = await Promise.all([
    prisma.shop.findMany({
      where: whereClause,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { users: true, bottles: true } } },
    }),
    prisma.shop.count({ where: whereClause }),
  ]);

  const enrichedShops = shops.map((shop: Prisma.ShopGetPayload<{
    include: { _count: { select: { users: true; bottles: true } } };
  }>) => ({
    ...shop,
    effectivePrice: shop.customPrice ?? shop.standardPrice,
    isDueSoon: new Date(shop.nextBillingDue).getTime() <= sevenDaysFromNow.getTime(),
  }));

  return NextResponse.json({
    shops: enrichedShops,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function PATCH(req: Request) {
  const { shopId, isPaid, customPrice, nextBillingDue } = await req.json();

  const updated = await prisma.shop.update({
    where: { id: shopId },
    data: {
      ...(typeof isPaid === 'boolean' ? { isPaid } : {}),
      ...(customPrice !== undefined ? { customPrice: customPrice === null ? null : Number(customPrice) } : {}),
      ...(nextBillingDue ? { nextBillingDue: new Date(nextBillingDue) } : {}),
    },
  });

  return NextResponse.json({ shop: updated });
}