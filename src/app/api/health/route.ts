import { NextResponse } from 'next/server';
import { q } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Used by the Docker health check. Confirms the app is up and the database opens. */
export function GET() {
  try {
    q.get('SELECT 1');
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
