'use server';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { q } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/passwords';
import { ROLE_HOME } from '@/lib/types';

export type PwState = { error?: string; ok?: boolean };

export async function changePasswordAction(_prev: PwState, form: FormData): Promise<PwState> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const current = String(form.get('current') ?? '');
  const next = String(form.get('next') ?? '');
  const confirm = String(form.get('confirm') ?? '');
  const min = user.role === 'student' ? 6 : 10;
  const row = q.get<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = ?', user.id)!;
  if (!verifyPassword(current, row.password_hash)) return { error: 'Your current password is not right.' };
  if (next.length < min) return { error: `Your new password needs at least ${min} characters.` };
  if (next.length > 200) return { error: 'That password is too long.' };
  if (next !== confirm) return { error: 'The two new passwords do not match.' };
  if (next === current) return { error: 'Choose a password different from the old one.' };
  q.run('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?', hashPassword(next), user.id);
  redirect(ROLE_HOME[user.role] + '?pw=1');
}
