'use server';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { q, now, tx } from '@/lib/db';
import { tempPassword } from '@/lib/passwords';
import { cleanName, createUser, intParam, newJoinCodes, setPassword, uniqueUsername, type ActionState } from '@/lib/accounts';

export async function createSchoolAction(_p: ActionState, form: FormData): Promise<ActionState> {
  await requireRole('admin');
  const name = cleanName(String(form.get('name') ?? ''));
  const code = String(form.get('code') ?? '').trim().toUpperCase();
  const city = cleanName(String(form.get('city') ?? '')) || null;
  const adminName = cleanName(String(form.get('adminName') ?? ''));
  if (name.length < 3) return { error: 'Type the school name.' };
  if (!/^[A-Z0-9]{2,8}$/.test(code)) return { error: 'The school code should be 2 to 8 letters or digits, like DPS or KV2.' };
  if (adminName.length < 2) return { error: "Type the school admin's name." };
  if (q.get(`SELECT 1 FROM schools WHERE code = ?`, code)) return { error: `The code ${code} is already used by another school.` };
  const username = uniqueUsername(`${code.toLowerCase()}-admin`), password = tempPassword();
  tx(() => {
    const jc = newJoinCodes(code);
    const id = q.run(`INSERT INTO schools (name, code, city, student_code, teacher_code, created_at) VALUES (?, ?, ?, ?, ?, ?)`, name, code, city, jc.student, jc.teacher, now()).id;
    createUser({ role: 'school', name: adminName, username, password, schoolId: id, mustChange: true });
  });
  revalidatePath('/admin', 'layout');
  return { ok: `${name} is set up. Send these details to ${adminName}.`, creds: [{ name: adminName, username, password }] };
}

export async function resetSchoolAdminAction(_p: ActionState, form: FormData): Promise<ActionState> {
  await requireRole('admin');
  const u = q.get<{ id: number; name: string; username: string }>(`SELECT id, name, username FROM users WHERE id = ? AND role = 'school'`, intParam(form.get('userId')));
  if (!u) return { error: 'Choose a school admin.' };
  const password = tempPassword();
  setPassword(u.id, password, true);
  return { ok: `Temporary password set for ${u.name}.`, creds: [{ name: u.name, username: u.username, password }] };
}

export async function toggleSchoolAction(_p: ActionState, form: FormData): Promise<ActionState> {
  await requireRole('admin');
  const s = q.get<{ id: number; name: string; active: number }>(`SELECT id, name, active FROM schools WHERE id = ?`, intParam(form.get('schoolId')));
  if (!s) return { error: 'School not found.' };
  q.run(`UPDATE schools SET active = ? WHERE id = ?`, s.active ? 0 : 1, s.id);
  if (s.active) q.run(`DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE school_id = ?)`, s.id);
  revalidatePath('/admin', 'layout');
  return { ok: s.active ? `${s.name} is switched off. Its users cannot sign in.` : `${s.name} is switched on again.` };
}

export async function issueSchoolIdAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireRole('admin');
  const note = cleanName(String(form.get('note') ?? '')).slice(0, 60) || null;
  const email = String(form.get('email') ?? '').trim().toLowerCase().slice(0, 80) || null;
  const { emailOk } = await import('@/lib/signup');
  if (!note) return { error: 'Enter the name of the school this ID is for.' };
  if (!email) return { error: "Enter the school's email so we can send the onboarding email." };
  if (!emailOk(email)) return { error: 'That email address does not look right.' };
  const { schoolId } = await import('@/lib/codes');
  let code = schoolId();
  while (q.get('SELECT 1 FROM school_invites WHERE code = ?', code)) code = schoolId();
  q.run('INSERT INTO school_invites (code, note, email, created_by, created_at) VALUES (?, ?, ?, ?, ?)', code, note, email, admin.id, now());
  revalidatePath('/admin');
  const { sendOnboarding } = await import('@/lib/onboarding');
  const r = await sendOnboarding(code);
  return r.ok ? { ok: `School ID ${code} is ready. ${r.message}` } : { error: `School ID ${code} was created, but: ${r.message}` };
}

export async function resendOnboardingAction(_p: ActionState, form: FormData): Promise<ActionState> {
  await requireRole('admin');
  const code = String(form.get('code') ?? '');
  const newEmail = String(form.get('email') ?? '').trim().toLowerCase().slice(0, 80);
  if (newEmail) {
    const { emailOk } = await import('@/lib/signup');
    if (!emailOk(newEmail)) return { error: 'That email address does not look right.' };
    q.run('UPDATE school_invites SET email = ? WHERE code = ? AND school_id IS NULL', newEmail, code);
  }
  const { sendOnboarding } = await import('@/lib/onboarding');
  const r = await sendOnboarding(code);
  revalidatePath('/admin');
  return r.ok ? { ok: r.message } : { error: r.message };
}

export async function markHandledAction(_p: ActionState, form: FormData): Promise<ActionState> {
  await requireRole('admin');
  const id = intParam(form.get('id'));
  if (!q.run('UPDATE contact_messages SET handled_at = ? WHERE id = ? AND handled_at IS NULL', now(), id).changes) return { error: 'Message not found.' };
  revalidatePath('/admin/messages');
  return { ok: 'Marked as handled.' };
}
