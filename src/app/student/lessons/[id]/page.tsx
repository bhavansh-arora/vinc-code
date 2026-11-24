import { notFound, redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { lessonById } from '@/data/lessons';

/** Lessons are played in the game now (Junior for Classes 3–4, Python Quest for 5–8). Old links keep working. */
export default async function StudentLesson({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('student');
  const lesson = lessonById((await params).id);
  if (!lesson) notFound();
  redirect(`/play/${lesson.id}`);
}
