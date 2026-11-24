import Link from 'next/link';
import { redirect } from 'next/navigation';
import VincArt from '@/components/VincArt';
import { getCurrentUser } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/types';

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);
  return (
    <main className="container">
      <section className="hero">
        <div className="stack">
          <div className="eyebrow">VINC Code · Classes 3 to 8</div>
          <h1>Learn to code with <em>Vinc</em>, the robot built from spare parts.</h1>
          <p className="muted" style={{ fontSize: '1.1rem', maxWidth: '56ch' }}>Kids write code to guide Vinc through puzzles and win its missing parts. Teachers see every student&apos;s progress, and class-wise assessments show what each class has learned.</p>
          <div className="row"><Link className="btn primary" href="/login">Sign in</Link><span className="small muted">Schools: contact VINC to set up your school.</span></div>
        </div>
        <VincArt label="Vinc the robot" />
      </section>
      <section className="grid-3">
        <div className="card"><h3>For students</h3><p className="muted small">Play 30 coding levels, win stars and sparks, and take short quizzes for your class.</p></div>
        <div className="card"><h3>For teachers</h3><p className="muted small">Add a class in a minute, print login cards, assign assessments and see results question by question.</p></div>
        <div className="card"><h3>For schools</h3><p className="muted small">Manage teachers and sections, and see how every class is doing at a glance.</p></div>
      </section>
    </main>
  );
}
