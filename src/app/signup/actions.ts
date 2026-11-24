'use server';
import { startSession } from '@/lib/auth';
import { q, now, tx } from '@/lib/db';
import { cleanName, createUser, newJoinCodes } from '@/lib/accounts';
import { allow, clientIp } from '@/lib/ratelimit';
import { BOARDS, RELATIONS, emailOk, lookupFamily, lookupInvite, lookupJoin, normUsername, passwordProblem, phoneDigits, schoolShortCode, usernameStatus } from '@/lib/signup';
import { ROLE_HOME, type Role } from '@/lib/types';

export interface SignupDone {
  role: Role; name: string; username: string; home: string;
  familyCode?: string; studentCode?: string; teacherCode?: string; schoolName?: string; child?: string; sections?: number;
}
export type SignupState = { error?: string; field?: string; done?: SignupDone };

const fail = (field: string, error: string): SignupState => ({ field, error });
const str = (f: FormData, k: string, max = 120) => String(f.get(k) ?? '').trim().slice(0, max);

export async function signupAction(_prev: SignupState, f: FormData): Promise<SignupState> {
  if (!allow('signup:' + await clientIp(), 20, 3600_000)) return { error: 'Too many new accounts from this network. Please try again in an hour.' };
  const role = str(f, 'role', 10) as Role;
  if (!['student', 'teacher', 'parent', 'school'].includes(role)) return { error: 'Choose who you are signing up as.' };

  const name = cleanName(str(f, 'name'));
  if (name.length < 2) return fail('name', 'Type your full name.');
  const username = normUsername(f.get('username'));
  const u = usernameStatus(username);
  if (!u.valid) return fail('username', 'Start with a letter and use 3 to 30 letters, numbers, dots, dashes or underscores.');
  if (!u.available) return fail('username', `${username} is taken. Try adding a number.`);
  const password = String(f.get('password') ?? '');
  const pwBad = passwordProblem(password, username);
  if (pwBad) return fail('password', pwBad);
  const email = str(f, 'email', 80).toLowerCase();
  const phone = phoneDigits(str(f, 'phone', 20));
  if (email && !emailOk(email)) return fail('email', 'That email does not look right.');
  if (phone && (phone.length < 10 || phone.length > 13)) return fail('phone', 'Enter a 10-digit mobile number.');

  /* ---------- Student: joins a school with the student joining code ---------- */
  if (role === 'student') {
    if (!allow('code:' + await clientIp(), 40, 600_000)) return fail('code', 'Too many tries. Wait 10 minutes.');
    const join = lookupJoin(f.get('code'));
    if (!join || join.kind !== 'student') return fail('code', 'This is not a student joining code. Check it with your teacher.');
    const sectionId = Number(f.get('sectionId'));
    if (!join.sections.some(s => s.id === sectionId)) return fail('sectionId', 'Choose your class and section.');
    const id = createUser({ role: 'student', name, username, password, schoolId: join.school.id, sectionId });
    const fam = q.get<{ family_code: string }>('SELECT family_code FROM users WHERE id = ?', id)!.family_code;
    await startSession(id, 'student');
    return { done: { role, name, username, home: ROLE_HOME.student, familyCode: fam, schoolName: join.school.name } };
  }

  /* ---------- Teacher: joins with the teacher joining code ---------- */
  if (role === 'teacher') {
    if (!email) return fail('email', 'Teachers need an email address.');
    if (!allow('code:' + await clientIp(), 40, 600_000)) return fail('code', 'Too many tries. Wait 10 minutes.');
    const join = lookupJoin(f.get('code'));
    if (!join || join.kind !== 'teacher') return fail('code', 'This is not a teacher joining code. Ask your school coordinator.');
    const free = new Set(join.sections.filter(s => !s.hasTeacher).map(s => s.id));
    const picked = f.getAll('sectionIds').map(Number).filter(id => free.has(id));
    let assigned = 0;
    const id = tx(() => {
      const uid = createUser({ role: 'teacher', name, username, password, schoolId: join.school.id });
      q.run('UPDATE users SET email = ?, phone = ? WHERE id = ?', email, phone || null, uid);
      for (const sid of picked) assigned += q.run('UPDATE sections SET teacher_id = ? WHERE id = ? AND teacher_id IS NULL', uid, sid).changes;
      return uid;
    });
    await startSession(id, 'teacher');
    return { done: { role, name, username, home: ROLE_HOME.teacher, schoolName: join.school.name, sections: assigned } };
  }

  /* ---------- Parent: links to a child with the child's family code ---------- */
  if (role === 'parent') {
    const relation = str(f, 'relation', 20);
    if (!RELATIONS.includes(relation)) return fail('relation', 'Choose how you are related.');
    if (!phone) return fail('phone', 'Parents need a mobile number.');
    if (!allow('code:' + await clientIp(), 40, 600_000)) return fail('code', 'Too many tries. Wait 10 minutes.');
    const kid = lookupFamily(f.get('code'));
    if (!kid) return fail('code', 'No student has this family code. Your child finds it on their dashboard.');
    const id = tx(() => {
      const uid = createUser({ role: 'parent', name, username, password });
      q.run('UPDATE users SET email = ?, phone = ?, relation = ? WHERE id = ?', email || null, phone, relation, uid);
      q.run('INSERT INTO parent_links (parent_id, student_id, created_at) VALUES (?, ?, ?)', uid, kid.id, now());
      return uid;
    });
    await startSession(id, 'parent');
    return { done: { role, name, username, home: ROLE_HOME.parent, child: `${kid.name}, Class ${kid.grade ?? '?'}${kid.section ? ' · ' + kid.section : ''}${kid.school ? ' at ' + kid.school : ''}` } };
  }

  /* ---------- School: registers with a School ID issued by VINC ---------- */
  if (!email) return fail('email', 'The coordinator needs an email address.');
  if (!allow('code:' + await clientIp(), 40, 600_000)) return fail('schoolId', 'Too many tries. Wait 10 minutes.');
  const invite = lookupInvite(f.get('schoolId'));
  if (!invite) return fail('schoolId', 'This School ID is not valid or has already been used. Write to VINC Lab for one.');
  const schoolName = cleanName(str(f, 'schoolName'));
  if (schoolName.length < 3) return fail('schoolName', "Type your school's name.");
  const city = cleanName(str(f, 'city', 40)) || null;
  const board = str(f, 'board', 20);
  if (!BOARDS.includes(board)) return fail('board', 'Choose your board.');
  const short = schoolShortCode(schoolName);
  const { student: studentCode, teacher: teacherCode } = newJoinCodes(short);
  const claimed = tx(() => {
    // Claim the School ID first so two people cannot use it at once.
    if (q.run('UPDATE school_invites SET used_at = ? WHERE code = ? AND school_id IS NULL AND used_at IS NULL', now(), invite.code).changes !== 1) return null;
    const sid = q.run('INSERT INTO schools (name, code, city, board, student_code, teacher_code, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', schoolName, short, city, board, studentCode, teacherCode, now()).id;
    q.run('UPDATE school_invites SET school_id = ? WHERE code = ?', sid, invite.code);
    const uid = createUser({ role: 'school', name, username, password, schoolId: sid });
    q.run('UPDATE users SET email = ?, phone = ? WHERE id = ?', email, phone || null, uid);
    return uid;
  });
  if (!claimed) return fail('schoolId', 'This School ID has just been used. Write to VINC Lab for a new one.');
  await startSession(claimed, 'school');
  return { done: { role, name, username, home: ROLE_HOME.school, schoolName, studentCode, teacherCode } };
}
