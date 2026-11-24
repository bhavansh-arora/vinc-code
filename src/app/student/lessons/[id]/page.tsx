import { notFound } from 'next/navigation';
import LessonPlayer from '@/components/lessons/LessonPlayer';
import { requireRole } from '@/lib/auth';
import { getSection, lessonProgressOf } from '@/lib/data';
import { LESSONS, lessonById, publicLesson } from '@/data/lessons';

export default async function StudentLesson({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole('student');
  const lesson = lessonById((await params).id);
  const grade = (user.sectionId ? getSection(user.sectionId)?.grade : undefined) ?? 3;
  if (!lesson || lesson.grade > grade) notFound();
  const p = lessonProgressOf(user.id).get(lesson.id);
  const nx = LESSONS.find(l => l.grade === lesson.grade && l.n === lesson.n + 1);
  return <LessonPlayer lesson={publicLesson(lesson)} mode="student" savedCode={p?.code} done={!!p?.passed_at}
    next={nx ? { href: `/student/lessons/${nx.id}`, title: nx.title } : null} back="/student/lessons" />;
}
