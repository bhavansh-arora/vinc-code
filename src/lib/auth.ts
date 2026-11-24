import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createHash, randomBytes } from 'node:crypto';
import { q, now } from './db';
import { verifyPassword } from './passwords';
import { ROLE_HOME, type Role, type User } from './types';

const COOKIE = 'vinc_session';
const STAFF_DAYS = 7;
const STUDENT_HOURS = 12; // shared school computers: students are signed out the same day
const MAX_FAILURES = 5;
const LOCK_MINUTES = 10;

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

interface UserRow {
  id: number; role: Role; name: string; username: string; password_hash: string;
  school_id: number | null; section_id: number | null; must_change_password: number; active: number;
  school_active: number | null;
}

function toUser(r: UserRow): User {
  return { id: r.id, role: r.role, name: r.name, username: r.username, schoolId: r.school_id, sectionId: r.section_id, mustChangePassword: !!r.must_change_password };
}

const USER_SELECT = `SELECT u.*, s.active AS school_active FROM users u LEFT JOIN schools s ON s.id = u.school_id`;

export type LoginResult = { ok: true; user: User } | { ok: false; error: string };

export async function signIn(usernameRaw: string, password: string): Promise<LoginResult> {
  const username = usernameRaw.trim();
  if (!username || !password) return { ok: false, error: 'Enter your username and password.' };
  const since = new Date(Date.now() - LOCK_MINUTES * 60_000).toISOString();
  const fails = q.get<{ n: number }>(`SELECT COUNT(*) AS n FROM login_failures WHERE username = ? AND at > ?`, username, since)!.n;
  if (fails >= MAX_FAILURES) return { ok: false, error: `Too many wrong tries. Wait ${LOCK_MINUTES} minutes, or ask your teacher to reset your password.` };

  const row = q.get<UserRow>(`${USER_SELECT} WHERE u.username = ?`, username);
  const good = row && verifyPassword(password, row.password_hash);
  if (!row || !good) {
    q.run(`INSERT INTO login_failures (username, at) VALUES (?, ?)`, username, now());
    return { ok: false, error: 'That username or password is not right. Check your login card and try again.' };
  }
  if (!row.active || row.school_active === 0) return { ok: false, error: 'This account is switched off. Please contact your school.' };

  q.run(`DELETE FROM login_failures WHERE username = ?`, username);
  const token = randomBytes(32).toString('base64url');
  const ms = row.role === 'student' ? STUDENT_HOURS * 3600_000 : STAFF_DAYS * 86400_000;
  const expires = new Date(Date.now() + ms);
  q.run(`INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)`, sha256(token), row.id, expires.toISOString(), now());
  q.run(`UPDATE users SET last_login_at = ? WHERE id = ?`, now(), row.id);
  q.run(`DELETE FROM sessions WHERE expires_at < ?`, now());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', expires
  });
  return { ok: true, user: toUser(row) };
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) q.run(`DELETE FROM sessions WHERE token_hash = ?`, sha256(token));
  jar.delete(COOKIE);
}

/** The signed-in user for this request, or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const row = q.get<UserRow>(
    `${USER_SELECT} JOIN sessions se ON se.user_id = u.id WHERE se.token_hash = ? AND se.expires_at > ? AND u.active = 1 AND (s.active IS NULL OR s.active = 1)`,
    sha256(token), now()
  );
  return row ? toUser(row) : null;
});

/** Use at the top of every protected page, layout and server action. */
export async function requireRole(...roles: Role[]): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.mustChangePassword) redirect('/account?first=1');
  if (!roles.includes(user.role)) redirect(ROLE_HOME[user.role]);
  return user;
}

export function revokeSessions(userId: number) {
  q.run(`DELETE FROM sessions WHERE user_id = ?`, userId);
}
