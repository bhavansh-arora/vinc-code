/**
 * Story cutscenes (the game's intro "videos"), played by src/components/play/Cutscene.tsx.
 * Each scene is a world background, actors with entrance and action animations, a caption read aloud, and effects.
 */
import type { CharId } from '@/lib/crew';

export type Prop = 'rocket' | 'part' | 'crate' | 'spark' | 'chest' | 'map';
export interface Actor {
  who: CharId | Prop; x: number; y?: number; size?: number;
  enter?: 'left' | 'right' | 'drop' | 'pop' | 'rise';
  act?: 'walk' | 'hop' | 'dance' | 'shake' | 'spin' | 'float' | 'sneak' | 'laugh' | 'wave' | 'flyaway' | 'launch' | 'bounce';
  flip?: boolean; delay?: number;
}
export interface Scene { bg: string; caption: string; speaker?: CharId; actors: Actor[]; fx?: 'storm' | 'sparkles' | 'night' | 'zoom' | 'shake'; dur: number }
export interface Story { id: string; title: string; music: string; scenes: Scene[] }

const CREW_ROW: CharId[] = ['pip', 'loopa', 'hoot', 'pocket', 'tadka', 'nova'];

export const PROLOGUE: Story = {
  id: 'prologue', title: 'The Spare-Part Robot', music: 'story',
  scenes: [
    { bg: 'meadow', dur: 7, fx: 'sparkles', caption: 'This is Vinc, a little robot built from spare parts at VINC Lab.', speaker: 'vinc',
      actors: [{ who: 'vinc', x: 50, size: 190, enter: 'drop', act: 'wave' }, { who: 'spark', x: 22, y: 50, size: 40, act: 'float' }, { who: 'spark', x: 78, y: 58, size: 34, act: 'float', delay: .6 }] },
    { bg: 'meadow', dur: 7, caption: 'Vinc had one big dream: to build a rocket and fly to the stars!', speaker: 'vinc',
      actors: [{ who: 'vinc', x: 30, size: 150, act: 'hop' }, { who: 'rocket', x: 68, size: 200, enter: 'rise', act: 'float' }] },
    { bg: 'jungle', dur: 7.5, fx: 'storm', caption: 'But one stormy night, Glitch the beetle sneaked in and scattered the rocket parts everywhere!', speaker: 'glitch',
      actors: [{ who: 'glitch', x: 30, size: 150, enter: 'left', act: 'laugh' }, { who: 'part', x: 60, y: 30, size: 50, act: 'flyaway' }, { who: 'part', x: 70, y: 40, size: 44, act: 'flyaway', delay: .4 }, { who: 'part', x: 80, y: 28, size: 40, act: 'flyaway', delay: .8 }] },
    { bg: 'hills', dur: 8, caption: 'Luckily, Vinc has friends, and each one knows a coding superpower.',
      actors: [{ who: 'vinc', x: 50, y: 22, size: 110, act: 'bounce' }, ...CREW_ROW.map((c, i) => ({ who: c, x: 10 + i * 16 + (i > 2 ? 4 : 0), y: 4, size: 96, enter: 'pop' as const, act: 'hop' as const, delay: .3 + i * .35 }))] },
    { bg: 'beach', dur: 7, fx: 'zoom', caption: 'Your code tells Vinc where to go. Every world you solve wins back a part.', speaker: 'pocket',
      actors: [{ who: 'map', x: 50, y: 18, size: 230, enter: 'pop' }, { who: 'vinc', x: 18, size: 120, act: 'walk', enter: 'left' }, { who: 'pocket', x: 84, size: 120, act: 'wave' }] },
    { bg: 'space', dur: 8, fx: 'sparkles', caption: 'Can you help Vinc build the rocket and fly to the stars? Let’s code!', speaker: 'vinc',
      actors: [{ who: 'rocket', x: 50, size: 220, act: 'launch' }, { who: 'nova', x: 18, size: 110, act: 'dance' }, { who: 'glitch', x: 84, size: 90, act: 'shake' }] }
  ]
};

const chapter = (id: string, title: string, bg: string, tutor: CharId, lines: [string, string, string], prop: Prop = 'spark'): Story => ({
  id, title, music: bg,
  scenes: [
    { bg, dur: 6.5, caption: lines[0], speaker: tutor, actors: [{ who: tutor, x: 58, size: 170, enter: 'right', act: 'wave' }, { who: 'vinc', x: 26, size: 130, enter: 'left', act: 'hop', delay: .4 }] },
    { bg, dur: 6.5, fx: 'night', caption: lines[1], speaker: 'glitch', actors: [{ who: 'glitch', x: 40, size: 140, enter: 'left', act: 'sneak' }, { who: prop, x: 70, y: 18, size: 60, act: 'float' }, { who: 'crate', x: 82, size: 70, enter: 'drop', delay: .8 }] },
    { bg, dur: 6.5, fx: 'sparkles', caption: lines[2], speaker: tutor, actors: [{ who: 'vinc', x: 38, size: 140, act: 'dance' }, { who: tutor, x: 66, size: 140, act: 'hop' }] }
  ]
});

export const CHAPTER_STORIES: Record<string, Story> = {
  j1: chapter('j1', 'First Steps', 'meadow', 'pip', ['Bzzz! I am Pip. My light shows Vinc the way, one square at a time.', 'Hee hee! I hid the sparks around the meadow. Vinc only moves when you tell it!', 'Put the steps in the right order, and Vinc will find every spark. Let’s go!']),
  j2: chapter('j2', 'Big Plans', 'orchard', 'pip', ['Welcome to the orchard! Here we plan longer paths.', 'I left crates all over the place, and some bugs in your programs too. Hee hee!', 'Plan the path, test it, and squash the bugs!']),
  j3: chapter('j3', 'Loop Hill', 'hills', 'loopa', ['Hello, I am Loopa! I go round and round and never get dizzy.', 'Hee hee! These hills are SO long. Too many blocks for you!', 'Use a repeat block to do the same thing again and again. Loopy!']),
  j4: chapter('j4', 'Jumping River', 'river', 'loopa', ['The river is full of crates! Vinc has new spring legs.', 'I piled crates everywhere. Vinc can never get across! Hee hee!', 'Jump over the crates, and use loops inside loops for big patterns!'], 'part'),
  a1: chapter('a1', 'Spark Island', 'beach', 'pocket', ['Welcome to Spark Island! I am Pocket, and I count everything.', 'I buried the sparks in the sand. Can you guess how far away they are? Hee hee!', 'Type step with a number and use the ruler to measure. Real code starts here!']),
  a2: chapter('a2', 'Loop Lagoon', 'lagoon', 'loopa', ['The lagoon has long, repeating paths. Perfect for loops!', 'I made the paths extra long so your code gets tired. Hee hee!', 'A for loop repeats lines for you. Short code, big moves!']),
  a3: chapter('a3', 'Sensor Jungle', 'jungle', 'hoot', ['Hoo! I am Hoot. In the jungle, nothing stays the same.', 'I keep moving the crates around. Your code cannot know where they are! Hee hee!', 'Vinc’s sensors can ask questions. Use if, else and while to decide!'], 'part'),
  a4: chapter('a4', 'Function Factory', 'factory', 'tadka', ['Namaste! I am Chef Tadka. In my factory, every move is a recipe.', 'I mixed up the recipes. Now everything comes out wrong! Hee hee!', 'Write a function once with def, and cook it again and again!'], 'part'),
  p5: chapter('p5', 'Sensor Canyon', 'canyon', 'hoot', ['Welcome to Sensor Canyon! Today you write real Python.', 'The canyon is full of twists, and I filled it with crates! Hee hee!', 'Use if, else and while so one program works on every path!']),
  p6: chapter('p6', 'Number Bazaar', 'bazaar', 'pocket', ['Welcome to the bazaar! Everything here is counted and stored.', 'I mixed up all the prices and labels! Hee hee!', 'Variables are labelled boxes. Store numbers, count, and print the answers!'], 'chest'),
  p7: chapter('p7', 'Tadka’s Kitchen', 'kitchen', 'tadka', ['Welcome to my kitchen! Here, functions are recipes.', 'I swapped the salt for sugar in every recipe! Hee hee!', 'Write a function with def, give it ingredients, and return the dish!'], 'chest'),
  p8: chapter('p8', 'Space Station', 'space', 'nova', ['I am Nova. On my space station, robots learn from data.', 'I scrambled the training data! Now the AI is confused. Hee hee!', 'Lists, events and a little AI. Let’s get Vinc ready for launch!'], 'rocket')
};
