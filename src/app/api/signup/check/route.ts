import { NextResponse } from 'next/server';
import { allow, clientIp } from '@/lib/ratelimit';
import { normUsername, usernameStatus } from '@/lib/signup';

export const dynamic = 'force-dynamic';

/** Is this User ID free? Used while someone types on the sign-up form. */
export async function GET(req: Request) {
  if (!allow('check:' + await clientIp(), 120, 600_000)) return NextResponse.json({ error: 'Too many checks. Wait a few minutes.' }, { status: 429 });
  const u = normUsername(new URL(req.url).searchParams.get('u'));
  return NextResponse.json({ user: u, ...usernameStatus(u) });
}
