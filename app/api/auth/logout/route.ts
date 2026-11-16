import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session-core';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // The session cookie is httpOnly, so only the server can clear it.
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
