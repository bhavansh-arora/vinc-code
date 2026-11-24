import Link from 'next/link';
import type { Metadata } from 'next';
import LessonList from '@/components/lessons/LessonList';
import { Empty } from '@/components/ui';
import { requireRole } from '@/lib/auth';
import { getSection, lessonProgressOf } from '@/lib/data';
import { LESSON_GRADES, lessonsForGrade } from '@/data/lessons';

export const metadata: Metadata = { title: 'Lessons' };

export default async function StudentLessons() {
  const user = await requireRole('student');
  const grade = (user.sectionId ? getSection(user.sectionId)?.grade : undefined) ?? 3;
  const prog = lessonProgressOf(user.id);
  const done = new Set([...prog.values()].filter(p => p.passed_at).map(p => p.lesson_id));
  const grades = LESSON_GRADES.filter(g => g <= grade).sort((a, b) => b - a);
  return (
    <div className="stack">
      <div><div className="eyebrow">Python lessons with Vinc</div><h1>Lessons</h1>
        <p className="muted">Each lesson explains one idea, then you write real Python to solve a task. Press Run to check it.</p></div>
      {grades.length ? grades.map(g => <LessonList key={g} grade={g} lessons={lessonsForGrade(g)} done={done} hrefFor={id => `/student/lessons/${id}`} />)
        : <Empty>Python lessons start in Class 5. Until then, keep coding with Vinc in the <Link href="/game">game</Link>!</Empty>}
    </div>
  );
}
