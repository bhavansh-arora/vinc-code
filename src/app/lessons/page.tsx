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
        {LESSON_GRADES.map(g => <LessonList key={g} grade={g} lessons={lessonsForGrade(g)} stars={new Map()} hrefFor={id => `/lessons/${id}`} staff />)}
      </div>
    </Shell>
  );
}
