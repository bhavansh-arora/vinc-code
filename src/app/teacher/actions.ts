'use server';
/* Class (section) actions. Used by teachers for their own sections and by school admins for any section in their school. */
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { q, now, tx } from '@/lib/db';
import { kidPassword } from '@/lib/passwords';
import { canManageSection, getSection } from '@/lib/data';
import { cleanName, createUser, intParam, setPassword, usernameFor, type ActionState, type Cred } from '@/lib/accounts';
import { assessmentById } from '@/data/assessments';

async function manageable(sectionId: number) {
  const user = await requireRole('teacher', 'school');
  const section = getSection(sectionId);
  if (!section || !canManageSection(user, section)) return { user, section: null };
  return { user, section };
}
function refresh() { revalidatePath('/teacher', 'layout'); revalidatePath('/school', 'layout'); }

export async function addStudentsAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const { section } = await manageable(intParam(form.get('sectionId')));
  if (!section) return { error: 'You cannot add students to this class.' };
  const names = String(form.get('names') ?? '').split(/\r?\n|,/).map(cleanName).filter(Boolean);
  if (!names.length) return { error: 'Type at least one name, one per line.' };
  if (names.length > 60) return { error: 'Add up to 60 students at a time.' };
  const school = q.get<{ code: string }>(`SELECT code FROM schools WHERE id = ?`, section.school_id)!;
  const creds: Cred[] = tx(() => names.map(name => {
    const username = usernameFor(school.code, name), password = kidPassword();
    createUser({ role: 'student', name, username, password, schoolId: section.school_id, sectionId: section.id });
    return { name, username, password };
  }));
  refresh();
  return { ok: `Added ${creds.length} student${creds.length === 1 ? '' : 's'} to ${section.name}.`, creds };
}

export async function resetStudentAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const studentId = intParam(form.get('studentId'));
  const st = q.get<{ id: number; name: string; username: string; section_id: number | null }>(`SELECT id, name, username, section_id FROM users WHERE id = ? AND role = 'student'`, studentId);
  if (!st || !st.section_id) return { error: 'Choose a student.' };
  const { section } = await manageable(st.section_id);
  if (!section) return { error: 'You cannot reset this password.' };
  const password = kidPassword();
  setPassword(st.id, password, false);
  return { ok: `New password set for ${st.name}.`, creds: [{ name: st.name, username: st.username, password }] };
}

export async function removeStudentAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const studentId = intParam(form.get('studentId'));
  const st = q.get<{ id: number; name: string; section_id: number | null }>(`SELECT id, name, section_id FROM users WHERE id = ? AND role = 'student'`, studentId);
  if (!st || !st.section_id) return { error: 'Choose a student.' };
  const { section } = await manageable(st.section_id);
  if (!section) return { error: 'You cannot remove this student.' };
  if (String(form.get('confirm') ?? '') !== 'yes') return { error: 'Tick the box to confirm.' };
  q.run(`UPDATE users SET active = 0 WHERE id = ?`, st.id);
  q.run(`DELETE FROM sessions WHERE user_id = ?`, st.id);
  refresh();
  return { ok: `${st.name} was removed from ${section.name}. Their results are kept.` };
}

export async function assignAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const { user, section } = await manageable(intParam(form.get('sectionId')));
  if (!section) return { error: 'You cannot assign work to this class.' };
  const a = assessmentById(String(form.get('assessmentId') ?? ''));
  if (!a || a.grade > section.grade) return { error: 'Choose an assessment for this class.' };
  const dueRaw = String(form.get('due') ?? '');
  if (dueRaw && !/^\d{4}-\d{2}-\d{2}$/.test(dueRaw)) return { error: 'Choose a valid due date.' };
  if (q.get(`SELECT 1 FROM assignments WHERE assessment_id = ? AND section_id = ?`, a.id, section.id)) return { error: `"${a.title}" is already assigned to ${section.name}.` };
  q.run(`INSERT INTO assignments (assessment_id, section_id, assigned_by, due_at, created_at) VALUES (?, ?, ?, ?, ?)`, a.id, section.id, user.id, dueRaw || null, now());
  refresh();
  return { ok: `Assigned "${a.title}" to ${section.name}. Students will see it on their dashboard.` };
}

export async function unassignAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const id = intParam(form.get('assignmentId'));
  const g = q.get<{ id: number; section_id: number }>(`SELECT id, section_id FROM assignments WHERE id = ?`, id);
  if (!g) return { error: 'Assessment not found.' };
  const { section } = await manageable(g.section_id);
  if (!section) return { error: 'You cannot change this class.' };
  const n = q.get<{ n: number }>(`SELECT COUNT(*) AS n FROM attempts WHERE assignment_id = ?`, id)!.n;
  if (n > 0) return { error: 'Students have already submitted this assessment, so it cannot be removed.' };
  q.run(`DELETE FROM assignments WHERE id = ?`, id);
  refresh();
  return { ok: 'Assessment removed.' };
}

export async function allowRetakeAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const attemptId = intParam(form.get('attemptId'));
  const at = q.get<{ id: number; section_id: number; name: string }>(`
    SELECT a.id, g.section_id, u.name FROM attempts a JOIN assignments g ON g.id = a.assignment_id JOIN users u ON u.id = a.student_id WHERE a.id = ?`, attemptId);
  if (!at) return { error: 'Attempt not found.' };
  const { section } = await manageable(at.section_id);
  if (!section) return { error: 'You cannot change this class.' };
  q.run(`DELETE FROM attempts WHERE id = ?`, at.id);
  refresh();
  return { ok: `${at.name} can take the assessment again.` };
}
