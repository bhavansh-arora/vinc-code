'use server';
import { redirect } from 'next/navigation';
import { signIn, signOut } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/types';

export type LoginState = { error?: string; username?: string };

export async function loginAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const username = String(form.get('username') ?? '').slice(0, 64);
  const password = String(form.get('password') ?? '').slice(0, 200);
  const res = await signIn(username, password);
  if (!res.ok) return { error: res.error, username };
  redirect(res.user.mustChangePassword ? '/account?first=1' : ROLE_HOME[res.user.role]);
}

export async function logoutAction() {
  await signOut();
  redirect('/login');
}
