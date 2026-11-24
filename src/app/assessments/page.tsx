import Link from 'next/link';
import type { Metadata } from 'next';
import Shell from '@/components/Shell';
import { requireRole } from '@/lib/auth';
import { bankByGrade } from '@/lib/data';

export const metadata: Metadata = { title: 'Assessment bank' };

export default async function BankPage() {
  const user = await requireRole('admin', 'school', 'teacher');
  const bank = bankByGrade();
  return (
    <Shell user={user}>
      <div className="stack">
        <div><div className="eyebrow">Classes 3 to 8</div><h1>Assessment bank</h1>
          <p className="muted">Two auto-graded assessments for every class. Open one to see each question with its answer and explanation. Assign them from a class page.</p></div>
        {Object.entries(bank).map(([grade, list]) => (
          <section className="card" key={grade}>
            <div className="card-head"><h2>Class {grade}</h2><span className="small muted">{list.length} assessments</span></div>
            <div className="table-wrap"><table className="data">
              <thead><tr><th>Assessment</th><th>Covers</th><th className="num">Questions</th><th className="num">Time</th><th /></tr></thead>
              <tbody>{list.map(a => (
                <tr key={a.id}><td><b>{a.title}</b></td><td className="muted small">{a.summary}</td><td className="num">{a.questions.length}</td><td className="num">{a.minutes} min</td>
                  <td className="num"><Link className="btn small" href={`/assessments/${a.id}`}>Preview</Link></td></tr>
              ))}</tbody>
            </table></div>
          </section>
        ))}
      </div>
    </Shell>
  );
}
