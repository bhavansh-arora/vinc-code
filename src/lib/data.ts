import 'server-only';
import { q } from './db';
import { levelsForGrade } from './levels';
import { ASSESSMENTS, assessmentById } from '@/data/assessments';
import type { User } from './types';

export interface School { id: number; name: string; code: string; city: string | null; active: number; created_at: string }
export interface Section { id: number; school_id: number; grade: number; name: string; teacher_id: number | null; teacher_name: string | null; school_name: string; students: number; avg_score: number | null }
export interface StudentRow { id: number; name: string; username: string; last_login_at: string | null; active: number; levelsDone: number; levelsTotal: number; stars: number; avgScore: number | null; attempts: number }
export interface AssignmentRow { id: number; assessment_id: string; section_id: number; due_at: string | null; created_at: string; title: string; questions: number; submitted: number; avg_score: number | null }

const AVG_PCT = 'AVG(a.score * 100.0 / a.max_score)';

/* ---------- access rules ---------- */
export function canSeeSection(user: User, s: { school_id: number; teacher_id: number | null }): boolean {
  if (user.role === 'admin') return true;
  if (user.role === 'school') return s.school_id === user.schoolId;
  if (user.role === 'teacher') return s.teacher_id === user.id;
  return false;
}
export function canManageSection(user: User, s: { school_id: number; teacher_id: number | null }): boolean {
  return (user.role === 'school' && s.school_id === user.schoolId) || (user.role === 'teacher' && s.teacher_id === user.id);
}

/* ---------- admin ---------- */
export function platformStats() {
  const c = (sql: string) => q.get<{ n: number }>(sql)!.n;
  return {
    schools: c(`SELECT COUNT(*) AS n FROM schools WHERE active = 1`),
    teachers: c(`SELECT COUNT(*) AS n FROM users WHERE role = 'teacher' AND active = 1`),
    students: c(`SELECT COUNT(*) AS n FROM users WHERE role = 'student' AND active = 1`),
    attempts: c(`SELECT COUNT(*) AS n FROM attempts`),
    avgScore: q.get<{ v: number | null }>(`SELECT ${AVG_PCT} AS v FROM attempts a`)!.v
  };
}

export function schoolsWithCounts() {
  return q.all<School & { teachers: number; students: number; sections: number; avg_score: number | null; admin_username: string | null }>(`
    SELECT s.*,
      (SELECT COUNT(*) FROM users u WHERE u.school_id = s.id AND u.role = 'teacher' AND u.active = 1) AS teachers,
      (SELECT COUNT(*) FROM users u WHERE u.school_id = s.id AND u.role = 'student' AND u.active = 1) AS students,
      (SELECT COUNT(*) FROM sections x WHERE x.school_id = s.id) AS sections,
      (SELECT ${AVG_PCT} FROM attempts a JOIN users u ON u.id = a.student_id WHERE u.school_id = s.id) AS avg_score,
      (SELECT username FROM users u WHERE u.school_id = s.id AND u.role = 'school' ORDER BY u.id LIMIT 1) AS admin_username
    FROM schools s ORDER BY s.name`);
}

export function getSchool(id: number) {
  return q.get<School>(`SELECT * FROM schools WHERE id = ?`, id);
}

export function schoolAdmins(schoolId: number) {
  return q.all<{ id: number; name: string; username: string; last_login_at: string | null; must_change_password: number }>(
    `SELECT id, name, username, last_login_at, must_change_password FROM users WHERE school_id = ? AND role = 'school' ORDER BY name`, schoolId);
}

/* ---------- school ---------- */
export function schoolStats(schoolId: number) {
  const c = (sql: string) => q.get<{ n: number }>(sql, schoolId)!.n;
  return {
    teachers: c(`SELECT COUNT(*) AS n FROM users WHERE school_id = ? AND role = 'teacher' AND active = 1`),
    students: c(`SELECT COUNT(*) AS n FROM users WHERE school_id = ? AND role = 'student' AND active = 1`),
    sections: c(`SELECT COUNT(*) AS n FROM sections WHERE school_id = ?`),
    avgScore: q.get<{ v: number | null }>(`SELECT ${AVG_PCT} AS v FROM attempts a JOIN users u ON u.id = a.student_id WHERE u.school_id = ?`, schoolId)!.v
  };
}

export function teachersOfSchool(schoolId: number) {
  return q.all<{ id: number; name: string; username: string; last_login_at: string | null; must_change_password: number; sections: string | null }>(`
    SELECT u.id, u.name, u.username, u.last_login_at, u.must_change_password,
      (SELECT GROUP_CONCAT(name, ', ') FROM (SELECT name FROM sections x WHERE x.teacher_id = u.id ORDER BY grade, name)) AS sections
    FROM users u WHERE u.school_id = ? AND u.role = 'teacher' AND u.active = 1 ORDER BY u.name`, schoolId);
}

const SECTION_SELECT = `
  SELECT x.*, t.name AS teacher_name, s.name AS school_name,
    (SELECT COUNT(*) FROM users u WHERE u.section_id = x.id AND u.role = 'student' AND u.active = 1) AS students,
    (SELECT ${AVG_PCT} FROM attempts a JOIN assignments g ON g.id = a.assignment_id WHERE g.section_id = x.id) AS avg_score
  FROM sections x JOIN schools s ON s.id = x.school_id LEFT JOIN users t ON t.id = x.teacher_id`;

export function sectionsOfSchool(schoolId: number): Section[] {
  return q.all<Section>(`${SECTION_SELECT} WHERE x.school_id = ? ORDER BY x.grade, x.name`, schoolId);
}
export function sectionsOfTeacher(teacherId: number): Section[] {
  return q.all<Section>(`${SECTION_SELECT} WHERE x.teacher_id = ? ORDER BY x.grade, x.name`, teacherId);
}
export function getSection(id: number): Section | undefined {
  return q.get<Section>(`${SECTION_SELECT} WHERE x.id = ?`, id);
}

/** Per-class summary for a school: sections, students, level completion and assessment average. */
export function gradeSummary(schoolId: number) {
  const rows: { grade: number; sections: number; students: number; levelPct: number | null; avgScore: number | null }[] = [];
  for (let g = 3; g <= 8; g++) {
    const secs = q.all<{ id: number }>(`SELECT id FROM sections WHERE school_id = ? AND grade = ?`, schoolId, g);
    if (!secs.length) continue;
    const students = secs.flatMap(s => studentsOfSection(s.id));
    const levelPct = students.length ? students.reduce((t, s) => t + s.levelsDone / s.levelsTotal, 0) / students.length * 100 : null;
    const scored = students.filter(s => s.avgScore !== null);
    rows.push({ grade: g, sections: secs.length, students: students.length, levelPct, avgScore: scored.length ? scored.reduce((t, s) => t + s.avgScore!, 0) / scored.length : null });
  }
  return rows;
}

/* ---------- section / teacher ---------- */
export function studentsOfSection(sectionId: number): StudentRow[] {
  const sec = q.get<{ grade: number }>(`SELECT grade FROM sections WHERE id = ?`, sectionId);
  if (!sec) return [];
  const levelIds = new Set(levelsForGrade(sec.grade).map(l => l.id));
  const students = q.all<{ id: number; name: string; username: string; last_login_at: string | null; active: number }>(
    `SELECT id, name, username, last_login_at, active FROM users WHERE section_id = ? AND role = 'student' AND active = 1 ORDER BY name`, sectionId);
  const prog = q.all<{ student_id: number; level_id: string; stars: number }>(
    `SELECT p.student_id, p.level_id, p.stars FROM level_progress p JOIN users u ON u.id = p.student_id WHERE u.section_id = ?`, sectionId);
  const scores = q.all<{ student_id: number; avg: number; n: number }>(
    `SELECT a.student_id, ${AVG_PCT} AS avg, COUNT(*) AS n FROM attempts a JOIN users u ON u.id = a.student_id WHERE u.section_id = ? GROUP BY a.student_id`, sectionId);
  return students.map(s => {
    const mine = prog.filter(p => p.student_id === s.id && levelIds.has(p.level_id));
    const sc = scores.find(x => x.student_id === s.id);
    return { ...s, levelsDone: mine.length, levelsTotal: levelIds.size, stars: mine.reduce((t, p) => t + p.stars, 0), avgScore: sc ? sc.avg : null, attempts: sc ? sc.n : 0 };
  });
}

export function assignmentsOfSection(sectionId: number): AssignmentRow[] {
  const rows = q.all<Omit<AssignmentRow, 'title' | 'questions'>>(`
    SELECT g.id, g.assessment_id, g.section_id, g.due_at, g.created_at,
      (SELECT COUNT(*) FROM attempts a WHERE a.assignment_id = g.id) AS submitted,
      (SELECT ${AVG_PCT} FROM attempts a WHERE a.assignment_id = g.id) AS avg_score
    FROM assignments g WHERE g.section_id = ? ORDER BY g.created_at DESC`, sectionId);
  return rows.map(r => {
    const a = assessmentById(r.assessment_id);
    return { ...r, title: a?.title ?? r.assessment_id, questions: a?.questions.length ?? 0 };
  });
}

export function getAssignment(id: number) {
  return q.get<{ id: number; assessment_id: string; section_id: number; due_at: string | null; created_at: string; school_id: number; teacher_id: number | null; grade: number; section_name: string }>(`
    SELECT g.*, x.school_id, x.teacher_id, x.grade, x.name AS section_name
    FROM assignments g JOIN sections x ON x.id = g.section_id WHERE g.id = ?`, id);
}

export function attemptsOfAssignment(assignmentId: number) {
  return q.all<{ id: number; student_id: number; answers: string; score: number; max_score: number; submitted_at: string }>(
    `SELECT id, student_id, answers, score, max_score, submitted_at FROM attempts WHERE assignment_id = ?`, assignmentId);
}

/* ---------- student ---------- */
export function studentHome(user: User) {
  const section = user.sectionId ? getSection(user.sectionId) : undefined;
  const grade = section?.grade ?? 3;
  const levels = levelsForGrade(grade);
  const prog = q.all<{ level_id: string; stars: number }>(`SELECT level_id, stars FROM level_progress WHERE student_id = ?`, user.id);
  const starsBy = new Map(prog.map(p => [p.level_id, p.stars]));
  const assignments = section ? q.all<{ id: number; assessment_id: string; due_at: string | null; created_at: string; score: number | null; max_score: number | null; submitted_at: string | null }>(`
    SELECT g.id, g.assessment_id, g.due_at, g.created_at, a.score, a.max_score, a.submitted_at
    FROM assignments g LEFT JOIN attempts a ON a.assignment_id = g.id AND a.student_id = ?
    WHERE g.section_id = ? ORDER BY g.created_at DESC`, user.id, section.id) : [];
  return {
    section, grade, levels: levels.map(l => ({ ...l, stars: starsBy.get(l.id) ?? 0 })),
    totalStars: prog.reduce((t, p) => t + p.stars, 0),
    assignments: assignments.map(a => ({ ...a, assessment: assessmentById(a.assessment_id) }))
  };
}

export function bankByGrade() {
  const out: Record<number, typeof ASSESSMENTS> = {};
  for (const a of ASSESSMENTS) (out[a.grade] ||= []).push(a);
  return out;
}

/* ---------- parent ---------- */
export function childrenOfParent(parentId: number) {
  const kids = q.all<{ id: number; name: string; username: string; section_id: number | null; school_id: number | null; school_name: string | null }>(`
    SELECT u.id, u.name, u.username, u.section_id, u.school_id, s.name AS school_name
    FROM parent_links l JOIN users u ON u.id = l.student_id LEFT JOIN schools s ON s.id = u.school_id
    WHERE l.parent_id = ? AND u.active = 1 ORDER BY u.name`, parentId);
  return kids.map(k => ({
    ...k,
    home: studentHome({ id: k.id, role: 'student', name: k.name, username: k.username, schoolId: k.school_id, sectionId: k.section_id, mustChangePassword: false })
  }));
}

export function schoolCodes(schoolId: number) {
  return q.get<{ student_code: string | null; teacher_code: string | null }>('SELECT student_code, teacher_code FROM schools WHERE id = ?', schoolId);
}

export function schoolInvites() {
  return q.all<{ code: string; note: string | null; created_at: string; used_at: string | null; school_name: string | null }>(`
    SELECT i.code, i.note, i.created_at, i.used_at, s.name AS school_name FROM school_invites i LEFT JOIN schools s ON s.id = i.school_id ORDER BY i.created_at DESC LIMIT 50`);
}
