import Link from 'next/link';
import type { Metadata } from 'next';
import ActionForm from '@/components/ActionForm';
import { Empty, ScoreBadge, Stat, pct, when } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { platformStats, schoolInvites, schoolsWithCounts } from '@/lib/data';
import { ASSESSMENTS } from '@/data/assessments';
import { createSchoolAction, issueSchoolIdAction, resendOnboardingAction } from './actions';

export const metadata: Metadata = { title: 'Admin' };

export default async function AdminHome() {
  await requireRole('admin');
  const s = platformStats();
  const schools = schoolsWithCounts();
  const invites = schoolInvites();
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
        <div className="card-head"><h2>School IDs for self-registration</h2><span className="small muted">Add the school&apos;s email and they get an onboarding email with a sign-up link</span></div>
        {invites.length ? (
          <div className="table-wrap" style={{ marginBottom: 14 }}><table className="data">
            <thead><tr><th>School ID</th><th>For</th><th>Email</th><th>Issued</th><th>Status</th><th /></tr></thead>
            <tbody>{invites.map(i => (
              <tr key={i.code}><td className="mono"><b>{i.code}</b></td><td>{i.note ?? '—'}</td>
                <td className="small">{i.email ? <>{i.email}<br /><span className={'badge ' + (i.email_status === 'sent' ? 'good' : i.email_status === 'failed' ? 'bad' : 'plain')} title={i.email_error ?? ''}>{i.email_status === 'sent' ? `sent ${when(i.email_sent_at)}` : i.email_status ?? 'not sent'}</span></> : '—'}</td>
                <td className="small">{when(i.created_at)}</td>
                <td>{i.school_name ? <span className="badge good">used by {i.school_name}</span> : <span className="badge plain">waiting</span>}</td>
                <td>{!i.school_name && (
                  <details className="invite-resend"><summary className="small">{i.email ? 'Resend email' : 'Email it'}</summary>
                    <ActionForm action={resendOnboardingAction} submit="Send onboarding email" className="stack" buttonClass="btn small">
                      <input type="hidden" name="code" value={i.code} />
                      <input className="input" name="email" type="email" maxLength={80} defaultValue={i.email ?? ''} placeholder="school@example.com" aria-label={`Email for ${i.code}`} required={!i.email} />
                    </ActionForm>
                  </details>
                )}</td></tr>
            ))}</tbody>
          </table></div>
        ) : <p className="small muted" style={{ marginBottom: 12 }}>No School IDs issued yet.</p>}
        <ActionForm action={issueSchoolIdAction} submit="Issue a School ID" className="form-grid">
          <div className="field"><label htmlFor="note">Which school is it for?</label><input className="input" id="note" name="note" maxLength={60} required placeholder="e.g. Sunflower Public School, Hubballi" /></div>
          <div className="field"><label htmlFor="inviteEmail">School&apos;s email</label><input className="input" id="inviteEmail" name="email" type="email" maxLength={80} required placeholder="principal@school.edu.in" /></div>
        </ActionForm>
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
