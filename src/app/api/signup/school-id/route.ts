import { NextResponse } from 'next/server';
import { allow, clientIp } from '@/lib/ratelimit';
import { lookupInvite } from '@/lib/signup';

export const dynamic = 'force-dynamic';

/** Is this School ID valid and still unused? */
export async function GET(req: Request) {
  if (!allow('code:' + await clientIp(), 40, 600_000)) return NextResponse.json({ error: 'Too many tries. Wait 10 minutes.' }, { status: 429 });
  const inv = lookupInvite(new URL(req.url).searchParams.get('code'));
  if (!inv) return NextResponse.json({ error: 'This School ID is not valid or has already been used.' }, { status: 404 });
  return NextResponse.json({ ok: true, note: inv.note });
}
