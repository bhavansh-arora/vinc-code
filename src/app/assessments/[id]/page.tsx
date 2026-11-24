import Link from 'next/link';
import { notFound } from 'next/navigation';
import Shell from '@/components/Shell';
import QuestionView from '@/components/QuestionView';
import { requireRole } from '@/lib/auth';
import { assessmentById } from '@/data/assessments';

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole('admin', 'school', 'teacher');
  const a = assessmentById((await params).id);
  if (!a) notFound();
  return (
    <Shell user={user}>
      <div className="stack">
        <div><Link href="/assessments" className="small">← Assessment bank</Link>
          <div className="eyebrow" style={{ marginTop: 8 }}>Class {a.grade} · {a.kind} · {a.questions.length} questions · {a.minutes} minutes</div>
          <h1>{a.title}</h1><p className="muted">{a.summary} Answers and explanations are shown because this is the teacher preview.</p></div>
        <section className="card ab-blueprint">
          <div><span className="ab-label">Students who pass can</span><ul className="ab-obj">{(a.objectives ?? []).map(o => <li key={o}>{o}</li>)}</ul></div>
          <div><span className="ab-label">Question by question</span>
            <table className="data ab-map"><thead><tr><th>#</th><th>Skill</th><th>Level</th></tr></thead>
              <tbody>{a.questions.map((q, i) => <tr key={q.id}><td className="mono">{i + 1}</td><td>{q.skill}</td><td><span className={'ab-lv lv-' + (q.level ?? '').toLowerCase()}>{q.level}</span></td></tr>)}</tbody></table></div>
        </section>
        {a.questions.map((q, i) => (
          <div key={q.id} className="ab-q">
            <div className="ab-qtags"><span className="ab-chip">{q.skill}</span><span className={'ab-lv lv-' + (q.level ?? '').toLowerCase()}>{q.level}</span>{q.verify && <span className="ab-chip">answer proven on the board</span>}</div>
            <QuestionView q={q} n={i + 1} mode={{ kind: 'preview' }} />
          </div>
        ))}
      </div>
    </Shell>
  );
}
