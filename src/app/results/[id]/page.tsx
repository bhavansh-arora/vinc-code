import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Shell from '@/components/Shell';
import ActionForm from '@/components/ActionForm';
import { Bar, Empty, ScoreBadge, Stat, pct, when } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { attemptsOfAssignment, canManageSection, canSeeSection, getAssignment, studentsOfSection } from '@/lib/data';
import { assessmentById } from '@/data/assessments';
import { allowRetakeAction } from '@/app/teacher/actions';
import { ROLE_HOME } from '@/lib/types';

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole('admin', 'school', 'teacher');
  const g = getAssignment(Number((await params).id));
  if (!g) notFound();
  if (!canSeeSection(user, g)) redirect(ROLE_HOME[user.role]);
  const a = assessmentById(g.assessment_id);
  if (!a) notFound();
  const manage = canManageSection(user, g);
  const students = studentsOfSection(g.section_id);
  const attempts = attemptsOfAssignment(g.id);
  const byStudent = new Map(attempts.map(t => [t.student_id, t]));
  const avg = attempts.length ? attempts.reduce((s, t) => s + t.score / t.max_score, 0) / attempts.length * 100 : null;
  const perQ = a.questions.map(qn => {
    const right = attempts.filter(t => Number((JSON.parse(t.answers) as Record<string, string>)[qn.id]) === qn.answer && (JSON.parse(t.answers) as Record<string, string>)[qn.id] !== '').length;
    return { qn, pct: attempts.length ? right / attempts.length * 100 : null };
  });
  const hardest = perQ.filter(p => p.pct !== null).sort((x, y) => x.pct! - y.pct!)[0];

  return (
    <Shell user={user}>
      <div className="stack">
        <div><Link href={`/classes/${g.section_id}`} className="small">← Section {g.section_name}</Link>
          <div className="eyebrow" style={{ marginTop: 8 }}>Class {a.grade} · Section {g.section_name}{g.due_at ? ` · due ${when(g.due_at)}` : ''}</div>
          <h1>{a.title}</h1></div>
        <div className="stats">
          <Stat label="Submitted" value={`${attempts.length} / ${students.length}`} />
          <Stat label="Average score" value={pct(avg)} />
          <Stat label="Hardest question" value={hardest ? `Q${a.questions.indexOf(hardest.qn) + 1}` : '—'} hint={hardest ? `${pct(hardest.pct)} got it right` : undefined} />
        </div>
        <section className="card">
          <div className="card-head"><h2>Students</h2></div>
          {students.length ? (
            <div className="table-wrap"><table className="data">
              <thead><tr><th>Name</th><th className="num">Score</th><th className="num">Percent</th><th>Submitted</th>{manage && <th />}</tr></thead>
              <tbody>{students.map(s => {
                const t = byStudent.get(s.id);
                return (
                  <tr key={s.id}><td><b>{s.name}</b></td><td className="num">{t ? `${t.score} / ${t.max_score}` : '—'}</td>
                    <td className="num"><ScoreBadge value={t ? t.score / t.max_score * 100 : null} /></td><td className="small">{t ? when(t.submitted_at) : 'Not yet'}</td>
                    {manage && <td className="num">{t && <ActionForm action={allowRetakeAction} submit="Allow retake" className="row" buttonClass="btn small quiet"><input type="hidden" name="attemptId" value={t.id} /></ActionForm>}</td>}
                  </tr>);
              })}</tbody>
            </table></div>
          ) : <Empty>No students in this section yet.</Empty>}
        </section>
        <section className="card">
          <div className="card-head"><h2>Question by question</h2><span className="small muted">Share of students who got each question right</span></div>
          <div className="table-wrap"><table className="data">
            <thead><tr><th>#</th><th>Question</th><th style={{ minWidth: 160 }}>Correct</th></tr></thead>
            <tbody>{perQ.map((p, i) => (
              <tr key={p.qn.id}><td className="mono">{i + 1}</td><td>{p.qn.prompt}</td><td><Bar value={p.pct} amber={p.pct !== null && p.pct < 50} /></td></tr>
            ))}</tbody>
          </table></div>
          {!attempts.length && <p className="small muted" style={{ marginTop: 10 }}>Results appear here as students submit.</p>}
          <p className="small" style={{ marginTop: 12 }}><Link href={`/assessments/${a.id}`}>See the questions with answers</Link></p>
        </section>
      </div>
    </Shell>
  );
}
