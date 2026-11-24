'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { q, now } from '@/lib/db';
import { intParam } from '@/lib/accounts';
import { assessmentById, grade } from '@/data/assessments';

export async function submitAttemptAction(form: FormData) {
  const user = await requireRole('student');
  const assignmentId = intParam(form.get('assignmentId'));
  const g = q.get<{ id: number; assessment_id: string; section_id: number }>(`SELECT id, assessment_id, section_id FROM assignments WHERE id = ?`, assignmentId);
  if (!g || g.section_id !== user.sectionId) redirect('/student');
  const a = assessmentById(g.assessment_id);
  if (!a) redirect('/student');
  if (!q.get(`SELECT 1 FROM attempts WHERE assignment_id = ? AND student_id = ?`, g.id, user.id)) {
    const answers: Record<string, string> = {};
    for (const qn of a.questions) answers[qn.id] = String(form.get('q_' + qn.id) ?? '').trim().slice(0, 20);
    const r = grade(a, answers);
    q.run(`INSERT INTO attempts (assignment_id, student_id, answers, score, max_score, submitted_at) VALUES (?, ?, ?, ?, ?, ?)`,
      g.id, user.id, JSON.stringify(answers), r.score, r.max, now());
    revalidatePath('/student');
  }
  redirect(`/student/assessments/${g.id}`);
}
