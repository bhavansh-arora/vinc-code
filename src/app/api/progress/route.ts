import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { q, now, tx } from '@/lib/db';
import { LEVEL_IDS, LEVELS } from '@/lib/levels';

/* Game progress for the signed-in student. The server re-checks everything the game sends. */

const PAINT_COST: Record<string, number> = { amber: 0, teal: 10, olive: 10, rust: 15, plum: 15, slate: 25 };
const HAT_COST: Record<string, number> = { none: 0, cap: 15, phones: 20, grad: 30, crown: 40 };
const PART_WORLD: Record<string, number> = { spring: 3, antenna: 4 };

async function student() {
  const u = await getCurrentUser();
  return u && u.role === 'student' ? u : null;
}

export async function GET() {
  const u = await student();
  if (!u) return NextResponse.json({ error: 'Sign in as a student to save progress.' }, { status: 401 });
  const sec = u.sectionId ? q.get<{ grade: number; name: string }>(`SELECT grade, name FROM sections WHERE id = ?`, u.sectionId) : undefined;
  const row = q.get<{ state: string }>(`SELECT state FROM game_state WHERE student_id = ?`, u.id);
  return NextResponse.json({ name: u.name, grade: sec?.grade ?? 3, section: sec?.name ?? null, state: row ? JSON.parse(row.state) : null });
}

export async function POST(req: Request) {
  const u = await student();
  if (!u) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  const text = await req.text();
  if (text.length > 20000) return NextResponse.json({ error: 'Too large.' }, { status: 413 });
  let body: { state?: Record<string, unknown> };
  try { body = JSON.parse(text); } catch { return NextResponse.json({ error: 'Bad data.' }, { status: 400 }); }
  const s = body.state ?? {};

  const best: Record<string, number> = {};
  for (const [id, v] of Object.entries((s.best ?? {}) as Record<string, unknown>)) {
    const n = Number(v);
    if (LEVEL_IDS.has(id) && Number.isInteger(n) && n >= 1 && n <= 3) best[id] = n;
  }
  // Keep the best stars ever earned, even if the browser sends less.
  for (const p of q.all<{ level_id: string; stars: number }>(`SELECT level_id, stars FROM level_progress WHERE student_id = ?`, u.id)) {
    if (LEVEL_IDS.has(p.level_id)) best[p.level_id] = Math.max(best[p.level_id] ?? 0, p.stars);
  }
  const owned = new Set(['amber', 'none']);
  for (const id of Array.isArray(s.owned) ? s.owned : []) if (typeof id === 'string' && (id in PAINT_COST || id in HAT_COST)) owned.add(id);
  const spent = [...owned].reduce((t, id) => t + (PAINT_COST[id] ?? HAT_COST[id] ?? 0), 0);
  const earned = Object.values(best).reduce((t, n) => t + n, 0) * 5;
  if (spent > earned) return NextResponse.json({ error: 'Not enough sparks for those items.' }, { status: 400 });
  const paint = typeof s.paint === 'string' && owned.has(s.paint) && s.paint in PAINT_COST ? s.paint : 'amber';
  const hat = typeof s.hat === 'string' && owned.has(s.hat) && s.hat in HAT_COST ? s.hat : 'none';
  const parts = Object.entries(PART_WORLD).filter(([, w]) => LEVELS.filter(l => l.world === w).every(l => best[l.id])).map(([id]) => id);
  const clean = {
    best, spent, owned: [...owned], paint, hat, parts,
    sound: s.sound !== false, unlockAll: false,
    cur: Number.isInteger(s.cur) && (s.cur as number) >= 0 && (s.cur as number) < LEVELS.length ? s.cur : 0,
    speed: [0, 1, 2].includes(s.speed as number) ? s.speed : 0
  };
  tx(() => {
    q.run(`INSERT INTO game_state (student_id, state, updated_at) VALUES (?, ?, ?) ON CONFLICT(student_id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at`, u.id, JSON.stringify(clean), now());
    for (const [id, n] of Object.entries(best)) {
      q.run(`INSERT INTO level_progress (student_id, level_id, stars, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(student_id, level_id) DO UPDATE SET stars = MAX(stars, excluded.stars), updated_at = excluded.updated_at`, u.id, id, n, now());
    }
  });
  return NextResponse.json({ ok: true, state: clean });
}
