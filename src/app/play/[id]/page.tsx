import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import GameJunior from '@/components/play/GameJunior';
import GameAdventure from '@/components/play/GameAdventure';
import GamePython from '@/components/play/GamePython';
import { getCurrentUser } from '@/lib/auth';
import { getSection, lessonProgressOf } from '@/lib/data';
import { chaptersOf, nextLevel, playLevel, unlocked } from '@/data/play';
import { totalXp } from '@/lib/xp';
import type { GameLevel } from '@/components/play/types';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = playLevel((await params).id);
  return { title: p ? (p.kind === 'adventure' ? p.level.title : p.lesson.title) : 'Play' };
}

export default async function LevelPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const p = playLevel(id);
  if (!p) notFound();
  const user = await getCurrentUser();
  const staff = !!user && ['admin', 'school', 'teacher'].includes(user.role);
  let saved: { code: string | null; stars: number } | null = null, xp = 0;
  if (user?.role === 'student') {
    const prog = lessonProgressOf(user.id);
    const done = new Set([...prog.values()].filter(r => r.passed_at).map(r => r.lesson_id));
    const grade = user.sectionId ? getSection(user.sectionId)?.grade : undefined;
    if (!unlocked(done, grade).open.has(id)) redirect('/play?track=' + p.chapter.track);
    const row = prog.get(id);
    if (row) saved = { code: row.code, stars: row.passed_at ? Math.max(1, row.stars) : 0 };
    xp = totalXp([...prog.values()].map(r => [r.lesson_id, r.stars] as [string, number]));
  }
  const list = chaptersOf(p.chapter.track);
  const base = {
    id, track: p.chapter.track, theme: p.chapter.theme, chapterKey: p.chapter.key, chapterTitle: p.chapter.title,
    chapterNo: list.indexOf(p.chapter) + 1, levelNo: p.index + 1, levelCount: p.chapter.levels.length, next: nextLevel(id), par: p.par,
    trackChapters: list.map(c => ({ key: c.key, levels: c.levels }))
  };
  let level: GameLevel;
  if (p.kind === 'junior') {
    const l = p.lesson;
    if (l.check.kind !== 'blocks') notFound();
    level = {
      ...base, kind: 'junior', title: l.title, tutor: l.guide ?? (l.type === 'Catch Glitch' ? 'glitch' : p.chapter.tutor), intro: l.intro, task: l.task,
      hints: l.hints, maps: l.check.maps, require: l.check.require, starter: l.starter, palette: l.palette ?? ['step', 'turnLeft', 'turnRight'],
      xpType: l.type, boss: l.type === 'Boss', debug: l.type === 'Catch Glitch', ...(staff ? { solution: l.solution } : {})
    };
  } else if (p.kind === 'python') {
    const l = p.lesson, { solution: _s, ...pub } = l; void _s;
    level = {
      ...base, kind: 'python', title: l.title, tutor: l.guide ?? (l.type === 'Catch Glitch' ? 'glitch' : p.chapter.tutor), intro: l.intro, explain: l.explain, example: l.example,
      task: l.task, hints: l.hints, maps: l.check.kind === 'vinc' ? l.check.maps : [], check: pub.check, starter: l.starter, grade: l.grade, free: true,
      xpType: l.type, boss: l.type === 'Boss', debug: l.type === 'Catch Glitch', ...(staff ? { solution: l.solution } : {})
    };
  } else {
    const l = p.level;
    level = {
      ...base, kind: 'adventure', title: l.title, tutor: l.tutor, say: l.say, goal: l.goal, chapter: l.chapter, hints: l.hints, maps: l.check.maps,
      require: l.check.require, starter: l.starter, xpType: l.boss ? 'Boss' : l.debug ? 'Catch Glitch' : 'Puzzle', boss: l.boss, debug: l.debug,
      ...(staff ? { solution: l.solution } : {})
    };
  }
  const u = user ? { name: user.name, role: user.role } : null;
  if (level.kind === 'junior') return <GameJunior key={id} level={level} user={u} saved={saved} xp={xp} />;
  if (level.kind === 'python') return <GamePython key={id} level={level} user={u} saved={saved} xp={xp} />;
  return <GameAdventure key={id} level={level} user={u} saved={saved} xp={xp} />;
}
