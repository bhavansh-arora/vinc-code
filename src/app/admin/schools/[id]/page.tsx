import Link from 'next/link';
import { notFound } from 'next/navigation';
import ActionForm from '@/components/ActionForm';
import { Bar, Empty, ScoreBadge, Stat, pct, when } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { getSchool, gradeSummary, schoolAdmins, schoolStats, sectionsOfSchool, teachersOfSchool } from '@/lib/data';
import { resetSchoolAdminAction, toggleSchoolAction } from '../../actions';

export default async function AdminSchool({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('admin');
  const school = getSchool(Number((await params).id));
  if (!school) notFound();
  const st = schoolStats(school.id), grades = gradeSummary(school.id), sections = sectionsOfSchool(school.id), teachers = teachersOfSchool(school.id), admins = schoolAdmins(school.id);
  return (
    <div className="stack">
      <div><Link href="/admin" className="small">← All schools</Link>
        <div className="eyebrow" style={{ marginTop: 8 }}>{school.code}{school.city ? ` · ${school.city}` : ''} · {school.active ? 'switched on' : 'switched off'}</div>
        <h1>{school.name}</h1></div>
      <div className="stats">
        <Stat label="Teachers" value={st.teachers} /><Stat label="Sections" value={st.sections} /><Stat label="Students" value={st.students} /><Stat label="Average score" value={pct(st.avgScore)} />
      </div>
      <section className="card">
        <div className="card-head"><h2>By class</h2></div>
        {grades.length ? <div className="table-wrap"><table className="data">
          <thead><tr><th>Class</th><th className="num">Sections</th><th className="num">Students</th><th style={{ minWidth: 160 }}>Game levels done</th><th className="num">Avg. score</th></tr></thead>
          <tbody>{grades.map(g => <tr key={g.grade}><td><b>Class {g.grade}</b></td><td className="num">{g.sections}</td><td className="num">{g.students}</td><td><Bar value={g.levelPct} /></td><td className="num"><ScoreBadge value={g.avgScore} /></td></tr>)}</tbody>
        </table></div> : <Empty>No sections yet.</Empty>}
      </section>
      <section className="card">
        <div className="card-head"><h2>Sections</h2></div>
        {sections.length ? <div className="table-wrap"><table className="data">
          <thead><tr><th>Section</th><th>Class</th><th>Teacher</th><th className="num">Students</th><th className="num">Avg. score</th><th /></tr></thead>
          <tbody>{sections.map(x => <tr key={x.id}><td><b>{x.name}</b></td><td>{x.grade}</td><td>{x.teacher_name ?? '—'}</td><td className="num">{x.students}</td><td className="num"><ScoreBadge value={x.avg_score} /></td><td className="num"><Link className="btn small" href={`/classes/${x.id}`}>Open</Link></td></tr>)}</tbody>
        </table></div> : <Empty>No sections yet.</Empty>}
      </section>
      <div className="grid-2">
        <section className="card">
          <h2>People</h2>
          <p className="small muted" style={{ margin: '4px 0 12px' }}>{teachers.length} teacher{teachers.length === 1 ? '' : 's'}: {teachers.map(t => t.name).join(', ') || 'none yet'}</p>
          <div className="table-wrap"><table className="data">
            <thead><tr><th>School admin</th><th>Username</th><th>Last sign-in</th></tr></thead>
            <tbody>{admins.map(a => <tr key={a.id}><td>{a.name}</td><td className="mono small">{a.username}</td><td className="small">{when(a.last_login_at)}</td></tr>)}</tbody>
          </table></div>
        </section>
        <section className="card stack" style={{ gap: 16 }}>
          <div><h2>Reset the school admin&apos;s password</h2>
            <div style={{ marginTop: 10 }}><ActionForm action={resetSchoolAdminAction} submit="Make a temporary password" className="form-grid" cardsTitle="School admin login">
              <div className="field"><label htmlFor="userId">School admin</label><select className="input" id="userId" name="userId">{admins.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
            </ActionForm></div></div>
          <div><h2>{school.active ? 'Switch this school off' : 'Switch this school on'}</h2>
            <p className="small muted" style={{ margin: '4px 0 10px' }}>{school.active ? 'Nobody from this school can sign in while it is off. Their data is kept.' : 'Teachers and students can sign in again.'}</p>
            <ActionForm action={toggleSchoolAction} submit={school.active ? 'Switch off' : 'Switch on'}><input type="hidden" name="schoolId" value={school.id} /></ActionForm></div>
        </section>
      </div>
    </div>
  );
}
