import type { Metadata } from 'next';
import ActionForm from '@/components/ActionForm';
import { Bar, Empty, ScoreBadge, Stars, when } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { childrenOfParent, lessonProgressOf } from '@/lib/data';
import { lessonsForGrade } from '@/data/lessons';
import { linkChildAction } from './actions';

export const metadata: Metadata = { title: 'My children' };

export default async function ParentHome() {
  const user = await requireRole('parent');
  const kids = childrenOfParent(user.id);
  return (
    <div className="stack">
      <div><div className="eyebrow">Parent</div><h1>Hello, {user.name.split(' ')[0]}!</h1>
        <p className="muted">See how your child is doing with Vinc: the levels they have finished, their stars, and their assessment results.</p></div>
      {kids.length ? kids.map(k => {
        const h = k.home, done = h.levels.filter(l => l.stars > 0).length;
        const kidLessons = lessonsForGrade(h.grade), kp = lessonProgressOf(k.id), lessonsDone = kidLessons.filter(l => kp.get(l.id)?.passed_at).length;
        const finished = h.assignments.filter(a => a.score !== null), todo = h.assignments.filter(a => a.score === null);
        const avg = finished.length ? finished.reduce((t, a) => t + a.score! / a.max_score!, 0) / finished.length * 100 : null;
        const recent = h.levels.filter(l => l.stars > 0).slice(-5).reverse();
        return (
          <section className="card stack" style={{ gap: 16 }} key={k.id}>
            <div className="spread">
              <div><div className="eyebrow">Class {h.grade}{h.section ? ` · Section ${h.section.name}` : ''}{k.school_name ? ` · ${k.school_name}` : ''}</div><h2>{k.name}</h2></div>
              <ScoreBadge value={avg} />
            </div>
            <div className="stats">
              <div className="stat"><span className="label">Levels done</span><span className="value">{done} / {h.levels.length}</span></div>
              <div className="stat"><span className="label">Stars</span><span className="value">★ {h.totalStars}</span></div>
              {kidLessons.length > 0 && <div className="stat"><span className="label">Lessons</span><span className="value">{lessonsDone} / {kidLessons.length}</span></div>}
              <div className="stat"><span className="label">Assessments</span><span className="value">{finished.length} done</span><span className="hint">{todo.length ? `${todo.length} still to do` : 'nothing pending'}</span></div>
            </div>
            <div><span className="small">Game progress for their class</span><Bar value={h.levels.length ? done / h.levels.length * 100 : 0} /></div>
            <div className="grid-2">
              <div>
                <h3 style={{ marginBottom: 8 }}>Recently finished levels</h3>
                {recent.length ? <div className="table-wrap"><table className="data"><tbody>{recent.map(l => <tr key={l.id}><td className="mono small">{l.id}</td><td>{l.name}</td><td className="num"><Stars n={l.stars} /></td></tr>)}</tbody></table></div>
                  : <p className="small muted">No levels finished yet.</p>}
              </div>
              <div>
                <h3 style={{ marginBottom: 8 }}>Assessment results</h3>
                {h.assignments.length ? <div className="table-wrap"><table className="data"><tbody>{h.assignments.map(a => (
                  <tr key={a.id}><td>{a.assessment?.title}<br /><span className="small muted">{a.score !== null ? `Submitted ${when(a.submitted_at)}` : a.due_at ? `Due ${when(a.due_at)}` : 'Not taken yet'}</span></td>
                    <td className="num">{a.score !== null ? `${a.score} / ${a.max_score}` : '—'}</td><td className="num"><ScoreBadge value={a.score !== null ? a.score / a.max_score! * 100 : null} /></td></tr>
                ))}</tbody></table></div> : <p className="small muted">The teacher has not assigned any assessments yet.</p>}
              </div>
            </div>
          </section>
        );
      }) : <Empty>No child is linked to your account yet. Add one with their family code below.</Empty>}
      <section className="card">
        <h2>Link another child</h2>
        <p className="small muted" style={{ margin: '4px 0 12px' }}>Each child has a six-letter family code on their VINC Code dashboard.</p>
        <ActionForm action={linkChildAction} submit="Link child" className="form-grid">
          <div className="field"><label htmlFor="code">Family code</label><input className="input mono" id="code" name="code" required maxLength={6} placeholder="e.g. BCAVC5" autoCapitalize="characters" autoComplete="off" /></div>
        </ActionForm>
      </section>
    </div>
  );
}
