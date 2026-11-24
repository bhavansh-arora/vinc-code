import 'server-only';
import type { DatabaseSync as DB } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

// node:sqlite is built into Node 22.13+. Loading it through getBuiltinModule keeps the bundler away from it.
const { DatabaseSync } = process.getBuiltinModule('node:sqlite') as typeof import('node:sqlite');

const SCHEMA = `
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
  return db;
}

const g = globalThis as unknown as { __vincDb?: DB };
export const db: DB = g.__vincDb ?? (g.__vincDb = open());

export function now(): string {
  return new Date().toISOString();
}

/** Run fn inside a transaction. */
export function tx<T>(fn: () => T): T {
  db.exec('BEGIN');
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
    return db.prepare(sql).get(...params) as T | undefined;
  },
  all<T = Row>(sql: string, ...params: Param[]): T[] {
    return db.prepare(sql).all(...params) as T[];
  },
  run(sql: string, ...params: Param[]): { id: number; changes: number } {
    const r = db.prepare(sql).run(...params);
    return { id: Number(r.lastInsertRowid), changes: Number(r.changes) };
  }
};
