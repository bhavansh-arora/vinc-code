/** Small game rules shared by the server and the browser (kept apart from the big lesson files). */
export type LessonType = 'Learn' | 'Puzzle' | 'Catch Glitch' | 'Challenge' | 'Boss';
/** XP for a lesson type; stars add a bonus. */
export const TYPE_XP: Record<LessonType, number> = { Learn: 10, Puzzle: 15, 'Catch Glitch': 20, Challenge: 25, Boss: 40 };
export const lessonXp = (type: LessonType, stars: number) => (stars > 0 ? TYPE_XP[type] + 5 * stars : 0);

/** Stars for a passing run: at or under par = 3, within 2 = 2, otherwise 1. */
export const playStars = (size: number, par: number) => (size <= par ? 3 : size <= par + 2 ? 2 : 1);

/**
 * Which chapters and levels are open. `chapters` are one track's chapters in order.
 * A chapter opens when the one before it is finished; inside a chapter, levels open one by one.
 */
export function unlockedFrom(chapters: { key: string; levels: string[] }[], done: Set<string>) {
  const open = new Set<string>(), keys = new Set<string>();
  let prevDone = true;
  for (const ch of chapters) {
    if (!prevDone) break;
    keys.add(ch.key);
    for (const id of ch.levels) { open.add(id); if (!done.has(id)) break; }
    prevDone = ch.levels.every(l => done.has(l));
  }
  return { open, chapters: keys };
}
