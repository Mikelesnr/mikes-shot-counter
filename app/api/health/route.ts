import { NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';

// Open /api/health on your deployed site to see what is misconfigured. It never shows secret values.
export async function GET() {
  const secret = process.env.SESSION_SECRET;
  const checks = {
    SESSION_SECRET: secret ? (secret.length >= 32 ? 'ok' : 'too short (needs 32+ characters)') : 'MISSING',
    DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'MISSING',
    database: 'not checked' as string,
  };

  if (process.env.DATABASE_URL) {
    try {
      await db.orm.public.User.limit(1).all();
      checks.database = 'ok';
    } catch (error) {
      const cause = error instanceof Error ? (error.cause as { code?: string } | undefined) : undefined;
      console.error('Health check database error:', error);
      checks.database = `cannot connect${cause?.code ? ` (${cause.code})` : ''}. See the function logs.`;
    }
  }

  const healthy = checks.SESSION_SECRET === 'ok' && checks.database === 'ok';
  return NextResponse.json({ healthy, checks }, { status: healthy ? 200 : 503 });
}
