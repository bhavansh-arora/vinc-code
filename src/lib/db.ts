import 'server-only';
import type { DatabaseSync as DB } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { hashPassword } from './passwords';
import { familyCode, joinCode } from './codes';

// node:sqlite is built into Node 22.13+. Loading it through getBuiltinModule keeps the bundler away from it.
const { DatabaseSync } = process.getBuiltinModule('node:sqlite') as typeof import('node:sqlite');

const SCHEMA = `
PRAGMA busy_timeout = 5000;
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS schools (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE COLLATE NOCASE,
  city TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin','school','teacher','student')),
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  section_id INTEGER REFERENCES sections(id) ON DELETE SET NULL,
  must_change_password INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  last_login_at TEXT
);
CREATE TABLE IF NOT EXISTS sections (
  id INTEGER PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  grade INTEGER NOT NULL CHECK (grade BETWEEN 3 AND 8),
  name TEXT NOT NULL,
  teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  UNIQUE (school_id, name)
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS login_failures (
  username TEXT NOT NULL COLLATE NOCASE,
  at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS game_state (
  student_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS level_progress (
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level_id TEXT NOT NULL,
  stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 3),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (student_id, level_id)
);
CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY,
  assessment_id TEXT NOT NULL,
  section_id INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  due_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (assessment_id, section_id)
);
CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answers TEXT NOT NULL,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  submitted_at TEXT NOT NULL,
  UNIQUE (assignment_id, student_id)
);
CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY,
  topic TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  school TEXT,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  email_status TEXT NOT NULL DEFAULT 'pending',
  email_error TEXT,
  handled_at TEXT
);
CREATE TABLE IF NOT EXISTS lesson_progress (
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  code TEXT,
  passed_at TEXT,
  runs INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (student_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_section ON users(section_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_failures_user ON login_failures(username, at);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON attempts(student_id);
`;

function open(): DB {
  const file = path.resolve(process.env.DATABASE_PATH || './data/vinc.db');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(SCHEMA);
  migrate(db);
  migrateV3(db);
  bootstrapAdmin(db);
  return db;
}

/**
 * Version 2: self sign-up. Adds the parent role, contact details, family codes for students,
 * joining codes for schools, parent-child links and School IDs issued by VINC.
 * Runs once on every database (new or existing) inside a transaction, keeping all data.
 */
function migrate(db: DB) {
  const version = (db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version;
  if (version >= 2) return;
  const cols = (t: string) => (db.prepare(`PRAGMA table_info(${t})`).all() as { name: string }[]).map(c => c.name);
  db.exec('PRAGMA foreign_keys = OFF');
  db.exec('BEGIN IMMEDIATE');
  try {
    if (!cols('users').includes('family_code')) {
      db.exec(`CREATE TABLE users_v2 (
        id INTEGER PRIMARY KEY,
        role TEXT NOT NULL CHECK (role IN ('admin','school','teacher','student','parent')),
        name TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        section_id INTEGER REFERENCES sections(id) ON DELETE SET NULL,
        must_change_password INTEGER NOT NULL DEFAULT 0,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        last_login_at TEXT,
        email TEXT,
        phone TEXT,
        relation TEXT,
        family_code TEXT
      )`);
      db.exec(`INSERT INTO users_v2 (id, role, name, username, password_hash, school_id, section_id, must_change_password, active, created_at, last_login_at)
               SELECT id, role, name, username, password_hash, school_id, section_id, must_change_password, active, created_at, last_login_at FROM users`);
      db.exec('DROP TABLE users');
      db.exec('ALTER TABLE users_v2 RENAME TO users');
      db.exec('CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id)');
      db.exec('CREATE INDEX IF NOT EXISTS idx_users_section ON users(section_id)');
    }
    for (const c of ['board', 'student_code', 'teacher_code']) if (!cols('schools').includes(c)) db.exec(`ALTER TABLE schools ADD COLUMN ${c} TEXT`);
    db.exec(`CREATE TABLE IF NOT EXISTS parent_links (
      parent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      PRIMARY KEY (parent_id, student_id)
    )`);
    db.exec(`CREATE TABLE IF NOT EXISTS school_invites (
      code TEXT PRIMARY KEY,
      note TEXT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
      used_at TEXT
    )`);
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_family ON users(family_code)');
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_scode ON schools(student_code)');
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_tcode ON schools(teacher_code)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_links_student ON parent_links(student_id)');
    for (const sc of db.prepare('SELECT id, code FROM schools WHERE student_code IS NULL OR teacher_code IS NULL').all() as { id: number; code: string }[]) {
      db.prepare('UPDATE schools SET student_code = ?, teacher_code = ? WHERE id = ?').run(joinCode(sc.code), joinCode(sc.code), sc.id);
    }
    for (const st of db.prepare(`SELECT id FROM users WHERE role = 'student' AND family_code IS NULL`).all() as { id: number }[]) {
      db.prepare('UPDATE users SET family_code = ? WHERE id = ?').run(familyCode(), st.id);
    }
    const broken = db.prepare('PRAGMA foreign_key_check').all();
    if (broken.length) throw new Error('Migration found broken references: ' + JSON.stringify(broken.slice(0, 3)));
    db.exec('PRAGMA user_version = 2');
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  } finally {
    db.exec('PRAGMA foreign_keys = ON');
  }
}

/** Version 3: School IDs can be emailed to the school (onboarding email), with the send status kept. */
function migrateV3(db: DB) {
  const version = (db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version;
  if (version >= 3) return;
  const cols = (db.prepare('PRAGMA table_info(school_invites)').all() as { name: string }[]).map(c => c.name);
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const c of ['email', 'email_status', 'email_sent_at', 'email_error']) if (!cols.includes(c)) db.exec(`ALTER TABLE school_invites ADD COLUMN ${c} TEXT`);
    db.exec('PRAGMA user_version = 3');
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

/** On a fresh server, create the first VINC admin from ADMIN_USERNAME / ADMIN_PASSWORD. Does nothing once an admin exists. */
function bootstrapAdmin(db: DB) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || db.prepare(`SELECT 1 FROM users WHERE role = 'admin' LIMIT 1`).get()) return;
  if (password.length < 12) { console.warn('ADMIN_PASSWORD must be at least 12 characters. No admin was created.'); return; }
  const username = process.env.ADMIN_USERNAME || 'admin';
  db.prepare(`INSERT INTO users (role, name, username, password_hash, created_at) VALUES ('admin', 'VINC Admin', ?, ?, ?)`)
    .run(username, hashPassword(password), new Date().toISOString());
  console.log(`Created the first VINC admin "${username}". You can now remove ADMIN_PASSWORD from the .env file.`);
}

// Opened on first use, never at import time: `next build` loads modules in several processes
// at once, and none of them should touch (or create) the database.
const g = globalThis as unknown as { __vincDb?: DB };
function getDb(): DB {
  return g.__vincDb ?? (g.__vincDb = open());
}

export function now(): string {
  return new Date().toISOString();
}

/** Run fn inside a transaction. */
export function tx<T>(fn: () => T): T {
  const db = getDb();
  db.exec('BEGIN IMMEDIATE');
  try {
    const out = fn();
    db.exec('COMMIT');
    return out;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

type Row = Record<string, unknown>;
type Param = string | number | bigint | null;
export const q = {
  get<T = Row>(sql: string, ...params: Param[]): T | undefined {
    return getDb().prepare(sql).get(...params) as T | undefined;
  },
  all<T = Row>(sql: string, ...params: Param[]): T[] {
    return getDb().prepare(sql).all(...params) as T[];
  },
  run(sql: string, ...params: Param[]): { id: number; changes: number } {
    const r = getDb().prepare(sql).run(...params);
    return { id: Number(r.lastInsertRowid), changes: Number(r.changes) };
  }
};
