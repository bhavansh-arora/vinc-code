import 'server-only';
import { q, now } from './db';
import { hashPassword } from './passwords';
import { familyCode, joinCode } from './codes';
import type { Role } from './types';

export interface Cred { name: string; username: string; password: string }
export type ActionState = { error?: string; ok?: string; creds?: Cred[] };

/** Letters only, lower case, accents removed. Falls back to "user" for names in other scripts. */
export function slug(s: string, max = 12): string {
  const out = s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
  return out.slice(0, max);
}

export function cleanName(s: string): string {
  return s.replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
}

export function uniqueUsername(base: string): string {
  const b = base.replace(/[^a-z0-9.-]/g, '').slice(0, 30) || 'user';
  let name = b, n = 2;
  while (q.get(`SELECT 1 FROM users WHERE username = ?`, name)) name = `${b}${n++}`;
  return name;
}

/** e.g. "dps-aaravk" for Aarav Kumar at school code DPS. */
export function usernameFor(schoolCode: string, fullName: string, fallback = 'student'): string {
  const parts = fullName.split(' ').filter(Boolean);
  const first = slug(parts[0] ?? '') || fallback;
  const lastInitial = parts.length > 1 ? slug(parts[parts.length - 1]).slice(0, 1) : '';
  return uniqueUsername(`${schoolCode.toLowerCase()}-${first}${lastInitial}`);
}

export function createUser(u: { role: Role; name: string; username: string; password: string; schoolId?: number | null; sectionId?: number | null; mustChange?: boolean }): number {
  return q.run(
    `INSERT INTO users (role, name, username, password_hash, school_id, section_id, must_change_password, family_code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    u.role, u.name, u.username, hashPassword(u.password), u.schoolId ?? null, u.sectionId ?? null, u.mustChange ? 1 : 0,
    u.role === 'student' ? uniqueFamilyCode() : null, now()
  ).id;
}

/** Every student has a family code that parents use to link to them. */
export function uniqueFamilyCode(): string {
  let c = familyCode();
  while (q.get('SELECT 1 FROM users WHERE family_code = ?', c)) c = familyCode();
  return c;
}

/** New student and teacher joining codes for a school, e.g. DPS-7KQ2. */
export function newJoinCodes(schoolCode: string): { student: string; teacher: string } {
  const make = () => { let c = joinCode(schoolCode); while (q.get('SELECT 1 FROM schools WHERE student_code = ? OR teacher_code = ?', c, c)) c = joinCode(schoolCode); return c; };
  const student = make();
  let teacher = make();
  while (teacher === student) teacher = make();
  return { student, teacher };
}

export function setPassword(userId: number, password: string, mustChange: boolean) {
  q.run(`UPDATE users SET password_hash = ?, must_change_password = ? WHERE id = ?`, hashPassword(password), mustChange ? 1 : 0, userId);
  q.run(`DELETE FROM sessions WHERE user_id = ?`, userId);
  q.run(`DELETE FROM login_failures WHERE username = (SELECT username FROM users WHERE id = ?)`, userId);
}

export function intParam(v: FormDataEntryValue | null): number {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : 0;
}
