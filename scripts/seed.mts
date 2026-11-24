/**
 * npm run seed                 Demo data: a school, teachers, three sections, students, progress and results.
 * npm run seed -- --admin-only  Only the first VINC admin, from ADMIN_USERNAME / ADMIN_PASSWORD.
 * npm run seed -- --reset       Delete the database file first (demo only, never in production).
 */
import fs from 'node:fs';
import path from 'node:path';

const args = new Set(process.argv.slice(2));
const dbFile = path.resolve(process.env.DATABASE_PATH || './data/vinc.db');
if (args.has('--reset')) for (const f of [dbFile, dbFile + '-wal', dbFile + '-shm']) fs.rmSync(f, { force: true });

const { q, now, tx } = await import('../src/lib/db');
const { createUser } = await import('../src/lib/accounts');
const { ASSESSMENTS, grade } = await import('../src/data/assessments');
const { LEVELS } = await import('../src/lib/levels');

if (args.has('--admin-only')) {
  const username = process.env.ADMIN_USERNAME || 'admin', password = process.env.ADMIN_PASSWORD || '';
  if (password.length < 12) { console.error('Set ADMIN_PASSWORD (at least 12 characters) first.'); process.exit(1); }
  if (q.get('SELECT 1 FROM users WHERE username = ?', username)) { console.log(`${username} already exists. Nothing to do.`); process.exit(0); }
  createUser({ role: 'admin', name: 'VINC Admin', username, password });
  console.log(`Created VINC admin "${username}".`);
  process.exit(0);
}

if ((q.get<{ n: number }>('SELECT COUNT(*) AS n FROM users')!).n > 0) {
  console.error('The database already has users. Run `npm run seed -- --reset` to start the demo again.');
  process.exit(1);
}

// Small deterministic random generator so the demo looks the same every time.
let seed = 42;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

const DEMO = 'demo1234';
const daysAgo = (d: number) => new Date(Date.now() - d * 86400_000).toISOString();

tx(() => {
  createUser({ role: 'admin', name: 'VINC Admin', username: 'admin', password: 'vinc-demo-admin' });
  const schoolId = q.run(`INSERT INTO schools (name, code, city, created_at) VALUES (?, ?, ?, ?)`, 'Demo Public School', 'DPS', 'Bengaluru', now()).id;
  q.run(`INSERT INTO schools (name, code, city, created_at) VALUES (?, ?, ?, ?)`, 'Green Valley School', 'GVS', 'Mysuru', now());
  createUser({ role: 'school', name: 'Anita Rao', username: 'dps-admin', password: DEMO, schoolId });
  createUser({ role: 'school', name: 'Suresh Gowda', username: 'gvs-admin', password: DEMO, schoolId: 2, mustChange: true });
  const meera = createUser({ role: 'teacher', name: 'Meera Iyer', username: 'dps-meerai', password: DEMO, schoolId });
  const rohan = createUser({ role: 'teacher', name: 'Rohan Das', username: 'dps-rohand', password: DEMO, schoolId });
  const sec = (g: number, name: string, t: number) => q.run(`INSERT INTO sections (school_id, grade, name, teacher_id, created_at) VALUES (?, ?, ?, ?, ?)`, schoolId, g, name, t, now()).id;
  const sections = [
    { id: sec(3, '3-A', meera), grade: 3, names: ['Aarav Kumar', 'Diya Sharma', 'Kabir Singh', 'Ananya Reddy', 'Vihaan Patel', 'Ishita Nair', 'Arjun Menon', 'Saanvi Joshi'], assign: ['c3-a'], taken: [6] },
    { id: sec(4, '4-A', meera), grade: 4, names: ['Reyansh Gupta', 'Myra Kapoor', 'Advik Rao', 'Kiara Bose', 'Aditya Verma', 'Anika Pillai', 'Dhruv Saxena', 'Riya Chatterjee'], assign: ['c4-a', 'c4-b'], taken: [6, 0] },
    { id: sec(6, '6-B', rohan), grade: 6, names: ['Tara Krishnan', 'Neil Fernandes', 'Zara Khan', 'Om Prakash', 'Nisha Hegde', 'Yash Kulkarni'], assign: ['c6-a'], taken: [4] }
  ];
  for (const s of sections) {
    const ids = s.names.map(name => {
      const [f, l] = name.toLowerCase().split(' ');
      const id = createUser({ role: 'student', name, username: `dps-${f}${l[0]}`, password: DEMO, schoolId, sectionId: s.id });
      q.run(`UPDATE users SET last_login_at = ? WHERE id = ?`, daysAgo(Math.floor(rnd() * 6)), id);
      // Game progress: each student has cleared a different number of levels.
      const world = Math.min(4, s.grade) === 4 && s.grade === 4 ? 4 : 3;
      const levels = LEVELS.filter(l => l.world === world || (s.grade === 4 && l.world === 3));
      const done = Math.floor(rnd() * levels.length * 0.8) + 2;
      const best: Record<string, number> = {};
      levels.slice(0, done).forEach(l => { const st = 1 + Math.floor(rnd() * 3); best[l.id] = st; q.run(`INSERT INTO level_progress (student_id, level_id, stars, updated_at) VALUES (?, ?, ?, ?)`, id, l.id, st, daysAgo(rnd() * 10)); });
      q.run(`INSERT INTO game_state (student_id, state, updated_at) VALUES (?, ?, ?)`, id, JSON.stringify({ best, spent: 0, owned: ['amber', 'none'], paint: 'amber', hat: 'none', parts: [], sound: true, unlockAll: false, cur: 0, speed: 0 }), now());
      return id;
    });
    s.assign.forEach((aid, k) => {
      const gid = q.run(`INSERT INTO assignments (assessment_id, section_id, assigned_by, due_at, created_at) VALUES (?, ?, ?, ?, ?)`, aid, s.id, s.grade === 6 ? rohan : meera, daysAgo(-7).slice(0, 10), daysAgo(5)).id;
      const a = ASSESSMENTS.find(x => x.id === aid)!;
      ids.slice(0, s.taken[k]).forEach(sid => {
        const skill = 0.45 + rnd() * 0.5;
        const answers: Record<string, string> = {};
        for (const qn of a.questions) answers[qn.id] = String(rnd() < skill ? qn.answer : qn.kind === 'mcq' ? (qn.answer + 1) % qn.options!.length : qn.answer + 1);
        const r = grade(a, answers);
        q.run(`INSERT INTO attempts (assignment_id, student_id, answers, score, max_score, submitted_at) VALUES (?, ?, ?, ?, ?, ?)`, gid, sid, JSON.stringify(answers), r.score, r.max, daysAgo(rnd() * 4));
      });
    });
  }
});

console.log(`Demo data created in ${dbFile}

  Role          Username        Password
  VINC admin    admin           vinc-demo-admin
  School admin  dps-admin       ${DEMO}
  Teacher       dps-meerai      ${DEMO}   (sections 3-A and 4-A)
  Teacher       dps-rohand      ${DEMO}   (section 6-B)
  Student       dps-aaravk      ${DEMO}   (Class 3, section 3-A)
  Student       dps-reyanshg    ${DEMO}   (Class 4, section 4-A)
  Student       dps-tarak       ${DEMO}   (Class 6, section 6-B)

These are demo passwords. Never use demo data on a live site.`);
