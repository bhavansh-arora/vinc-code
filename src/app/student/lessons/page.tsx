import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import LessonList from '@/components/lessons/LessonList';
import CrewArt from '@/components/CrewArt';
import { Bar } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { getSection, lessonProgressOf } from '@/lib/data';
import { LESSON_GRADES, lessonsForGrade } from '@/data/lessons';
import { crewFor } from '@/lib/crew';
import { RANKS, rankOf, totalXp } from '@/lib/xp';

export const metadata: Metadata = { title: 'Lessons' };

export default async function StudentLessons() {
  const user = await requireRole('student');
  const grade = (user.sectionId ? getSection(user.sectionId)?.grade : undefined) ?? 3;
  if (grade <= 4) redirect('/play?track=junior');
  const prog = lessonProgressOf(user.id);
  const stars = new Map([...prog.values()].filter(p => p.passed_at).map(p => [p.lesson_id, p.stars] as [string, number]));
  const xp = totalXp(stars), rank = rankOf(xp);
  const grades = LESSON_GRADES.filter(g => g >= 5 && g <= grade).sort((a, b) => b - a);
  const crew = crewFor(grade);
  return (
    <div className="stack">
      <section className="card ls-hero">
        <div className="stack" style={{ gap: 8 }}>
          <div className="eyebrow">{grade <= 4 ? 'Block lessons' : 'Python lessons'} with Vinc and the crew</div>
          <h1>Lessons</h1>
          <p className="muted">{grade <= 4 ? 'Snap blocks together to program Vinc, then press Run and watch it go in 3D.' : 'Each lesson explains one idea, then you write real Python. Press Run to check it.'} Earn stars and XP to climb the ranks.</p>
          <div className="xp-strip">
            <div className="xp-rank"><span className="xp-icon" aria-hidden="true">{rank.icon}</span><div><b>{rank.name}</b><span className="small muted">Level {rank.level} of {RANKS.length} · {xp} XP</span></div></div>
            <div className="xp-next"><Bar value={rank.progress * 100} /><span className="small muted">{rank.next ? `${rank.next.xp - xp} XP to ${rank.next.icon} ${rank.next.name}` : 'Top rank!'}</span></div>
          </div>
        </div>
        <div className="ls-crew" aria-label="Your crew">
          {crew.map((c, i) => <div key={c.id} className="ls-crew-m" style={{ animationDelay: i * 90 + 'ms' }}><CrewArt id={c.id} label={c.name} /><span>{c.name}</span></div>)}
        </div>
      </section>
      <section className="card play-callout">
        <div><div className="eyebrow">New · Adventure game</div><h2>Guide Vinc across four worlds with code</h2>
          <p className="muted small">32 levels with loops, sensors and functions. Your stars there count towards your XP too.</p></div>
        <Link className="btn primary" href="/play?track=adventure">▶ Play Adventure</Link>
      </section>
      {grades.map(g => <LessonList key={g} grade={g} lessons={lessonsForGrade(g)} stars={stars} hrefFor={id => `/student/lessons/${id}`} />)}
    </div>
  );
}
