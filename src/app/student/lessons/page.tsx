import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { getSection } from '@/lib/data';

/** Lessons are played in the game now: Junior for Classes 3–4, Python Quest for Classes 5–8. */
export default async function StudentLessons() {
  const user = await requireRole('student');
  const grade = (user.sectionId ? getSection(user.sectionId)?.grade : undefined) ?? 3;
  redirect(grade <= 4 ? '/play?track=junior' : '/play?track=python');
}
