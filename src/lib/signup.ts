import 'server-only';
import { q } from './db';
import { normCode } from './codes';

export const USERNAME_RE = /^[a-z][a-z0-9._-]{2,29}$/;
export const BOARDS = ['CBSE', 'ICSE', 'State board', 'IB', 'Cambridge', 'Other'];
export const RELATIONS = ['Mother', 'Father', 'Guardian'];

export function normUsername(s: unknown): string {
  return String(s ?? '').trim().toLowerCase().replace(/\s+/g, '.').slice(0, 30);
}

export function usernameStatus(u: string): { valid: boolean; available: boolean } {
  const valid = USERNAME_RE.test(u);
  return { valid, available: valid && !q.get('SELECT 1 FROM users WHERE username = ?', u) };
}

const COMMON = new Set(['password', 'password1', '12345678', '123456789', 'qwertyuiop', 'iloveyou', 'abcdefgh', '11111111', 'password123', 'vinccode']);
export function passwordProblem(pw: string, username: string): string | null {
  if (pw.length < 8) return 'Use at least 8 characters.';
  if (pw.length > 200) return 'That password is too long.';
  if (COMMON.has(pw.toLowerCase()) || /^(.)\1+$/.test(pw)) return 'That password is too easy to guess.';
  if (pw.toLowerCase() === username) return 'Your password cannot be the same as your User ID.';
  return null;
}

export const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 80;
export const phoneDigits = (p: string) => p.replace(/\D/g, '');

export interface JoinInfo {
  kind: 'student' | 'teacher';
  school: { id: number; name: string; city: string | null; code: string };
  sections: { id: number; grade: number; name: string; hasTeacher: boolean }[];
}

/** A school's student or teacher joining code. */
export function lookupJoin(raw: unknown): JoinInfo | null {
  const code = normCode(raw);
  if (code.length < 4) return null;
  const s = q.get<{ id: number; name: string; city: string | null; code: string; student_code: string; teacher_code: string }>(
    `SELECT id, name, city, code, student_code, teacher_code FROM schools WHERE active = 1 AND (student_code = ? OR teacher_code = ?)`, code, code);
  if (!s) return null;
  const sections = q.all<{ id: number; grade: number; name: string; teacher_id: number | null }>(
    `SELECT id, grade, name, teacher_id FROM sections WHERE school_id = ? ORDER BY grade, name`, s.id);
  return {
    kind: s.student_code === code ? 'student' : 'teacher',
    school: { id: s.id, name: s.name, city: s.city, code: s.code },
    sections: sections.map(x => ({ id: x.id, grade: x.grade, name: x.name, hasTeacher: x.teacher_id !== null }))
  };
}

/** A student's family code, for a parent signing up. Shows only what a parent needs to confirm it is their child. */
export function lookupFamily(raw: unknown) {
  const code = normCode(raw, 6);
  if (code.length !== 6) return null;
  const r = q.get<{ id: number; name: string; grade: number | null; section: string | null; school: string | null }>(`
    SELECT u.id, u.name, x.grade, x.name AS section, s.name AS school
    FROM users u LEFT JOIN sections x ON x.id = u.section_id LEFT JOIN schools s ON s.id = u.school_id
    WHERE u.family_code = ? AND u.role = 'student' AND u.active = 1`, code);
  if (!r) return null;
  const parts = r.name.split(' ');
  return { id: r.id, name: parts[0] + (parts.length > 1 ? ' ' + parts[parts.length - 1][0] + '.' : ''), grade: r.grade, section: r.section, school: r.school };
}

/** A School ID issued by VINC that has not been used yet. */
export function lookupInvite(raw: unknown) {
  const code = normCode(raw, 9);
  if (!/^VL-[A-Z0-9]{6}$/.test(code)) return null;
  return q.get<{ code: string; note: string | null }>(`SELECT code, note FROM school_invites WHERE code = ? AND school_id IS NULL`, code) ?? null;
}

/** A short unique school code from its name, used to start usernames (e.g. "Sunflower Public School" → "SPS"). */
export function schoolShortCode(name: string): string {
  const words = name.toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').split(' ').filter(w => w && !['THE', 'OF', 'AND'].includes(w));
  let base = words.map(w => w[0]).join('').slice(0, 5);
  if (base.length < 2) base = (words[0] ?? 'SCH').slice(0, 4);
  let code = base, n = 2;
  while (q.get('SELECT 1 FROM schools WHERE code = ?', code)) code = `${base}${n++}`;
  return code;
}
