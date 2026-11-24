'use server';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { q, now } from '@/lib/db';
import { tempPassword } from '@/lib/passwords';
import { cleanName, createUser, intParam, setPassword, usernameFor, type ActionState } from '@/lib/accounts';

function refresh() { revalidatePath('/school', 'layout'); revalidatePath('/teacher', 'layout'); }

export async function createTeacherAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole('school');
  const name = cleanName(String(form.get('name') ?? ''));
  if (name.length < 2) return { error: "Type the teacher's full name." };
  const school = q.get<{ code: string }>(`SELECT code FROM schools WHERE id = ?`, user.schoolId!)!;
  const username = usernameFor(school.code, name, 'teacher'), password = tempPassword();
  createUser({ role: 'teacher', name, username, password, schoolId: user.schoolId, mustChange: true });
  refresh();
  return { ok: `${name} can now sign in. They will choose their own password the first time.`, creds: [{ name, username, password }] };
}

export async function resetTeacherAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole('school');
  const t = q.get<{ id: number; name: string; username: string }>(`SELECT id, name, username FROM users WHERE id = ? AND role = 'teacher' AND school_id = ?`, intParam(form.get('teacherId')), user.schoolId!);
  if (!t) return { error: 'Choose a teacher.' };
  const password = tempPassword();
  setPassword(t.id, password, true);
  return { ok: `Temporary password set for ${t.name}.`, creds: [{ name: t.name, username: t.username, password }] };
}

export async function createSectionAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole('school');
  const grade = intParam(form.get('grade'));
  const name = cleanName(String(form.get('name') ?? '')).slice(0, 20);
  const teacherId = intParam(form.get('teacherId')) || null;
  if (grade < 3 || grade > 8) return { error: 'Choose a class from 3 to 8.' };
  if (!name) return { error: 'Give the section a name, like 4-B.' };
  if (teacherId && !q.get(`SELECT 1 FROM users WHERE id = ? AND role = 'teacher' AND school_id = ?`, teacherId, user.schoolId!)) return { error: 'Choose a teacher from your school.' };
  if (q.get(`SELECT 1 FROM sections WHERE school_id = ? AND name = ?`, user.schoolId!, name)) return { error: `A section called ${name} already exists.` };
  q.run(`INSERT INTO sections (school_id, grade, name, teacher_id, created_at) VALUES (?, ?, ?, ?, ?)`, user.schoolId!, grade, name, teacherId, now());
  refresh();
  return { ok: `Section ${name} (Class ${grade}) created.` };
}

export async function setSectionTeacherAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireRole('school');
  const sec = q.get<{ id: number; name: string }>(`SELECT id, name FROM sections WHERE id = ? AND school_id = ?`, intParam(form.get('sectionId')), user.schoolId!);
  if (!sec) return { error: 'Choose a section.' };
  const teacherId = intParam(form.get('teacherId')) || null;
  if (teacherId && !q.get(`SELECT 1 FROM users WHERE id = ? AND role = 'teacher' AND school_id = ?`, teacherId, user.schoolId!)) return { error: 'Choose a teacher from your school.' };
  q.run(`UPDATE sections SET teacher_id = ? WHERE id = ?`, teacherId, sec.id);
  refresh();
  return { ok: `Updated the teacher for ${sec.name}.` };
}
