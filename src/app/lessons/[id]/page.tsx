import { notFound } from 'next/navigation';
import Shell from '@/components/Shell';
import LessonPlayer from '@/components/lessons/LessonPlayer';
import { requireRole } from '@/lib/auth';
import { LESSONS, lessonById, parOf } from '@/data/lessons';

export default async function StaffLesson({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole('admin', 'school', 'teacher');
  const lesson = lessonById((await params).id);
  if (!lesson) notFound();
  const nx = LESSONS.find(l => l.grade === lesson.grade && l.n === lesson.n + 1);
  return (
    <Shell user={user}>
      <div className="alert info" style={{ marginBottom: 16 }}>Teacher preview: your runs are not saved, and you can load the model solution.</div>
      <LessonPlayer lesson={{ ...lesson, par: parOf(lesson) }} mode="preview" next={nx ? { href: `/lessons/${nx.id}`, title: nx.title } : null} back="/lessons" />
    </Shell>
  );
}
