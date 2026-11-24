import Link from 'next/link';
import { notFound } from 'next/navigation';
import QuestionView from '@/components/QuestionView';
import { ScoreBadge } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { q } from '@/lib/db';
import { assessmentById } from '@/data/assessments';
import { submitAttemptAction } from '../../actions';

export default async function TakeAssessment({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole('student');
  const g = q.get<{ id: number; assessment_id: string; section_id: number }>(`SELECT id, assessment_id, section_id FROM assignments WHERE id = ?`, Number((await params).id));
  if (!g || g.section_id !== user.sectionId) notFound();
  const a = assessmentById(g.assessment_id);
  if (!a) notFound();
  const attempt = q.get<{ answers: string; score: number; max_score: number }>(`SELECT answers, score, max_score FROM attempts WHERE assignment_id = ? AND student_id = ?`, g.id, user.id);

  if (attempt) {
    const answers = JSON.parse(attempt.answers) as Record<string, string>;
    const p = attempt.score / attempt.max_score * 100;
    return (
      <div className="stack">
        <div><Link href="/student" className="small">← My dashboard</Link>
          <div className="eyebrow" style={{ marginTop: 8 }}>Your result</div><h1>{a.title}</h1></div>
        <div className="card spread"><div><h2>You scored {attempt.score} out of {attempt.max_score}</h2>
          <p className="muted">{p >= 75 ? 'Brilliant work! Vinc is doing a happy dance.' : p >= 50 ? 'Good effort! Read the explanations below to learn the rest.' : 'Keep going! Read each explanation, then try the game levels again.'}</p></div><ScoreBadge value={p} /></div>
        {a.questions.map((qn, i) => <QuestionView key={qn.id} q={qn} n={i + 1} mode={{ kind: 'review', given: answers[qn.id] ?? '' }} />)}
      </div>
    );
  }
  return (
    <form action={submitAttemptAction} className="stack">
      <input type="hidden" name="assignmentId" value={g.id} />
      <div><Link href="/student" className="small">← My dashboard</Link>
        <div className="eyebrow" style={{ marginTop: 8 }}>Class {a.grade} · {a.questions.length} questions · about {a.minutes} minutes</div>
        <h1>{a.title}</h1><p className="muted">Answer every question, then press Submit. You can only submit once, so check your answers first.</p></div>
      {a.questions.map((qn, i) => <QuestionView key={qn.id} q={qn} n={i + 1} mode={{ kind: 'take' }} />)}
      <div><button className="btn primary">Submit my answers</button></div>
    </form>
  );
}
