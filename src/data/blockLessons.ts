/**
 * Block lessons for Classes 3 and 4. Students snap blocks together instead of typing.
 * Board symbols are the same as the Python lessons: "." floor, "#" crate, "*" spark, ^ > v < Vinc.
 * `npm run check:lessons` runs every model solution (must pass) and starter (must fail) with src/lib/blocks.ts.
 * Stars: the model solution's block count is par (3 stars).
 */
import type { Lesson } from './lessons';

const B = (grade: number, n: number, l: Omit<Lesson, 'id' | 'grade' | 'n'>): Lesson => ({ id: `${grade}-L${n}`, grade, n, ...l });
const C3 = ['step', 'turnLeft', 'turnRight'] as const;
const C4 = ['step', 'turnLeft', 'turnRight', 'repeat'] as const;
const C4J = ['step', 'turnLeft', 'turnRight', 'jump', 'repeat'] as const;

export const BLOCK_LESSONS: Lesson[] = [
  /* ============================ Class 3 · Sequencing ============================ */
  B(3, 1, {
    title: 'Hello, Vinc!', type: 'Learn', guide: 'pip', palette: [...C3],
    intro: 'Hi, I am Pip! My light shows Vinc the way. Vinc does exactly what your blocks say, one block at a time.',
    explain: ['A program is a list of instructions. Vinc runs them from top to bottom.', '`step()` moves Vinc one square forward, the way it is facing.'],
    example: { code: 'step()\nstep()', note: 'Two steps forward.' },
    task: 'The spark is 3 squares away. Add blocks so Vinc reaches it, then press Run.',
    starter: 'step()\n',
    hints: ['Count the squares between Vinc and the spark.', 'You need three `step()` blocks.'],
    solution: 'step()\nstep()\nstep()\n',
    check: { kind: 'blocks', maps: [['....', '>..*', '....']] }
  }),
  B(3, 2, {
    title: 'Two sparks', type: 'Learn', guide: 'vinc', palette: [...C3],
    intro: 'Two sparks on one path! I collect a spark when I roll over it.',
    explain: ['Vinc collects every spark it passes, not only the last one.', 'A lesson is done when every spark on the board is collected.'],
    task: 'Collect both sparks.',
    starter: 'step()\nstep()\n',
    hints: ['The second spark is 4 squares from Vinc.'],
    solution: 'step()\nstep()\nstep()\nstep()\n',
    check: { kind: 'blocks', maps: [['.....', '>.*.*', '.....']] }
  }),
  B(3, 3, {
    title: 'Turn left', type: 'Learn', guide: 'pip', palette: [...C3],
    intro: 'The spark is up there! Vinc has to face it before stepping.',
    explain: ['`turnLeft()` turns Vinc a quarter turn to its own left. Vinc stays on the same square.', 'The little arrow under Vinc shows which way it faces.'],
    example: { code: 'turnLeft()\nstep()', note: 'Facing right, a left turn makes Vinc face up.' },
    task: 'Turn Vinc to face the spark, then step to it.',
    starter: 'step()\nstep()\n',
    hints: ['Turn first, then step.', '`turnLeft()`, then two `step()` blocks.'],
    solution: 'turnLeft()\nstep()\nstep()\n',
    check: { kind: 'blocks', maps: [['*...', '....', '>...']] }
  }),
  B(3, 4, {
    title: 'Turn right', type: 'Learn', guide: 'vinc', palette: [...C3],
    intro: 'Now I need to go along, and then down. Where do I turn?',
    explain: ['`turnRight()` turns Vinc a quarter turn to its right.', 'Order matters: the same blocks in a different order make Vinc go somewhere else.'],
    task: 'Go to the corner, turn right, and step down to the spark.',
    starter: 'step()\nstep()\nstep()\n',
    hints: ['Two steps reach the corner.', 'Then `turnRight()` and two more steps.'],
    solution: 'step()\nstep()\nturnRight()\nstep()\nstep()\n',
    check: { kind: 'blocks', maps: [['>..', '...', '..*']] }
  }),
  B(3, 5, {
    title: 'Glitch mixed the order', type: 'Catch Glitch', palette: [...C3],
    intro: 'Hee hee! I moved one block to the top. Now Vinc walks off the board! Find my bug!',
    explain: ['A bug is a mistake in a program. Finding and fixing it is called debugging.', 'Run the program and watch where Vinc goes wrong. The block that is running glows.'],
    task: 'Move the blocks into the right order so Vinc reaches the spark.',
    starter: 'turnLeft()\nstep()\nstep()\nstep()\nstep()\n',
    hints: ['Vinc should go right first, then up.', 'Two steps, then `turnLeft()`, then two steps.'],
    solution: 'step()\nstep()\nturnLeft()\nstep()\nstep()\n',
    check: { kind: 'blocks', maps: [['..*.', '....', '>...']] }
  }),
  B(3, 6, {
    title: 'Around the crate', type: 'Puzzle', guide: 'pip', palette: [...C3],
    intro: 'A crate is in the way! Vinc cannot go through it, so let us go around.',
    explain: ['If Vinc steps into a crate or off the board, it bumps and stops.', 'Plan the path with your finger on the board first, then build it with blocks.'],
    task: 'Go up, along and back down to reach the spark behind the crate.',
    starter: 'step()\nstep()\nstep()\n',
    hints: ['Start with `turnLeft()` and `step()` to go up.', 'Then turn right and go along two squares, then down, then right.'],
    solution: 'turnLeft()\nstep()\nturnRight()\nstep()\nstep()\nturnRight()\nstep()\nturnLeft()\nstep()\n',
    check: { kind: 'blocks', maps: [['....', '>#.*']] }
  }),
  B(3, 7, {
    title: 'Collect them all', type: 'Puzzle', guide: 'vinc', palette: [...C3],
    intro: 'Four sparks in an L shape! Can I get every one?',
    explain: ['Think about the path as two straight lines with a turn in the middle.'],
    task: 'Collect all four sparks.',
    starter: 'step()\nstep()\nstep()\n',
    hints: ['After the top row, Vinc must turn to face down.', 'step, step, step, `turnRight()`, step, step'],
    solution: 'step()\nstep()\nstep()\nturnRight()\nstep()\nstep()\n',
    check: { kind: 'blocks', maps: [['>*.*', '...*', '...*']] }
  }),
  B(3, 8, {
    title: 'Shortest path', type: 'Puzzle', guide: 'pip', palette: [...C3],
    intro: 'Pip here! Fewer blocks win more stars. Can you find the shortest way to both sparks?',
    explain: ['There is often more than one program that works. The shortest one is usually the best.', 'Your stars: 3 for the fewest blocks, 2 if you are close, 1 if it works.'],
    task: 'Collect both sparks with as few blocks as you can.',
    starter: 'step()\nturnLeft()\nstep()\n',
    hints: ['Get the lower spark first.', 'After it, go right two squares, then up two squares.'],
    solution: 'step()\nturnLeft()\nstep()\nturnRight()\nstep()\nstep()\nturnLeft()\nstep()\nstep()\n',
    check: { kind: 'blocks', maps: [['...*', '....', '.*..', '>...']] }
  }),
  B(3, 9, {
    title: "Glitch's extra step", type: 'Catch Glitch', palette: [...C3],
    intro: 'I snuck in one extra step. Bonk! Vinc hits the crate every time. Hee hee!',
    explain: ['Sometimes a bug is one block too many. Run the program and see where Vinc bumps.'],
    task: 'Remove Glitch\'s extra block so Vinc reaches the spark.',
    starter: 'step()\nstep()\nturnRight()\nstep()\nstep()\nturnLeft()\nstep()\nstep()\n',
    hints: ['Vinc bumps on the second block.', 'Delete one `step()` before the first turn.'],
    solution: 'step()\nturnRight()\nstep()\nstep()\nturnLeft()\nstep()\nstep()\n',
    check: { kind: 'blocks', maps: [['>.#.', '....', '...*']] }
  }),
  B(3, 10, {
    title: 'One plan, two rooms', type: 'Challenge', guide: 'vinc', palette: [...C3],
    intro: 'Two rooms with different crates and sparks. Can one program work in both?',
    explain: ['A good program can work in more than one place.', 'Use the Board tabs to watch Vinc in each room.'],
    task: 'Write one program that collects every spark on both boards.',
    starter: 'step()\nturnRight()\nstep()\nstep()\n',
    hints: ['Go along the top row first. It is free in both rooms.', 'step, step, `turnRight()`, step, step'],
    solution: 'step()\nstep()\nturnRight()\nstep()\nstep()\n',
    check: { kind: 'blocks', maps: [['>..', '.#.', '..*'], ['>*.', '...', '#.*']] }
  }),
  B(3, 11, {
    title: 'Spark spiral', type: 'Challenge', guide: 'pip', palette: [...C3],
    intro: 'Three sparks in three corners. My light says: up, across, down!',
    explain: ['Long programs are easier when you split them into parts: first the up part, then the across part, then the down part.'],
    task: 'Collect the three corner sparks.',
    starter: 'step()\nstep()\nstep()\nturnLeft()\n',
    hints: ['After going up, Vinc must turn right, not left.', 'Up 3, `turnRight()`, across 3, `turnRight()`, down 3.'],
    solution: 'step()\nstep()\nstep()\nturnRight()\nstep()\nstep()\nstep()\nturnRight()\nstep()\nstep()\nstep()\n',
    check: { kind: 'blocks', maps: [['*..*', '....', '....', '^..*']] }
  }),
  B(3, 12, {
    title: 'Boss: Spring legs', type: 'Boss', guide: 'vinc', palette: [...C3],
    intro: 'My Spring legs are at the end of this crate maze! Use everything you learnt: steps, turns and the right order.',
    explain: ['Trace the path with your finger first. Write one block for each move and each turn.'],
    task: 'Find a way through the crates to collect both sparks.',
    starter: 'step()\n',
    hints: ['Go down at the first crate.', 'step, `turnRight()`, step, `turnLeft()`, step, step, then down and right.'],
    solution: 'step()\nturnRight()\nstep()\nturnLeft()\nstep()\nstep()\nturnRight()\nstep()\nturnLeft()\nstep()\n',
    check: { kind: 'blocks', maps: [['>.#..', '#.*.#', '..#.*']] }
  }),

  /* ============================ Class 4 · Loops and jumps ============================ */
  B(4, 1, {
    title: 'Repeat the step', type: 'Learn', guide: 'loopa', palette: [...C4],
    intro: 'Hello, I am Loopa! I go round and round. A repeat block does the same thing again and again, like me!',
    explain: ['`repeat 7` runs the blocks inside it 7 times.', 'Drop blocks inside the repeat. Tap the number to change how many times.'],
    example: { code: 'repeat 3:\n  step()', note: 'The same as three step() blocks.' },
    task: 'Reach the spark at the end of the long hallway, using a repeat block.',
    starter: 'step()\nstep()\n',
    hints: ['Count the squares: 7.', 'Use `repeat 7` with one `step()` inside.'],
    solution: 'repeat 7:\n  step()\n',
    check: { kind: 'blocks', maps: [['........', '>......*', '........']], require: { uses: ['repeat'], maxBlocks: 3 } }
  }),
  B(4, 2, {
    title: 'Tall tower', type: 'Learn', guide: 'vinc', palette: [...C4],
    intro: 'Up, up, up the tower! Two sparks on the way.',
    explain: ['Loops work in any direction. Vinc steps the way it is facing.'],
    task: 'Climb to the top with a repeat block. Collect both sparks.',
    starter: 'repeat 2:\n  step()\n',
    hints: ['The top is 5 squares up.'],
    solution: 'repeat 5:\n  step()\n',
    check: { kind: 'blocks', maps: [['.*.', '...', '.*.', '...', '...', '.^.']], require: { uses: ['repeat'], maxBlocks: 3 } }
  }),
  B(4, 3, {
    title: 'Square dance', type: 'Learn', guide: 'loopa', palette: [...C4],
    intro: 'A square has 4 sides that are all the same. That is a pattern! Patterns love loops.',
    explain: ['A repeat can hold more than one block. All of them run, in order, each time round.', 'Find the part that repeats: 3 steps and a turn.'],
    example: { code: 'repeat 2:\n  step()\n  turnRight()' },
    task: 'Walk around the edge of the board to collect the three corner sparks.',
    starter: 'step()\nstep()\nstep()\nturnRight()\n',
    hints: ['Put the four blocks you have inside `repeat 4`.'],
    solution: 'repeat 4:\n  step()\n  step()\n  step()\n  turnRight()\n',
    check: { kind: 'blocks', maps: [['>..*', '....', '....', '*..*']], require: { uses: ['repeat'], maxBlocks: 6 } }
  }),
  B(4, 4, {
    title: 'Staircase', type: 'Puzzle', guide: 'vinc', palette: [...C4],
    intro: 'Step, up, step, up. Do you see the pattern in these stairs?',
    explain: ['Look for the smallest piece that repeats. Here it is: step, turn left, step, turn right.'],
    task: 'Climb the stairs and collect all three sparks with at most 6 blocks.',
    starter: 'step()\nturnLeft()\nstep()\nturnRight()\n',
    hints: ['Put the 4 blocks inside a repeat.', 'How many stairs are there? 3.'],
    solution: 'repeat 3:\n  step()\n  turnLeft()\n  step()\n  turnRight()\n',
    check: { kind: 'blocks', maps: [['...*', '..*.', '.*..', '>...']], require: { uses: ['repeat'], maxBlocks: 6 } }
  }),
  B(4, 5, {
    title: "Glitch's loop", type: 'Catch Glitch', palette: [...C4],
    intro: 'I changed the number in the loop. Vinc rolls right off the end! Hee hee!',
    explain: ['A loop that runs too many times is a common bug. Count carefully!'],
    task: 'Fix the number so Vinc stops on the last spark.',
    starter: 'repeat 7:\n  step()\n',
    hints: ['There are 5 sparks in a row.'],
    solution: 'repeat 5:\n  step()\n',
    check: { kind: 'blocks', maps: [['......', '>*****', '......']], require: { uses: ['repeat'] } }
  }),
  B(4, 6, {
    title: 'Loop around crates', type: 'Puzzle', guide: 'loopa', palette: [...C4],
    intro: 'Two crates, the same shape twice. Write the detour once and loop it!',
    explain: ['If you write the same blocks twice, a loop can do it for you.', 'Make sure Vinc ends each round facing the same way it started.'],
    task: 'Go around both crates to collect both sparks, using a repeat.',
    starter: 'step()\nturnLeft()\nstep()\nturnRight()\nstep()\nstep()\nturnRight()\nstep()\nturnLeft()\n',
    hints: ['The starter goes around one crate. Put it all inside `repeat 2`.'],
    solution: 'repeat 2:\n  step()\n  turnLeft()\n  step()\n  turnRight()\n  step()\n  step()\n  turnRight()\n  step()\n  turnLeft()\n',
    check: { kind: 'blocks', maps: [['.......', '>.#*.#*']], require: { uses: ['repeat'] } }
  }),
  B(4, 7, {
    title: 'First jump', type: 'Learn', guide: 'vinc', palette: [...C4J],
    intro: 'I got springs! Now I can jump over one crate.',
    explain: ['`jump()` hops over the next square and lands on the one after it: 2 squares forward.', 'Vinc cannot land on a crate, and cannot jump over two crates.'],
    example: { code: 'step()\njump()' },
    task: 'Jump over the crate to reach the spark.',
    starter: 'step()\nstep()\nstep()\n',
    hints: ['Step to the crate first, then jump, then step.'],
    solution: 'step()\njump()\nstep()\n',
    check: { kind: 'blocks', maps: [['.....', '>.#.*']], require: { uses: ['jump'] } }
  }),
  B(4, 8, {
    title: 'Crate hurdles', type: 'Puzzle', guide: 'loopa', palette: [...C4J],
    intro: 'Hurdles! Step, jump, step, jump. A loop can do all that.',
    explain: ['Loops work with jumps too. Find the pattern: step, then jump.'],
    task: 'Clear all three hurdles and collect the sparks, with a repeat.',
    starter: 'repeat 3:\n  step()\n',
    hints: ['Inside the repeat: `step()` then `jump()`.'],
    solution: 'repeat 3:\n  step()\n  jump()\n',
    check: { kind: 'blocks', maps: [['..........', '>.#*.#*.#*']], require: { uses: ['repeat', 'jump'], maxBlocks: 4 } }
  }),
  B(4, 9, {
    title: 'Glitch broke my legs', type: 'Catch Glitch', palette: [...C4J],
    intro: 'I swapped a jump for a step. Bonk, bonk! Fix it if you can!',
    explain: ['Read each block and ask: what will Vinc do here? Is there a crate in front?'],
    task: 'Change one block so Vinc jumps the crates and collects both sparks.',
    starter: 'repeat 2:\n  step()\n',
    hints: ['There is a crate right in front of Vinc. Can it step there?', 'Change `step()` to `jump()`.'],
    solution: 'repeat 2:\n  jump()\n',
    check: { kind: 'blocks', maps: [['.....', '>#*#*']], require: { uses: ['jump', 'repeat'] } }
  }),
  B(4, 10, {
    title: 'Loops inside loops', type: 'Learn', guide: 'loopa', palette: [...C4],
    intro: 'A loop inside a loop is like me going round my shell while my shell goes round the garden!',
    explain: ['A repeat can go inside another repeat. The inside loop runs fully, every time the outside loop goes round once.', 'This is called a nested loop.'],
    example: { code: 'repeat 2:\n  repeat 3:\n    step()\n  turnRight()', note: '3 steps and a turn, done twice: 8 moves from 4 blocks.' },
    task: 'Walk all four sides of the big square, collecting every spark, with at most 5 blocks.',
    starter: 'repeat 4:\n  step()\nturnRight()\n',
    hints: ['Each side is 4 steps and a turn.', 'Outside: `repeat 4`. Inside it: `repeat 4` with `step()`, then `turnRight()`.'],
    solution: 'repeat 4:\n  repeat 4:\n    step()\n  turnRight()\n',
    check: { kind: 'blocks', maps: [['>.*.*', '.....', '*...*', '.....', '*.*.*']], require: { uses: ['repeat'], maxBlocks: 5 } }
  }),
  B(4, 11, {
    title: 'Hurdle square', type: 'Challenge', guide: 'vinc', palette: [...C4J],
    intro: 'A square with a crate in the middle of every side. Step, jump, step, turn!',
    explain: ['Combine everything: a loop, jumps and turns. Each side has the same pattern.'],
    task: 'Go all the way round, jumping every crate, with at most 6 blocks.',
    starter: 'repeat 4:\n  step()\n  step()\n  step()\n  step()\n  turnRight()\n',
    hints: ['Each side: `step()`, `jump()`, `step()`, then `turnRight()`.'],
    solution: 'repeat 4:\n  step()\n  jump()\n  step()\n  turnRight()\n',
    check: { kind: 'blocks', maps: [['>.#.*', '.....', '#...#', '.....', '*.#.*']], require: { uses: ['repeat', 'jump'], maxBlocks: 6 } }
  }),
  B(4, 12, {
    title: 'Boss: Sensor antenna', type: 'Boss', guide: 'vinc', palette: [...C4J],
    intro: 'My Sensor antenna is at the top of the hurdle stairs! Jump, climb, and loop your way up.',
    explain: ['Find the piece that repeats: jump a crate, turn, climb one step, turn back.'],
    task: 'Climb the hurdle stairs and collect all three sparks, with at most 6 blocks.',
    starter: 'jump()\nturnLeft()\nstep()\nturnRight()\n',
    hints: ['Put the starter blocks inside a repeat.', 'There are three stairs.'],
    solution: 'repeat 3:\n  jump()\n  turnLeft()\n  step()\n  turnRight()\n',
    check: { kind: 'blocks', maps: [['.......', '......*', '....*#.', '..*#...', '>#.....']], require: { uses: ['repeat', 'jump'], maxBlocks: 6 } }
  })
];
