import { NextResponse } from 'next/server';
import { allow, clientIp } from '@/lib/ratelimit';
import { lookupFamily } from '@/lib/signup';

export const dynamic = 'force-dynamic';

/** Whose family code is this? Shows just enough for a parent to confirm. */
export async function GET(req: Request) {
  if (!allow('code:' + await clientIp(), 40, 600_000)) return NextResponse.json({ error: 'Too many tries. Wait 10 minutes.' }, { status: 429 });
  const kid = lookupFamily(new URL(req.url).searchParams.get('code'));
  if (!kid) return NextResponse.json({ error: 'No student has this family code.' }, { status: 404 });
  return NextResponse.json({ name: kid.name, grade: kid.grade, section: kid.section, school: kid.school });
}
