import Link from 'next/link';
import type { Metadata } from 'next';
import Shell from '@/components/Shell';
import CrewArt from '@/components/CrewArt';
import { Stat } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { bankByGrade } from '@/lib/data';
import { SKILLS, type Assessment, type Question } from '@/data/assessments';
import { buddyOf } from '@/lib/crew';
import { TOPIC } from '@/components/lessons/LessonList';

export const metadata: Metadata = { title: 'Assessment bank' };

const LEVELS = ['Easy', 'Medium', 'Hard'] as const;
const format = (q: Question) => (q.map ? 'Board puzzle' : q.code ? 'Code reading' : 'Concept');

function Mix({ qs, wide }: { qs: Question[]; wide?: boolean }) {
  const n = qs.length || 1;
  return (
    <div className={'ab-mix' + (wide ? ' wide' : '')} role="img" aria-label={LEVELS.map(l => `${qs.filter(q => q.level === l).length} ${l.toLowerCase()}`).join(', ')}>
      {LEVELS.map(l => { const k = qs.filter(q => q.level === l).length; return k ? <span key={l} className={'lv-' + l.toLowerCase()} style={{ flexGrow: k / n }}>{wide ? `${l} ${k}` : k}</span> : null; })}
    </div>
  );
}

function Card({ a }: { a: Assessment }) {
  const skills = [...new Set(a.questions.map(q => q.skill!))];
  const proven = a.questions.filter(q => q.verify).length;
  return (
    <article className={'ab-card k-' + (a.kind ?? '').replace(/\s/g, '').toLowerCase()}>
      <div className="spread"><span className="ab-kind">{a.kind}</span><span className="small muted mono">{a.questions.length} Q · {a.minutes} min</span></div>
      <h3>{a.title}</h3>
      <p className="small muted">{a.summary}</p>
      {a.objectives && a.objectives.length > 0 && (
        <div><span className="ab-label">Students can</span><ul className="ab-obj">{a.objectives.map(o => <li key={o}>{o}</li>)}</ul></div>
      )}
      <div><span className="ab-label">Difficulty</span><Mix qs={a.questions} /></div>
      <div className="ab-chips">{skills.map(s => <span key={s} className="ab-chip">{s}</span>)}</div>
      <div className="spread" style={{ marginTop: 'auto' }}>
        <span className="small muted">{proven ? `${proven} answer${proven === 1 ? '' : 's'} proven on the board` : 'Auto-graded'}</span>
        <Link className="btn small" href={`/assessments/${a.id}`}>Preview →</Link>
      </div>
    </article>
  );
}

export default async function BankPage() {
  const user = await requireRole('admin', 'school', 'teacher');
  const bank = bankByGrade();
  const all = Object.values(bank).flat(), qs = all.flatMap(a => a.questions);
  return (
    <Shell user={user}>
      <div className="stack">
        <div><div className="eyebrow">Classes 3 to 8</div><h1>Assessment bank</h1>
          <p className="muted">Three auto-graded assessments for every class: a checkpoint halfway through, an end-of-class test and a harder practice challenge.
            Every question is tagged with the skill it checks and how hard it is. Open one to see each question with its answer and explanation, and assign it from a class page.</p></div>
        <div className="stats">
          <Stat label="Assessments" value={all.length} />
          <Stat label="Questions" value={qs.length} hint={`${qs.filter(q => q.map).length} on Vinc's board`} />
          <Stat label="Skills tracked" value={Object.values(SKILLS).flat().length} />
          <Stat label="Proven answers" value={qs.filter(q => q.verify).length} hint="checked by running the code" />
        </div>
        <nav className="ab-jump" aria-label="Jump to a class">{Object.keys(bank).map(g => <a key={g} href={`#class-${g}`}>Class {g}</a>)}</nav>
        {Object.entries(bank).map(([grade, list]) => {
          const g = Number(grade), gq = list.flatMap(a => a.questions), buddy = buddyOf(g);
          const formats = ['Board puzzle', 'Code reading', 'Concept'].map(f => [f, gq.filter(q => format(q) === f).length] as const).filter(([, n]) => n);
          const max = Math.max(...SKILLS[g].map(s => gq.filter(q => q.skill === s).length), 1);
          return (
            <section className="card stack ab-class" key={grade} id={`class-${grade}`} style={{ gap: 16 }}>
              <div className="row" style={{ gap: 14 }}>
                <CrewArt id={buddy.id} className="ls-buddy" label={buddy.name} />
                <div><div className="eyebrow">Class {grade} · {list.length} assessments · {gq.length} questions · {list.reduce((t, a) => t + a.minutes, 0)} minutes</div>
                  <h2>{TOPIC[g]}</h2></div>
              </div>
              <div className="ab-blueprint">
                <div>
                  <span className="ab-label">Skills covered</span>
                  <ul className="ab-skills">{SKILLS[g].map(s => { const n = gq.filter(q => q.skill === s).length; return (
                    <li key={s}><span>{s}</span><span className="ab-skillbar"><span style={{ width: `${n / max * 100}%` }} /></span><b className="mono">{n}</b></li>
                  ); })}</ul>
                </div>
                <div className="stack" style={{ gap: 12 }}>
                  <div><span className="ab-label">Difficulty across the class</span><Mix qs={gq} wide /></div>
                  <div><span className="ab-label">Question formats</span><div className="ab-chips">{formats.map(([f, n]) => <span key={f} className="ab-chip">{f}: <b>{n}</b></span>)}</div></div>
                  <div><span className="ab-label">Answer types</span><div className="ab-chips">
                    <span className="ab-chip">Multiple choice: <b>{gq.filter(q => q.kind === 'mcq').length}</b></span>
                    <span className="ab-chip">Number answer: <b>{gq.filter(q => q.kind === 'number').length}</b></span></div></div>
                </div>
              </div>
              <div className="ab-cards">{list.map(a => <Card key={a.id} a={a} />)}</div>
            </section>
          );
        })}
      </div>
    </Shell>
  );
}
