/** The playable game levels (see public/game). Classes 5 to 8 are planned but not built yet. */
export interface Level { id: string; world: number; name: string; debug?: boolean }

export const LEVELS: Level[] = [
  { id: "3-1", world: 3, name: "First steps" },
  { id: "3-2", world: 3, name: "Turn the corner" },
  { id: "3-3", world: 3, name: "Which way?" },
  { id: "3-4", world: 3, name: "Two sparks" },
  { id: "3-5", world: 3, name: "Glitch's trap", debug: true },
  { id: "3-6", world: 3, name: "Around the crate" },
  { id: "3-7", world: 3, name: "Crate maze" },
  { id: "3-8", world: 3, name: "There and back" },
  { id: "3-9", world: 3, name: "Big board" },
  { id: "3-10", world: 3, name: "Glitch counts wrong", debug: true },
  { id: "3-11", world: 3, name: "The long way round" },
  { id: "3-12", world: 3, name: "Corner tour" },
  { id: "3-13", world: 3, name: "Market lanes" },
  { id: "3-14", world: 3, name: "Four sparks" },
  { id: "3-15", world: 3, name: "Glitch's big mess", debug: true },
  { id: "4-1", world: 4, name: "Long hallway" },
  { id: "4-2", world: 4, name: "Tall tower" },
  { id: "4-3", world: 4, name: "Turn and go" },
  { id: "4-4", world: 4, name: "Staircase" },
  { id: "4-5", world: 4, name: "Glitch's loop", debug: true },
  { id: "4-6", world: 4, name: "Corner tour, again" },
  { id: "4-7", world: 4, name: "First jump" },
  { id: "4-8", world: 4, name: "Crate hurdles" },
  { id: "4-9", world: 4, name: "Hurdle stairs" },
  { id: "4-10", world: 4, name: "Glitch broke my legs", debug: true },
  { id: "4-11", world: 4, name: "Big square" },
  { id: "4-12", world: 4, name: "Down the stairs" },
  { id: "4-13", world: 4, name: "Jump around the corner" },
  { id: "4-14", world: 4, name: "Garden path" },
  { id: "4-15", world: 4, name: "Glitch's garden", debug: true }
];

export const LEVEL_IDS = new Set(LEVELS.map(l => l.id));
export const PLAYABLE_WORLDS = [3, 4];

/** Levels that count for a student in this class. Classes 5 to 8 practise on the Class 3 and 4 levels for now. */
export function levelsForGrade(grade: number): Level[] {
  return PLAYABLE_WORLDS.includes(grade) ? LEVELS.filter(l => l.world === grade) : LEVELS;
}
