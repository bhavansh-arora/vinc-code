import Link from 'next/link';
import type { Metadata } from 'next';
import ActionForm from '@/components/ActionForm';
import { Bar, Empty, ScoreBadge, Stat, pct, when } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { getSchool, gradeSummary, schoolCodes, schoolStats, sectionsOfSchool, teachersOfSchool } from '@/lib/data';
import { createSectionAction, createTeacherAction, newCodesAction, resetTeacherAction, setSectionTeacherAction } from './actions';

export const metadata: Metadata = { title: 'School' };

export default async function SchoolHome({ searchParams }: { searchParams: Promise<{ pw?: string }> }) {
  const user = await requireRole('school');
  const { pw } = await searchParams;
  const school = getSchool(user.schoolId!)!;
  const codes = schoolCodes(school.id);
  const st = schoolStats(school.id), grades = gradeSummary(school.id), sections = sectionsOfSchool(school.id), teachers = teachersOfSchool(school.id);
  return (
    <div className="stack">
      {pw && <div className="alert ok">Your password has been changed.</div>}
      <div><div className="eyebrow">School admin · code {school.code}</div><h1>{school.name}</h1></div>
      <div className="stats">
        <Stat label="Teachers" value={st.teachers} /><Stat label="Sections" value={st.sections} /><Stat label="Students" value={st.students} /><Stat label="Average score" value={pct(st.avgScore)} hint="all assessments" />
      </div>
      <section className="card">
        <div className="card-head"><h2>Joining codes</h2><span className="small muted">People sign up themselves at <b>/signup</b> with these codes</span></div>
        <div className="grid-2">
          <div className="code-box"><span className="label">For teachers</span><code>{codes?.teacher_code ?? '—'}</code><span className="small muted">Share with your teachers only. They choose their sections when they sign up.</span>
            <ActionForm action={newCodesAction} submit="Make a new teacher code" className="row" buttonClass="btn small quiet"><input type="hidden" name="kind" value="teacher" /></ActionForm></div>
          <div className="code-box"><span className="label">For students</span><code>{codes?.student_code ?? '—'}</code><span className="small muted">Teachers give this to their students. Students pick their class and section.</span>
            <ActionForm action={newCodesAction} submit="Make a new student code" className="row" buttonClass="btn small quiet"><input type="hidden" name="kind" value="student" /></ActionForm></div>
        </div>
      </section>
      <section className="card">
        <div className="card-head"><h2>How each class is doing</h2></div>
        {grades.length ? <div className="table-wrap"><table className="data">
          <thead><tr><th>Class</th><th className="num">Sections</th><th className="num">Students</th><th style={{ minWidth: 160 }}>Game levels done</th><th className="num">Avg. score</th></tr></thead>
          <tbody>{grades.map(g => <tr key={g.grade}><td><b>Class {g.grade}</b></td><td className="num">{g.sections}</td><td className="num">{g.students}</td><td><Bar value={g.levelPct} /></td><td className="num"><ScoreBadge value={g.avgScore} /></td></tr>)}</tbody>
        </table></div> : <Empty>Create your first section below.</Empty>}
      </section>
      <section className="card">
        <div className="card-head"><h2>Sections</h2></div>
        {sections.length ? <div className="table-wrap"><table className="data">
          <thead><tr><th>Section</th><th>Class</th><th>Teacher</th><th className="num">Students</th><th className="num">Avg. score</th><th /></tr></thead>
          <tbody>{sections.map(x => <tr key={x.id}><td><b>{x.name}</b></td><td>{x.grade}</td><td>{x.teacher_name ?? <span className="badge warn">no teacher</span>}</td><td className="num">{x.students}</td><td className="num"><ScoreBadge value={x.avg_score} /></td><td className="num"><Link className="btn small" href={`/classes/${x.id}`}>Open</Link></td></tr>)}</tbody>
        </table></div> : <Empty>No sections yet.</Empty>}
        <div className="grid-2" style={{ marginTop: 18 }}>
          <div><h3 style={{ marginBottom: 10 }}>Create a section</h3>
            <ActionForm action={createSectionAction} submit="Create section" className="form-grid">
              <div className="field"><label htmlFor="grade">Class</label><select className="input" id="grade" name="grade">{[3, 4, 5, 6, 7, 8].map(g => <option key={g} value={g}>Class {g}</option>)}</select></div>
              <div className="field"><label htmlFor="sname">Section name</label><input className="input" id="sname" name="name" placeholder="4-B" required maxLength={20} /></div>
              <div className="field"><label htmlFor="teacherId">Teacher</label><select className="input" id="teacherId" name="teacherId"><option value="">Choose later</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            </ActionForm></div>
          {sections.length > 0 && <div><h3 style={{ marginBottom: 10 }}>Change a section&apos;s teacher</h3>
            <ActionForm action={setSectionTeacherAction} submit="Save" className="form-grid">
              <div className="field"><label htmlFor="sectionId">Section</label><select className="input" id="sectionId" name="sectionId">{sections.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
              <div className="field"><label htmlFor="teacherId2">Teacher</label><select className="input" id="teacherId2" name="teacherId"><option value="">No teacher</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            </ActionForm></div>}
        </div>
      </section>
      <section className="card">
        <div className="card-head"><h2>Teachers</h2></div>
        {teachers.length ? <div className="table-wrap"><table className="data">
          <thead><tr><th>Name</th><th>Username</th><th>Sections</th><th>Last sign-in</th></tr></thead>
          <tbody>{teachers.map(t => <tr key={t.id}><td><b>{t.name}</b>{t.must_change_password ? <> <span className="badge plain">first sign-in pending</span></> : null}</td><td className="mono small">{t.username}</td><td>{t.sections ?? '—'}</td><td className="small">{when(t.last_login_at)}</td></tr>)}</tbody>
        </table></div> : <Empty>No teachers yet.</Empty>}
        <div className="grid-2" style={{ marginTop: 18 }}>
          <div><h3 style={{ marginBottom: 10 }}>Add a teacher</h3>
            <ActionForm action={createTeacherAction} submit="Add teacher" className="form-grid" cardsTitle="Teacher login">
              <div className="field"><label htmlFor="tname">Full name</label><input className="input" id="tname" name="name" required /></div>
            </ActionForm></div>
          {teachers.length > 0 && <div><h3 style={{ marginBottom: 10 }}>Reset a teacher&apos;s password</h3>
            <ActionForm action={resetTeacherAction} submit="Make a temporary password" className="form-grid" cardsTitle="Teacher login">
              <div className="field"><label htmlFor="rteacher">Teacher</label><select className="input" id="rteacher" name="teacherId">{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            </ActionForm></div>}
        </div>
      </section>
    </div>
  );
}
