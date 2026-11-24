import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { q, now } from '@/lib/db';
import { playLevel, playStars } from '@/data/play';
import { checkBlocks, parseBlocks } from '@/lib/blocks';
import { checkScript } from '@/lib/vincscript';

/**
 * Saves a logged-in student's run of a /play level. The server runs the program again, so passes and stars
 * cannot be faked. Junior levels are the Class 3–4 block lessons, so teachers see them with the other lessons.
 */
export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (!u || u.role !== 'student') return NextResponse.json({ error: 'Log in as a student to save your progress.' }, { status: 401 });
  const text = await req.text();
  if (text.length > 25000) return NextResponse.json({ error: 'Too large.' }, { status: 413 });
  let body: { id?: string; code?: string };
  try { body = JSON.parse(text); } catch { return NextResponse.json({ error: 'Bad data.' }, { status: 400 }); }
  const level = playLevel(String(body.id ?? ''));
  if (!level) return NextResponse.json({ error: 'Unknown level.' }, { status: 404 });
  const code = String(body.code ?? '').slice(0, 20000);

  let passed = false, stars = 0;
  try {
    if (level.kind === 'junior' && level.lesson.check.kind === 'blocks') {
      const r = checkBlocks(level.lesson.check, parseBlocks(code));
      passed = r.passed; if (passed) stars = playStars(r.blocks, level.par);
    } else if (level.kind === 'adventure') {
      const r = checkScript(level.level.check, code);
      passed = r.passed; if (passed) stars = playStars(r.blocks, level.par);
    }
  } catch { passed = false; }

  const t = now();
  q.run(`INSERT INTO lesson_progress (student_id, lesson_id, code, passed_at, runs, updated_at, stars) VALUES (?, ?, ?, ?, 1, ?, ?)
         ON CONFLICT(student_id, lesson_id) DO UPDATE SET code = excluded.code, runs = runs + 1, updated_at = excluded.updated_at,
         passed_at = COALESCE(lesson_progress.passed_at, excluded.passed_at), stars = MAX(lesson_progress.stars, excluded.stars)`,
    u.id, level.id, code, passed ? t : null, t, stars);
  const best = q.get<{ stars: number }>('SELECT stars FROM lesson_progress WHERE student_id = ? AND lesson_id = ?', u.id, level.id)?.stars ?? stars;
  return NextResponse.json({ ok: true, passed, stars, best });
}
