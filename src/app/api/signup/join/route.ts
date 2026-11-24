import { NextResponse } from 'next/server';
import { allow, clientIp } from '@/lib/ratelimit';
import { lookupJoin } from '@/lib/signup';

export const dynamic = 'force-dynamic';

/** Which school a joining code belongs to, and its sections. */
export async function GET(req: Request) {
  if (!allow('code:' + await clientIp(), 40, 600_000)) return NextResponse.json({ error: 'Too many tries. Wait 10 minutes and check the code with your teacher.' }, { status: 429 });
  const info = lookupJoin(new URL(req.url).searchParams.get('code'));
  if (!info) return NextResponse.json({ error: 'No school has this joining code. Check it with your teacher.' }, { status: 404 });
  return NextResponse.json({ kind: info.kind, school: { name: info.school.name, city: info.school.city }, sections: info.sections });
}
