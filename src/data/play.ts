/**
 * The /play world: two tracks of chapters.
 *  - Junior (Classes 3 and 4): the 24 block lessons, played with picture blocks.
 *  - Adventure (Classes 5 to 8): 32 typed VincScript levels (src/data/adventure.ts).
 * Chapters unlock in order: finish every level of one chapter to open the next.
 */
import { LESSONS, parOf, type Lesson } from './lessons';
import { ADVENTURE, ADV_CHAPTERS, type AdvLevel } from './adventure';
import { countLines } from '@/lib/vincscript';
import type { CharId } from '@/lib/crew';
import { unlockedFrom } from '@/lib/playcore';
export { playStars } from '@/lib/playcore';

export type Track = 'junior' | 'adventure' | 'python';
export type Theme = 'meadow' | 'orchard' | 'river' | 'hills' | 'beach' | 'lagoon' | 'jungle' | 'factory' | 'canyon' | 'bazaar' | 'kitchen' | 'space';
export interface Chapter { track: Track; key: string; title: string; idea: string; tutor: CharId; theme: Theme; levels: string[]; /** Python Quest: the class this world belongs to. */ grade?: number }

const junior = (g: number, from: number, to: number) => LESSONS.filter(l => l.grade === g && l.n >= from && l.n <= to).map(l => l.id);

export const CHAPTERS: Chapter[] = [
  { track: 'junior', key: 'j1', title: 'First Steps', idea: 'Steps and turns', tutor: 'pip', theme: 'meadow', levels: junior(3, 1, 6) },
  { track: 'junior', key: 'j2', title: 'Big Plans', idea: 'Planning and debugging', tutor: 'pip', theme: 'orchard', levels: junior(3, 7, 12) },
  { track: 'junior', key: 'j3', title: 'Loop Hill', idea: 'Repeat loops', tutor: 'loopa', theme: 'hills', levels: junior(4, 1, 6) },
  { track: 'junior', key: 'j4', title: 'Jumping River', idea: 'Jumps and nested loops', tutor: 'loopa', theme: 'river', levels: junior(4, 7, 12) },
  ...ADV_CHAPTERS.map(c => ({ track: 'adventure' as const, key: 'a' + c.n, title: c.title, idea: c.idea, tutor: c.tutor, theme: c.theme as Theme, levels: ADVENTURE.filter(l => l.chapter === c.n).map(l => l.id) })),
  { track: 'python', key: 'p5', grade: 5, title: 'Sensor Canyon', idea: 'Class 5 · if, else and while', tutor: 'hoot', theme: 'canyon', levels: junior(5, 1, 12) },
  { track: 'python', key: 'p6', grade: 6, title: 'Number Bazaar', idea: 'Class 6 · Variables and input', tutor: 'pocket', theme: 'bazaar', levels: junior(6, 1, 12) },
  { track: 'python', key: 'p7', grade: 7, title: "Tadka's Kitchen", idea: 'Class 7 · Functions', tutor: 'tadka', theme: 'kitchen', levels: junior(7, 1, 12) },
  { track: 'python', key: 'p8', grade: 8, title: 'Space Station', idea: 'Class 8 · Lists, events and AI', tutor: 'nova', theme: 'space', levels: junior(8, 1, 12) }
];

export const TRACKS: Record<Track, { title: string; who: string; blurb: string }> = {
  junior: { title: 'Junior', who: 'Classes 3 and 4', blurb: 'Drag picture blocks. No typing, no reading needed.' },
  adventure: { title: 'Adventure', who: 'Classes 5 to 8', blurb: 'Type real code to guide Vinc across four worlds.' },
  python: { title: 'Python Quest', who: 'Classes 5 to 8', blurb: 'Real Python, real adventures: one world for every class.' }
};

export type PlayLevel =
  | { kind: 'junior'; id: string; chapter: Chapter; index: number; lesson: Lesson; par: number }
  | { kind: 'adventure'; id: string; chapter: Chapter; index: number; level: AdvLevel; par: number }
  | { kind: 'python'; id: string; chapter: Chapter; index: number; lesson: Lesson; par: number };

const BY_ID = new Map<string, PlayLevel>();
for (const ch of CHAPTERS) ch.levels.forEach((id, index) => {
  if (ch.track === 'junior') { const lesson = LESSONS.find(l => l.id === id)!; BY_ID.set(id, { kind: 'junior', id, chapter: ch, index, lesson, par: parOf(lesson) }); }
  else if (ch.track === 'python') { const lesson = LESSONS.find(l => l.id === id)!; BY_ID.set(id, { kind: 'python', id, chapter: ch, index, lesson, par: 0 }); }
  else { const level = ADVENTURE.find(l => l.id === id)!; BY_ID.set(id, { kind: 'adventure', id, chapter: ch, index, level, par: countLines(level.solution) }); }
});

export const playLevel = (id: string) => BY_ID.get(id);
export const ALL_PLAY_IDS = [...BY_ID.keys()];
export const chaptersOf = (t: Track) => CHAPTERS.filter(c => c.track === t);

/** The level after this one (next in the chapter, else the first of the next chapter in the track). */
export function nextLevel(id: string): string | null {
  const p = BY_ID.get(id); if (!p) return null;
  const ch = p.chapter;
  if (p.index + 1 < ch.levels.length) return ch.levels[p.index + 1];
  const list = chaptersOf(ch.track), i = list.indexOf(ch);
  return list[i + 1]?.levels[0] ?? null;
}

/** Which chapters and levels are open, given the ids of finished levels. */
export function unlocked(done: Set<string>, grade?: number) {
  const open = new Set<string>(), chapters = new Set<string>();
  for (const t of ['junior', 'adventure', 'python'] as Track[]) {
    // Python Quest: every class's world is open (up to the student's own class); levels open one by one.
    const list = t === 'python' ? chaptersOf(t).filter(c => !grade || (c.grade ?? 0) <= grade) : chaptersOf(t);
    const u = unlockedFrom(list, done, t === 'python');
    u.open.forEach(x => open.add(x)); u.chapters.forEach(x => chapters.add(x));
  }
  return { open, chapters };
}
