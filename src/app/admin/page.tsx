import Link from 'next/link';
import type { Metadata } from 'next';
import ActionForm from '@/components/ActionForm';
import { Empty, ScoreBadge, Stat, pct } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { platformStats, schoolsWithCounts } from '@/lib/data';
import { ASSESSMENTS } from '@/data/assessments';
import { createSchoolAction } from './actions';

export const metadata: Metadata = { title: 'Admin' };

export default async function AdminHome() {
  await requireRole('admin');
  const s = platformStats();
  const schools = schoolsWithCounts();
  return (
    <div className="stack">
      <div><div className="eyebrow">VINC admin</div><h1>Platform overview</h1></div>
      <div className="stats">
        <Stat label="Schools" value={s.schools} hint="switched on" />
        <Stat label="Teachers" value={s.teachers} />
        <Stat label="Students" value={s.students} />
        <Stat label="Assessments taken" value={s.attempts} />
        <Stat label="Average score" value={pct(s.avgScore)} />
        <Stat label="Assessment bank" value={ASSESSMENTS.length} hint="for Classes 3 to 8" />
      </div>
      <section className="card">
        <div className="card-head"><h2>Schools</h2></div>
        {schools.length ? (
          <div className="table-wrap"><table className="data">
            <thead><tr><th>School</th><th>Code</th><th>School admin</th><th className="num">Teachers</th><th className="num">Sections</th><th className="num">Students</th><th className="num">Avg. score</th><th>Status</th><th /></tr></thead>
            <tbody>{schools.map(x => (
              <tr key={x.id}><td><b>{x.name}</b>{x.city && <><br /><span className="small muted">{x.city}</span></>}</td><td className="mono">{x.code}</td>
                <td className="mono small">{x.admin_username ?? '—'}</td><td className="num">{x.teachers}</td><td className="num">{x.sections}</td><td className="num">{x.students}</td>
                <td className="num"><ScoreBadge value={x.avg_score} /></td><td>{x.active ? <span className="badge good">on</span> : <span className="badge bad">off</span>}</td>
                <td className="num"><Link className="btn small" href={`/admin/schools/${x.id}`}>Open</Link></td></tr>
            ))}</tbody>
          </table></div>
        ) : <Empty>No schools yet. Add the first one below.</Empty>}
      </section>
      <section className="card">
        <h2>Add a school</h2>
        <p className="small muted" style={{ marginBottom: 12 }}>This creates the school and its first school-admin account. The admin chooses a new password the first time they sign in.</p>
        <ActionForm action={createSchoolAction} submit="Add school" className="form-grid" cardsTitle="School admin login">
          <div className="field"><label htmlFor="name">School name</label><input className="input" id="name" name="name" required /></div>
          <div className="field"><label htmlFor="code">School code</label><input className="input" id="code" name="code" placeholder="DPS" required maxLength={8} /><span className="help">Starts every username, e.g. dps-aaravk</span></div>
          <div className="field"><label htmlFor="city">City</label><input className="input" id="city" name="city" /></div>
          <div className="field"><label htmlFor="adminName">School admin&apos;s name</label><input className="input" id="adminName" name="adminName" required /></div>
        </ActionForm>
      </section>
    </div>
  );
}
