import Link from 'next/link';
import type { Metadata } from 'next';
import { Bar, Empty, ScoreBadge, Stat, pct } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { assignmentsOfSection, sectionsOfTeacher, studentsOfSection } from '@/lib/data';

export const metadata: Metadata = { title: 'My classes' };

export default async function TeacherHome({ searchParams }: { searchParams: Promise<{ pw?: string }> }) {
  const user = await requireRole('teacher');
  const { pw } = await searchParams;
  const sections = sectionsOfTeacher(user.id).map(s => {
    const students = studentsOfSection(s.id), assignments = assignmentsOfSection(s.id);
    const levelPct = students.length ? students.reduce((t, x) => t + x.levelsDone / x.levelsTotal, 0) / students.length * 100 : null;
    const pending = assignments.reduce((t, a) => t + Math.max(0, students.length - a.submitted), 0);
    return { ...s, studentCount: students.length, levelPct, assignments: assignments.length, pending };
  });
  const totalStudents = sections.reduce((t, s) => t + s.studentCount, 0);
  const scored = sections.filter(s => s.avg_score !== null);
  return (
    <div className="stack">
      {pw && <div className="alert ok">Your password has been changed.</div>}
      <div><div className="eyebrow">Teacher</div><h1>Hello, {user.name.split(' ')[0]}!</h1></div>
      <div className="stats">
        <Stat label="Sections" value={sections.length} />
        <Stat label="Students" value={totalStudents} />
        <Stat label="Average score" value={pct(scored.length ? scored.reduce((t, s) => t + s.avg_score!, 0) / scored.length : null)} />
        <Stat label="Still to submit" value={sections.reduce((t, s) => t + s.pending, 0)} hint="across all assigned assessments" />
      </div>
      {sections.length ? (
        <div className="grid-3">
          {sections.map(s => (
            <Link key={s.id} href={`/classes/${s.id}`} className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'grid', gap: 10 }}>
              <div className="spread"><div><div className="eyebrow">Class {s.grade}</div><h2>Section {s.name}</h2></div><ScoreBadge value={s.avg_score} /></div>
              <span className="small muted">{s.studentCount} students · {s.assignments} assessments assigned</span>
              <div><span className="small">Game levels done</span><Bar value={s.levelPct} /></div>
              <span className="btn small" style={{ justifySelf: 'start' }}>Open class</span>
            </Link>
          ))}
        </div>
      ) : <Empty>You have no sections yet. Ask your school admin to add you as the teacher of a section.</Empty>}
    </div>
  );
}
