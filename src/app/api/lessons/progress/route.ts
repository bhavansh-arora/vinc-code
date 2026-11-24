import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { q, now } from '@/lib/db';
import { lessonById } from '@/data/lessons';

/* Saves a student's code for a lesson, and marks it done the first time it passes. */
export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (!u || u.role !== 'student') return NextResponse.json({ error: 'Log in as a student to save lessons.' }, { status: 401 });
  const text = await req.text();
  if (text.length > 25000) return NextResponse.json({ error: 'Too large.' }, { status: 413 });
  let body: { id?: string; code?: string; passed?: boolean };
  try { body = JSON.parse(text); } catch { return NextResponse.json({ error: 'Bad data.' }, { status: 400 }); }
  const lesson = lessonById(String(body.id ?? ''));
  if (!lesson) return NextResponse.json({ error: 'Unknown lesson.' }, { status: 404 });
  const code = String(body.code ?? '').slice(0, 20000);
  const t = now();
  q.run(`INSERT INTO lesson_progress (student_id, lesson_id, code, passed_at, runs, updated_at) VALUES (?, ?, ?, ?, 1, ?)
         ON CONFLICT(student_id, lesson_id) DO UPDATE SET code = excluded.code, runs = runs + 1, updated_at = excluded.updated_at,
         passed_at = COALESCE(lesson_progress.passed_at, excluded.passed_at)`, u.id, lesson.id, code, body.passed ? t : null, t);
  return NextResponse.json({ ok: true });
}
