import type { Metadata } from 'next';
import Shell from '@/components/Shell';
import LessonList from '@/components/lessons/LessonList';
import { requireRole } from '@/lib/auth';
import { LESSON_GRADES, lessonsForGrade } from '@/data/lessons';

export const metadata: Metadata = { title: 'Lessons' };

export default async function StaffLessons() {
  const user = await requireRole('admin', 'school', 'teacher');
  return (
    <Shell user={user}>
      <div className="stack">
        <div><div className="eyebrow">Classes 5 to 8</div><h1>Python lessons</h1>
          <p className="muted">48 lessons that run real Python in the browser. Open one to try it yourself and see the model solution. Students see the lessons for their own class and the classes before it.</p></div>
        {LESSON_GRADES.map(g => <LessonList key={g} grade={g} lessons={lessonsForGrade(g)} done={new Set()} hrefFor={id => `/lessons/${id}`} staff />)}
      </div>
    </Shell>
  );
}
