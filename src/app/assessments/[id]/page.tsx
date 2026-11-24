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
          <div className="eyebrow" style={{ marginTop: 8 }}>Class {a.grade} · {a.questions.length} questions · {a.minutes} minutes</div>
          <h1>{a.title}</h1><p className="muted">{a.summary} Answers and explanations are shown because this is the teacher preview.</p></div>
        {a.questions.map((q, i) => <QuestionView key={q.id} q={q} n={i + 1} mode={{ kind: 'preview' }} />)}
      </div>
    </Shell>
  );
}
