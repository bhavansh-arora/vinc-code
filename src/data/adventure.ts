/**
 * The Adventure game (Classes 5 to 8): Vinc is moved with typed VincScript (src/lib/vincscript.ts).
 * 4 chapters × 8 levels. `npm run check:lessons` proves every solution passes with 3 stars and every starter fails.
 * Board symbols: "." floor, "#" crate, "*" spark, ^ > v < Vinc.
 */
import type { CharId } from '@/lib/crew';
import type { ScriptCheck } from '@/lib/vincscript';

export interface AdvLevel {
  id: string; chapter: number; n: number; title: string; tutor: CharId;
  /** What the tutor says (also read aloud). */
  say: string;
  goal: string;
  starter: string; solution: string;
  hints: string[];
  check: ScriptCheck;
  boss?: boolean; debug?: boolean;
}

const A = (chapter: number, n: number, l: Omit<AdvLevel, 'id' | 'chapter' | 'n'>): AdvLevel => ({ id: `adv-${chapter}-${n}`, chapter, n, ...l });

export const ADVENTURE: AdvLevel[] = [
  /* ---------------- Chapter 1 · Spark Island: steps and turns ---------------- */
  A(1, 1, {
    title: 'Step by step', tutor: 'pocket',
    say: 'Welcome to Spark Island! I am Pocket. Type a number inside step to tell Vinc how far to go. Then press Run!',
    goal: 'Change the number so Vinc reaches the spark.',
    starter: 'step(2)\n', solution: 'step(6)\n',
    hints: ['Count the squares between Vinc and the spark.', 'The spark is 6 squares away: step(6)'],
    check: { kind: 'script', maps: [['.......', '>.....*', '.......']] }
  }),
  A(1, 2, {
    title: 'Measure it', tutor: 'pocket',
    say: 'Not sure how far? Use the ruler! Tap the ruler, then tap any square, and I will count the squares for you.',
    goal: 'Use the ruler to measure, then reach the spark.',
    starter: 'step(1)\n', solution: 'step(7)\n',
    hints: ['Tap the ruler button, then tap the spark.'],
    check: { kind: 'script', maps: [['........', '........', '>......*', '........']] }
  }),
  A(1, 3, {
    title: 'Turn left', tutor: 'pocket',
    say: 'turn_left() turns Vinc on the spot. It does not move. Use it to face the spark, then step again.',
    goal: 'Go along the bottom, turn left, and go up to the spark.',
    starter: 'step(5)\n', solution: 'step(5)\nturn_left()\nstep(2)\n',
    hints: ['After step(5), Vinc is under the spark.', 'turn_left() then step(2)'],
    check: { kind: 'script', maps: [['.....*', '......', '>.....']] }
  }),
  A(1, 4, {
    title: 'Turn right', tutor: 'pocket',
    say: 'A crate! Vinc bumps into crates. Stop before it, turn right, and go down.',
    goal: 'Stop before the crate, turn right and reach the spark.',
    starter: 'step(4)\n', solution: 'step(3)\nturn_right()\nstep(2)\n',
    hints: ['Only 3 steps fit before the crate.', 'step(3), turn_right(), step(2)'],
    check: { kind: 'script', maps: [['>...#', '.....', '...*.']] }
  }),
  A(1, 5, {
    title: 'Zig zag', tutor: 'pocket',
    say: 'Two sparks, two turns. Plan the path first, one line for each move or turn.',
    goal: 'Collect both sparks.',
    starter: 'step(1)\nturn_right()\n', solution: 'step(1)\nturn_right()\nstep(2)\nturn_left()\nstep(3)\n',
    hints: ['From the first square, go down 2.', 'Then turn left and go 3 squares.'],
    check: { kind: 'script', maps: [['>.#....', '.......', '.*..*..']] }
  }),
  A(1, 6, {
    title: "Glitch's wrong number", tutor: 'glitch', debug: true,
    say: 'Hee hee! I changed one number, and now Vinc crashes. Can you find my bug?',
    goal: 'Fix the number so Vinc reaches the spark.',
    starter: 'step(4)\nturn_right()\nstep(2)\n', solution: 'step(3)\nturn_right()\nstep(2)\n',
    hints: ['Run it and watch where Vinc bumps.', 'Line 1 goes one square too far.'],
    check: { kind: 'script', maps: [['>...#.', '......', '...*..']] }
  }),
  A(1, 7, {
    title: 'Turn around', tutor: 'pocket',
    say: 'There are sparks on both sides of Vinc! Two left turns make Vinc face the other way.',
    goal: 'Collect the spark on the left, turn around, and collect the one on the right.',
    starter: 'step(4)\n', solution: 'step(4)\nturn_left()\nturn_left()\nstep(8)\n',
    hints: ['Two turn_left() make a U-turn.', 'Then step(8) to the far spark.'],
    check: { kind: 'script', maps: [['.........', '*...<...*', '.........']] }
  }),
  A(1, 8, {
    title: 'Boss: Treasure trail', tutor: 'pocket', boss: true,
    say: 'Three sparks hide among the crates. Use the ruler, plan every turn, and bring them all home!',
    goal: 'Collect all three sparks.',
    starter: 'step(2)\nturn_right()\n',
    solution: 'step(2)\nturn_right()\nstep(2)\nturn_left()\nstep(3)\nturn_right()\nstep(2)\nturn_right()\nstep(1)\n',
    hints: ['Go down to the first spark, then right to the second.', 'From the second spark go down 2, turn right and take one step.'],
    check: { kind: 'script', maps: [['>..#..', '...#..', '..*..*', '......', '#...*.', '..#...']] }
  }),

  /* ---------------- Chapter 2 · Loop Lagoon: for loops ---------------- */
  A(2, 1, {
    title: 'Again and again', tutor: 'loopa',
    say: 'Hello again, it is Loopa! A for loop repeats the lines under it. range(6) means 6 times. Lines inside the loop start with 4 spaces.',
    goal: 'Reach the spark with a for loop.',
    starter: 'step()\nstep()\n', solution: 'for i in range(6):\n    step()\n',
    hints: ['for i in range(6):', 'Put step() on the next line, moved in by 4 spaces.'],
    check: { kind: 'script', maps: [['.......', '>.....*', '.......']], require: { uses: ['for'] } }
  }),
  A(2, 2, {
    title: 'Square swim', tutor: 'loopa',
    say: 'A square has 4 sides that are all the same. Loop one side 4 times!',
    goal: 'Go round the square to collect the corner sparks, in 3 lines or fewer.',
    starter: 'step(3)\nturn_right()\n', solution: 'for i in range(4):\n    step(3)\n    turn_right()\n',
    hints: ['Put both lines inside for i in range(4):'],
    check: { kind: 'script', maps: [['>..*', '....', '....', '*..*']], require: { uses: ['for'], maxLines: 3 } }
  }),
  A(2, 3, {
    title: 'Stair climb', tutor: 'loopa',
    say: 'Step, turn, step, turn. Find the pattern of one stair, then loop it.',
    goal: 'Climb all four stairs in 5 lines or fewer.',
    starter: 'step()\nturn_left()\nstep()\nturn_right()\n', solution: 'for i in range(4):\n    step()\n    turn_left()\n    step()\n    turn_right()\n',
    hints: ['The starter is one stair.', 'Loop it 4 times.'],
    check: { kind: 'script', maps: [['....*', '...*.', '..*..', '.*...', '>....']], require: { uses: ['for'], maxLines: 5 } }
  }),
  A(2, 4, {
    title: 'Spark fence', tutor: 'loopa',
    say: 'The sparks are 2 squares apart. You can loop step(2)!',
    goal: 'Collect all four sparks in 2 lines.',
    starter: 'step(2)\n', solution: 'for i in range(4):\n    step(2)\n',
    hints: ['for i in range(4): then step(2) inside.'],
    check: { kind: 'script', maps: [['.........', '>.*.*.*.*', '.........']], require: { uses: ['for'], maxLines: 2 } }
  }),
  A(2, 5, {
    title: "Glitch's loop", tutor: 'glitch', debug: true,
    say: 'I made the loop run one time too many. Splash! Vinc goes off the edge. Hee hee!',
    goal: 'Fix the loop so Vinc stops on the last spark.',
    starter: 'for i in range(4):\n    step(3)\n', solution: 'for i in range(3):\n    step(3)\n',
    hints: ['How many sparks are there?'],
    check: { kind: 'script', maps: [['..........', '>..*..*..*']], require: { uses: ['for'] } }
  }),
  A(2, 6, {
    title: 'Hurdle loop', tutor: 'loopa',
    say: 'jump() hops over one crate and lands 2 squares ahead. Loop the jumps!',
    goal: 'Jump all three crates with a loop.',
    starter: 'for i in range(3):\n    step(2)\n', solution: 'for i in range(3):\n    jump()\n',
    hints: ['step bumps into crates. Use jump() instead.'],
    check: { kind: 'script', maps: [['.......', '>#*#*#*']], require: { uses: ['for', 'jump'] } }
  }),
  A(2, 7, {
    title: 'Loop in a loop', tutor: 'loopa',
    say: 'Put a loop inside a loop! The inside loop walks one side, the outside loop does all 4 sides.',
    goal: 'Go round the big square with a loop inside a loop, in 4 lines or fewer.',
    starter: 'for i in range(4):\n    step()\n',
    solution: 'for side in range(4):\n    for i in range(4):\n        step()\n    turn_right()\n',
    hints: ['The inside loop needs 8 spaces in front of step().', 'turn_right() lines up with the inside for.'],
    check: { kind: 'script', maps: [['>.*.*', '.....', '*...*', '.....', '*.*.*']], require: { uses: ['for'], maxLines: 4 } }
  }),
  A(2, 8, {
    title: 'Boss: Snake garden', tutor: 'loopa', boss: true,
    say: 'The whole garden is full of sparks! Snake left and right, row by row. One loop round does two rows.',
    goal: 'Collect every spark, in 11 lines or fewer.',
    starter: 'step(4)\nturn_right()\n',
    solution: 'for i in range(2):\n    step(4)\n    turn_right()\n    step()\n    turn_right()\n    step(4)\n    turn_left()\n    step()\n    turn_left()\nstep(4)\n',
    hints: ['Right along a row, down one, left along the next row, down one.', 'After the loop, one more row is left: step(4).'],
    check: { kind: 'script', maps: [['>****', '*****', '*****', '*****', '*****']], require: { uses: ['for'], maxLines: 11 } }
  }),

  /* ---------------- Chapter 3 · Sensor Jungle: if, else and while ---------------- */
  A(3, 1, {
    title: 'Until the spark', tutor: 'hoot',
    say: 'Hoo! I am Hoot. These paths change length. A while loop keeps going until Vinc is at the spark.',
    goal: 'One program must work on all three boards.',
    starter: 'step(3)\n', solution: 'while not at_spark():\n    step()\n',
    hints: ['while not at_spark():', 'Put step() inside the loop.'],
    check: { kind: 'script', maps: [['>..*'], ['>......*'], ['>.....*']], require: { uses: ['while'] } }
  }),
  A(3, 2, {
    title: 'Look before you leap', tutor: 'hoot',
    say: 'Ask a question with if. If there is a crate ahead, jump. Otherwise, step.',
    goal: 'Get past the crates on both boards.',
    starter: 'while not at_spark():\n    step()\n',
    solution: 'while not at_spark():\n    if crate_ahead():\n        jump()\n    else:\n        step()\n',
    hints: ['Inside the loop: if crate_ahead(): jump()', 'else: step(). Lines under if and else need 8 spaces.'],
    check: { kind: 'script', maps: [['>.#..#.*'], ['>#..#..*']], require: { uses: ['while', 'if'] } }
  }),
  A(3, 3, {
    title: 'Turn at the wall', tutor: 'hoot',
    say: 'blocked() is True when a crate or the edge is in front of Vinc. Then turn right!',
    goal: 'One program for all three boards.',
    starter: 'while not at_spark():\n    step()\n',
    solution: 'while not at_spark():\n    if blocked():\n        turn_right()\n    else:\n        step()\n',
    hints: ['if blocked(): turn_right()', 'else: step()'],
    check: { kind: 'script', maps: [['>..', '...', '..*'], ['>....#', '......', '....*.'], ['>.#', '...', '.*.']], require: { uses: ['while', 'if'] } }
  }),
  A(3, 4, {
    title: "Glitch's upside-down loop", tutor: 'glitch', debug: true,
    say: 'I took one little word out of the loop, and now Vinc will not move at all! Hee hee!',
    goal: 'Fix the condition so Vinc walks to the spark.',
    starter: 'while at_spark():\n    step()\n', solution: 'while not at_spark():\n    step()\n',
    hints: ['Vinc is not at a spark at the start, so the loop never runs.', 'Put not back in.'],
    check: { kind: 'script', maps: [['>....*'], ['>..*']], require: { uses: ['while'] } }
  }),
  A(3, 5, {
    title: 'Spark counter', tutor: 'hoot',
    say: 'sparks_left() counts the sparks that are still on the board. Keep going while it is more than 0.',
    goal: 'Stop right after the last spark, on both boards.',
    starter: 'step(5)\n', solution: 'while sparks_left() > 0:\n    step()\n',
    hints: ['while sparks_left() > 0:'],
    check: { kind: 'script', maps: [['>.*..*.*..'], ['>*.*....']], require: { uses: ['while'] } }
  }),
  A(3, 6, {
    title: 'Spiral path', tutor: 'hoot',
    say: 'A winding path! Walk until blocked, then turn right. Keep going while there are sparks left.',
    goal: 'Follow the path and collect both sparks.',
    starter: 'while sparks_left() > 0:\n    step()\n',
    solution: 'while sparks_left() > 0:\n    if blocked():\n        turn_right()\n    else:\n        step()\n',
    hints: ['Add an if inside the loop: if blocked(): turn_right()'],
    check: { kind: 'script', maps: [['>....', '####.', '...*.', '.###.', '..*..']], require: { uses: ['while', 'if'] } }
  }),
  A(3, 7, {
    title: 'Crate or edge?', tutor: 'hoot',
    say: 'Three choices now! If a crate is ahead, jump. Else if blocked, turn right. Else, step. That is elif!',
    goal: 'Collect all three sparks.',
    starter: 'while sparks_left() > 0:\n    if blocked():\n        turn_right()\n    else:\n        step()\n',
    solution: 'while sparks_left() > 0:\n    if crate_ahead():\n        jump()\n    elif blocked():\n        turn_right()\n    else:\n        step()\n',
    hints: ['Check crate_ahead() first, before blocked().', 'if crate_ahead(): jump() then elif blocked(): turn_right()'],
    check: { kind: 'script', maps: [['>.#*.', '.....', '....#', '....*', '*.#..']], require: { uses: ['while', 'if'] } }
  }),
  A(3, 8, {
    title: 'Boss: Jungle run', tutor: 'hoot', boss: true,
    say: 'Two jungle paths, one program. Your code has to decide everything by itself!',
    goal: 'Write one program that collects every spark on both boards.',
    starter: 'while sparks_left() > 0:\n    step()\n',
    solution: 'while sparks_left() > 0:\n    if crate_ahead():\n        jump()\n    elif blocked():\n        turn_right()\n    else:\n        step()\n',
    hints: ['The rule from the last level works here too.'],
    check: { kind: 'script', maps: [['>.#*.', '.....', '....#', '....*', '*.#..'], ['>#*..', '....#', '....*', '*....', '..#..']], require: { uses: ['while', 'if'] } }
  }),

  /* ---------------- Chapter 4 · Function Factory: def ---------------- */
  A(4, 1, {
    title: 'Fix the recipe', tutor: 'tadka',
    say: 'Namaste! I am Chef Tadka. def writes a recipe once, then you cook it by its name. But this turn_around recipe only turns once!',
    goal: 'Fix turn_around() so Vinc collects both sparks.',
    starter: 'def turn_around():\n    turn_left()\n\nstep(3)\nturn_around()\nstep(6)\n',
    solution: 'def turn_around():\n    turn_left()\n    turn_left()\n\nstep(3)\nturn_around()\nstep(6)\n',
    hints: ['A U-turn is two left turns.', 'Add a second turn_left() inside the def.'],
    check: { kind: 'script', maps: [['.......', '*..<..*', '.......']], require: { uses: ['def'] } }
  }),
  A(4, 2, {
    title: 'Stair recipe', tutor: 'tadka',
    say: 'Write a stair() recipe: step, turn left, step, turn right. Then cook it three times!',
    goal: 'Make stair() and use it to climb all three stairs.',
    starter: 'def stair():\n    step()\n\n',
    solution: 'def stair():\n    step()\n    turn_left()\n    step()\n    turn_right()\n\nfor i in range(3):\n    stair()\n',
    hints: ['Finish the recipe with turn_left(), step(), turn_right().', 'Call it with stair() three times, or in a loop.'],
    check: { kind: 'script', maps: [['...*', '..*.', '.*..', '>...']], require: { uses: ['def'] } }
  }),
  A(4, 3, {
    title: 'A recipe with a number', tutor: 'tadka',
    say: 'Recipes can take ingredients! walk(n) steps n squares and turns right. Use it to make a spiral.',
    goal: 'Finish walk(n), then spiral in to collect all six sparks.',
    starter: 'def walk(n):\n    step(n)\n\nwalk(4)\n',
    solution: 'def walk(n):\n    step(n)\n    turn_right()\n\nwalk(4)\nwalk(4)\nwalk(4)\nwalk(3)\nwalk(3)\nwalk(2)\n',
    hints: ['Add turn_right() inside walk.', 'The sides get shorter: 4, 4, 4, 3, 3, 2.'],
    check: { kind: 'script', maps: [['>...*', '*..*.', '.....', '...*.', '*...*']], require: { uses: ['def'] } }
  }),
  A(4, 4, {
    title: "Glitch's bad recipe", tutor: 'glitch', debug: true,
    say: 'I swapped one turn in the stair recipe. Now Vinc dances in circles! Hee hee!',
    goal: 'Fix stair() so Vinc goes down the stairs.',
    starter: 'def stair():\n    step()\n    turn_right()\n    step()\n    turn_right()\n\nfor i in range(3):\n    stair()\n',
    solution: 'def stair():\n    step()\n    turn_right()\n    step()\n    turn_left()\n\nfor i in range(3):\n    stair()\n',
    hints: ['After going down, Vinc must face right again.', 'The last turn should be turn_left().'],
    check: { kind: 'script', maps: [['>...', '.*..', '..*.', '...*']], require: { uses: ['def', 'for'] } }
  }),
  A(4, 5, {
    title: 'Hurdle side', tutor: 'tadka',
    say: 'Every side of this square has a crate in the middle. Make a side() recipe and use it 4 times.',
    goal: 'Go round the square with a side() function and a loop.',
    starter: 'def side():\n    step()\n\n',
    solution: 'def side():\n    step()\n    jump()\n    step()\n    turn_right()\n\nfor i in range(4):\n    side()\n',
    hints: ['A side is: step(), jump(), step(), turn_right().'],
    check: { kind: 'script', maps: [['>.#.*', '.....', '#...#', '.....', '*.#.*']], require: { uses: ['def', 'for', 'jump'] } }
  }),
  A(4, 6, {
    title: 'There and back', tutor: 'tadka',
    say: 'Recipes can use other recipes! go_and_back() goes 2 squares and comes back, using turn_around().',
    goal: 'Collect the four sparks around Vinc.',
    starter: 'def turn_around():\n    turn_left()\n    turn_left()\n\nstep(2)\nturn_around()\nstep(2)\n',
    solution: 'def turn_around():\n    turn_left()\n    turn_left()\n\ndef go_and_back():\n    step(2)\n    turn_around()\n    step(2)\n    turn_around()\n\nfor i in range(4):\n    go_and_back()\n    turn_right()\n',
    hints: ['Make def go_and_back(): with step(2), turn_around(), step(2), turn_around().', 'Loop 4 times: go_and_back(), then turn_right().'],
    check: { kind: 'script', maps: [['..*..', '.....', '*.^.*', '.....', '..*..']], require: { uses: ['def'] } }
  }),
  A(4, 7, {
    title: 'Shrinking spiral', tutor: 'pocket',
    say: 'Pocket here, helping Chef Tadka! Keep the side length in a variable n, and make it 1 smaller every loop.',
    goal: 'Spiral in to collect every spark, in 9 lines or fewer.',
    starter: 'def walk(n):\n    step(n)\n    turn_right()\n\nwalk(4)\n',
    solution: 'def walk(n):\n    step(n)\n    turn_right()\n\nwalk(4)\nn = 4\nfor i in range(4):\n    walk(n)\n    walk(n)\n    n = n - 1\n',
    hints: ['The sides are 4, then 4 4, 3 3, 2 2, 1 1.', 'n = 4 before the loop, and n = n - 1 at the end of the loop.'],
    check: { kind: 'script', maps: [['>****', '*****', '*****', '*****', '*****']], require: { uses: ['def', 'for', 'variable'], maxLines: 9 } }
  }),
  A(4, 8, {
    title: 'Boss: Factory launch', tutor: 'nova', boss: true,
    say: 'I am Nova. Last test before launch! Make a move() function that decides for itself, then repeat it while sparks are left.',
    goal: 'One program with a move() function solves both boards.',
    starter: 'def move():\n    step()\n\nwhile sparks_left() > 0:\n    move()\n',
    solution: 'def move():\n    if crate_ahead():\n        jump()\n    elif blocked():\n        turn_right()\n    else:\n        step()\n\nwhile sparks_left() > 0:\n    move()\n',
    hints: ['Put the if / elif / else from the Sensor Jungle inside move().'],
    check: { kind: 'script', maps: [['>.#*.#.', '.......', '......*'], ['>#*..', '.....', '....#', '.....', '....*']], require: { uses: ['def', 'while', 'if'] } }
  })
];

export const ADV_CHAPTERS = [
  { n: 1, title: 'Spark Island', idea: 'Steps and turns', tutor: 'pocket' as CharId, theme: 'beach' },
  { n: 2, title: 'Loop Lagoon', idea: 'for loops', tutor: 'loopa' as CharId, theme: 'lagoon' },
  { n: 3, title: 'Sensor Jungle', idea: 'if, else and while', tutor: 'hoot' as CharId, theme: 'jungle' },
  { n: 4, title: 'Function Factory', idea: 'Functions with def', tutor: 'tadka' as CharId, theme: 'factory' }
];
