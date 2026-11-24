import type { Metadata } from 'next';
import Shell from '@/components/Shell';
import LessonList from '@/components/lessons/LessonList';
import { requireRole } from '@/lib/auth';
import { LESSONS, LESSON_GRADES, lessonsForGrade } from '@/data/lessons';

export const metadata: Metadata = { title: 'Lessons' };

export default async function StaffLessons() {
  const user = await requireRole('admin', 'school', 'teacher');
  return (
    <Shell user={user}>
      <div className="stack">
        <div><div className="eyebrow">Classes 3 to 8</div><h1>Lessons</h1>
          <p className="muted">{LESSONS.length} lessons. Classes 3 and 4 snap blocks together; Classes 5 to 8 write real Python in the browser. Every lesson runs on a 3D board or checks the output.
            Open one to try it and see the model solution. Students see their own class and the classes before it, and earn stars and XP.</p></div>
        <section className="card play-callout">
          <div><div className="eyebrow">The game at /play</div><h2>Classes 3 and 4 play these lessons in the Junior game</h2>
            <p className="muted small">Classes 5 to 8 also get the Adventure game: 32 typed-code levels in four worlds. Progress shows on your class pages. You can play any level and see the answer.</p></div>
          <div className="row"><a className="btn primary" href="/play?track=junior">Junior game</a><a className="btn" href="/play?track=adventure">Adventure game</a></div>
        </section>
        {LESSON_GRADES.map(g => <LessonList key={g} grade={g} lessons={lessonsForGrade(g)} stars={new Map()} hrefFor={id => `/lessons/${id}`} staff />)}
      </div>
    </Shell>
  );
}
