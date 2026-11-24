import type { CharId } from '@/lib/crew';
import type { BlockName, BlockRequire } from '@/lib/blocks';
import type { ScriptCheck } from '@/lib/vincscript';
import type { LessonType } from '@/lib/playcore';

export type TrackId = 'junior' | 'adventure';
export interface MapLevel { id: string; n: number; title: string; boss?: boolean; debug?: boolean }
export interface MapChapter { key: string; track: TrackId; title: string; idea: string; tutor: CharId; theme: string; levels: MapLevel[] }
export interface GameUser { name: string; role: string }

interface Base {
  id: string; track: TrackId; title: string; tutor: CharId; theme: string;
  chapterKey: string; chapterTitle: string; chapterNo: number; levelNo: number; levelCount: number;
  next: string | null; par: number; xpType: LessonType;
  /** This track's chapters, to work out locks for players who are not logged in. */
  trackChapters: { key: string; levels: string[] }[];
  hints: string[]; maps: string[][]; starter: string;
  /** Only sent to staff (teacher preview). */
  solution?: string;
  boss?: boolean; debug?: boolean;
}
export type GameLevel =
  | (Base & { kind: 'junior'; intro: string; task: string; palette: BlockName[]; require?: BlockRequire })
  | (Base & { kind: 'adventure'; say: string; goal: string; chapter: number; require?: ScriptCheck['require'] });
