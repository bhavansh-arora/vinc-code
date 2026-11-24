import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { q, now } from '@/lib/db';
import { lessonById, parOf } from '@/data/lessons';
import { blockStars, checkBlocks, parseBlocks } from '@/lib/blocks';

/*
 * Saves a student's code for a lesson, marks it done the first time it passes, and keeps the best stars.
 * Block lessons (Classes 3 and 4) are checked again here, so passes and stars cannot be faked.
 * Python lessons run in the browser; their stars come from how many hints were used.
 */
export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (!u || u.role !== 'student') return NextResponse.json({ error: 'Log in as a student to save lessons.' }, { status: 401 });
  const text = await req.text();
  if (text.length > 25000) return NextResponse.json({ error: 'Too large.' }, { status: 413 });
  let body: { id?: string; code?: string; passed?: boolean; hints?: number };
  try { body = JSON.parse(text); } catch { return NextResponse.json({ error: 'Bad data.' }, { status: 400 }); }
  const lesson = lessonById(String(body.id ?? ''));
  if (!lesson) return NextResponse.json({ error: 'Unknown lesson.' }, { status: 404 });
  const code = String(body.code ?? '').slice(0, 20000);

  let passed = !!body.passed, stars = 0;
  if (lesson.check.kind === 'blocks') {
    try {
      const r = checkBlocks(lesson.check, parseBlocks(code));
      passed = r.passed; stars = passed ? blockStars(r.blocks, parOf(lesson)) : 0;
    } catch { passed = false; }
  } else if (passed) {
    const h = Math.max(0, Math.floor(Number(body.hints) || 0));
    stars = h === 0 ? 3 : h === 1 ? 2 : 1;
  }

  const t = now();
  q.run(`INSERT INTO lesson_progress (student_id, lesson_id, code, passed_at, runs, updated_at, stars) VALUES (?, ?, ?, ?, 1, ?, ?)
         ON CONFLICT(student_id, lesson_id) DO UPDATE SET code = excluded.code, runs = runs + 1, updated_at = excluded.updated_at,
         passed_at = COALESCE(lesson_progress.passed_at, excluded.passed_at), stars = MAX(lesson_progress.stars, excluded.stars)`,
    u.id, lesson.id, code, passed ? t : null, t, stars);
  const best = q.get<{ stars: number }>('SELECT stars FROM lesson_progress WHERE student_id = ? AND lesson_id = ?', u.id, lesson.id)?.stars ?? stars;
  return NextResponse.json({ ok: true, passed, stars, best });
}
