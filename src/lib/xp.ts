/** Lesson XP and ranks. XP comes from the lesson type plus 5 per star (best stars per lesson). */
import { LESSONS, lessonXp } from '@/data/lessons';

export const RANKS = [
  { xp: 0, name: 'Spark Rookie', icon: '✦' },
  { xp: 100, name: 'Bolt Builder', icon: '🔩' },
  { xp: 250, name: 'Gear Master', icon: '⚙️' },
  { xp: 450, name: 'Circuit Hero', icon: '⚡' },
  { xp: 700, name: 'Code Captain', icon: '🧭' },
  { xp: 1000, name: 'Robot Engineer', icon: '🛠️' },
  { xp: 1400, name: 'Vinc Legend', icon: '🚀' }
];

export function rankOf(xp: number) {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1].xp) i++;
  const cur = RANKS[i], next = RANKS[i + 1] ?? null;
  return { ...cur, level: i + 1, next, progress: next ? (xp - cur.xp) / (next.xp - cur.xp) : 1 };
}

const TYPE = new Map(LESSONS.map(l => [l.id, l.type]));
/** Total XP from a student's best stars, keyed by lesson id. */
export function totalXp(stars: Iterable<[string, number]>) {
  let xp = 0;
  for (const [id, s] of stars) { const t = TYPE.get(id); if (t) xp += lessonXp(t, s); }
  return xp;
}
