import type { Metadata } from 'next';
import PlayMap from '@/components/play/PlayMap';
import { getCurrentUser } from '@/lib/auth';
import { getSection, lessonProgressOf } from '@/lib/data';
import { ALL_PLAY_IDS, CHAPTERS, TRACKS, playLevel } from '@/data/play';
import type { MapChapter, TrackId } from '@/components/play/types';

export const metadata: Metadata = { title: 'Play', description: 'Code Vinc the robot through Junior picture-block worlds and typed-code Adventures. Free to play.' };

/** The world map. Open to everyone: guests keep progress in their browser, students in their account. */
export default async function PlayPage({ searchParams }: { searchParams: Promise<{ track?: string }> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  let stars: Record<string, number> | null = null, grade: number | undefined;
  if (user?.role === 'student') {
    const prog = lessonProgressOf(user.id);
    stars = {};
    for (const id of ALL_PLAY_IDS) { const p = prog.get(id); if (p?.passed_at) stars[id] = Math.max(1, p.stars); }
    grade = user.sectionId ? getSection(user.sectionId)?.grade : undefined;
  }
  const chapters: MapChapter[] = CHAPTERS.map(c => ({
    key: c.key, track: c.track, title: c.title, idea: c.idea, tutor: c.tutor, theme: c.theme,
    levels: c.levels.map(id => {
      const p = playLevel(id)!;
      return p.kind === 'adventure'
        ? { id, n: p.index + 1, title: p.level.title.replace(/^Boss: /, ''), boss: p.level.boss, debug: p.level.debug }
        : { id, n: p.index + 1, title: p.lesson.title.replace(/^Boss: /, ''), boss: p.lesson.type === 'Boss', debug: p.lesson.type === 'Catch Glitch' };
    }),
    ...(c.grade ? { grade: c.grade } : {})
  }));
  const track: TrackId = sp.track === 'adventure' || sp.track === 'junior' || sp.track === 'python' ? sp.track : grade && grade >= 5 ? 'python' : 'junior';
  return <PlayMap chapters={chapters} tracks={TRACKS} serverStars={stars} user={user ? { name: user.name, role: user.role } : null} initialTrack={track} grade={grade ?? null} />;
}
