import Link from 'next/link';
import type { Metadata } from 'next';
import VincArt from '@/components/VincArt';
import { Bar, Empty, ScoreBadge, Stars, when } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { studentHome } from '@/lib/data';
import { q } from '@/lib/db';

export const metadata: Metadata = { title: 'My dashboard' };

export default async function StudentHome() {
  const user = await requireRole('student');
  const h = studentHome(user);
  const fam = q.get<{ family_code: string | null }>('SELECT family_code FROM users WHERE id = ?', user.id)?.family_code;
  const done = h.levels.filter(l => l.stars > 0).length;
  const todo = h.assignments.filter(a => a.score === null);
  const finished = h.assignments.filter(a => a.score !== null);
  const next = h.levels.find(l => l.stars === 0);
  return (
    <div className="stack">
      <section className="card" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 20, alignItems: 'center' }}>
        <div className="stack" style={{ gap: 10 }}>
          <div className="eyebrow">Class {h.grade}{h.section ? ` · Section ${h.section.name}` : ''}</div>
          <h1>Hi {user.name.split(' ')[0]}! Ready to code?</h1>
          <p className="muted">{next ? <>Your next level is <b>{next.id}: {next.name}</b>.</> : 'You finished every level for your class. Amazing!'} {todo.length ? `You have ${todo.length} assessment${todo.length === 1 ? '' : 's'} to do.` : ''}</p>
          <div className="row"><a className="btn primary" href="/game">▶ Play with Vinc</a>{todo[0] && <Link className="btn" href={`/student/assessments/${todo[0].id}`}>Start assessment</Link>}</div>
        </div>
        <VincArt className="student-vinc" label="Vinc waving" />
      </section>
      <div className="grid-2">
        <section className="card">
          <div className="card-head"><h2>My game progress</h2><span className="stars">★ {h.totalStars}</span></div>
          <Bar value={h.levels.length ? done / h.levels.length * 100 : 0} label="levels done" />
          <p className="small muted" style={{ margin: '6px 0 12px' }}>{done} of {h.levels.length} levels done{h.grade > 4 ? '. Your class\'s own levels are coming soon, so practise with these.' : '.'}</p>
          <div className="table-wrap"><table className="data">
            <tbody>{h.levels.map(l => <tr key={l.id}><td className="mono small">{l.id}</td><td>{l.name}{l.debug ? <> <span className="badge plain">Glitch</span></> : null}</td><td className="num"><Stars n={l.stars} /></td></tr>)}</tbody>
          </table></div>
        </section>
        <section className="card stack" style={{ gap: 16, alignContent: 'start' }}>
          <div>
            <h2 style={{ marginBottom: 10 }}>To do</h2>
            {todo.length ? <div className="stack" style={{ gap: 10 }}>{todo.map(a => (
              <div key={a.id} className="spread" style={{ padding: 12, border: '1.5px solid var(--line)', borderRadius: 12 }}>
                <div><b>{a.assessment?.title}</b><br /><span className="small muted">{a.assessment?.questions.length} questions · about {a.assessment?.minutes} min{a.due_at ? ` · due ${when(a.due_at)}` : ''}</span></div>
                <Link className="btn primary small" href={`/student/assessments/${a.id}`}>Start</Link>
              </div>))}</div> : <Empty>Nothing to do right now. Go play!</Empty>}
          </div>
          <div>
            <h2 style={{ marginBottom: 10 }}>Finished</h2>
            {finished.length ? <div className="table-wrap"><table className="data"><tbody>{finished.map(a => (
              <tr key={a.id}><td><Link href={`/student/assessments/${a.id}`}>{a.assessment?.title}</Link></td><td className="num">{a.score} / {a.max_score}</td><td className="num"><ScoreBadge value={a.score! / a.max_score! * 100} /></td></tr>
            ))}</tbody></table></div> : <p className="small muted">Your results will show here.</p>}
          </div>
        </section>
      </div>
      {fam && (
        <section className="card spread">
          <div><h2>Your family code</h2><p className="small muted">Give this code to your parent. They can sign up as a Parent and follow your progress.</p></div>
          <code className="family-code">{fam}</code>
        </section>
      )}
    </div>
  );
}
